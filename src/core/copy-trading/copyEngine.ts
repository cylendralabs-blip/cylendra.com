/**
 * Copy Trading Engine - Core Copy Trading Logic
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Main engine that handles copying trades from master strategies to followers
 */

import type {
  MasterExecutionContext,
  FollowerConfig,
  CalculatedPosition,
  RiskCheckResult,
  CopyTradeLog,
} from './types';
import { 
  calculateFollowerPositionSize,
  calculateCopyTradePnL,
  calculateCopyTradePnLAmount,
} from './copyMath';
import { performComprehensiveRiskCheck } from './copyRiskFilters';
import { copyTradingCache, CopyTradingCache } from './copyCache';
import { auditLogTradeCopied, auditLogTradeFailed } from './copyAuditLogger';
import {
  notifyFollowerTradeCopied,
  notifyFollowerTradeClosed,
  notifyFollowerLossLimit,
} from './copyNotifications';

/**
 * Interface for Supabase client (to avoid circular dependencies)
 */
interface SupabaseClient {
  from: (table: string) => any;
}

/**
 * Interface for executing trades
 */
interface TradeExecutor {
  executeTrade: (params: {
    userId: string;
    symbol: string;
    side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
    marketType: 'SPOT' | 'FUTURES';
    positionSize: number;
    entryPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    leverage?: number;
    apiKeyId?: string;
  }) => Promise<{
    success: boolean;
    tradeId?: string;
    error?: string;
  }>;
}

/**
 * Handle master trade execution and copy to followers
 */
export async function handleMasterExecution(
  context: MasterExecutionContext,
  supabaseClient: SupabaseClient,
  tradeExecutor: TradeExecutor
): Promise<{
  success: boolean;
  copiedCount: number;
  failedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let copiedCount = 0;
  let failedCount = 0;

  try {
    // Try to get from cache first
    const cacheKey = CopyTradingCache.getActiveFollowersKey(context.strategyId);
    let followers = copyTradingCache.get<FollowerConfig[]>(cacheKey);

    if (!followers) {
      // Fetch from database
      const { data: followersData, error: followersError } = await supabaseClient
        .from('copy_followers')
        .select('*')
        .eq('strategy_id', context.strategyId)
        .eq('status', 'ACTIVE');

      if (followersError) {
        throw new Error(`Failed to fetch followers: ${followersError.message}`);
      }

      followers = (followersData || []) as FollowerConfig[];

      // Cache for 2 minutes (shorter TTL for active data)
      copyTradingCache.set(cacheKey, followers, 2 * 60 * 1000);
    }

    if (!followers || followers.length === 0) {
      return {
        success: true,
        copiedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    // Process each follower
    for (const follower of followers) {
      try {
        const result = await copyTradeToFollower(
          context,
          follower as FollowerConfig,
          supabaseClient,
          tradeExecutor
        );

        if (result.success) {
          copiedCount++;
        } else {
          failedCount++;
          const followerId = (follower as any).follower_user_id || follower.followerUserId;
          errors.push(`Follower ${followerId}: ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        const followerId = (follower as any).follower_user_id || follower.followerUserId;
        errors.push(`Follower ${followerId}: ${errorMsg}`);
      }
    }

    return {
      success: true,
      copiedCount,
      failedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      copiedCount: 0,
      failedCount: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Copy a trade to a specific follower
 */
async function copyTradeToFollower(
  context: MasterExecutionContext,
  followerConfig: FollowerConfig,
  supabaseClient: SupabaseClient,
  tradeExecutor: TradeExecutor
): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    // Get follower's equity
    const followerEquity = await getFollowerEquity(
      followerConfig.followerUserId,
      supabaseClient
    );

    if (followerEquity <= 0) {
      return {
        success: false,
        error: 'Insufficient equity',
      };
    }

    // Get follower's initial equity (from first copy trade or current equity)
    const followerInitialEquity = await getFollowerInitialEquity(
      followerConfig.followerUserId,
      followerConfig.strategyId,
      followerEquity,
      supabaseClient
    );

    // Get current open trades count
    const openTradesCount = await getFollowerOpenTradesCount(
      followerConfig.followerUserId,
      followerConfig.strategyId,
      supabaseClient
    );

    // Get daily loss amount
    const dailyLossAmount = await getFollowerDailyLoss(
      followerConfig.followerUserId,
      followerConfig.strategyId,
      supabaseClient
    );

    // Get existing positions value
    const existingPositionsValue = await getFollowerPositionsValue(
      followerConfig.followerUserId,
      followerConfig.strategyId,
      supabaseClient
    );

    // Calculate position size
    const calculatedPosition = calculateFollowerPositionSize(
      followerConfig,
      context.positionSize,
      context.entryPrice,
      followerEquity,
      context.leverage
    );

    // Perform comprehensive risk check
    const riskCheck = performComprehensiveRiskCheck(
      followerConfig,
      context.masterUserId,
      followerConfig.followerUserId,
      followerEquity,
      followerInitialEquity,
      openTradesCount,
      dailyLossAmount,
      existingPositionsValue,
      calculatedPosition.positionSize,
      calculatedPosition.leverage,
      context.timestamp
    );

    if (!riskCheck.allowed) {
      // Log skipped trade
      await logCopyTrade(
        {
          strategyId: context.strategyId,
          masterUserId: context.masterUserId,
          followerUserId: followerConfig.followerUserId,
          masterTradeId: context.masterTradeId,
          masterSignalExecutionId: context.masterSignalExecutionId,
          symbol: context.symbol,
          side: context.side,
          marketType: context.marketType,
          leverage: calculatedPosition.leverage,
          masterPositionSize: context.positionSize,
          followerPositionSize: calculatedPosition.positionSize,
          followerAllocationBefore: calculatedPosition.allocationBefore,
          followerAllocationAfter: calculatedPosition.allocationAfter,
          status: 'SKIPPED',
          failReason: riskCheck.reason,
        },
        supabaseClient
      );

      // If total loss limit reached, pause follower
      if (riskCheck.reason?.includes('Total loss limit')) {
        await pauseFollower(followerConfig.id, supabaseClient);
        
        // Notify follower
        try {
          await notifyFollowerLossLimit(
            followerConfig.followerUserId,
            riskCheck.reason || 'Total loss limit reached'
          );
        } catch (notifError) {
          console.error('Error sending loss limit notification:', notifError);
        }
      }

      return {
        success: false,
        error: riskCheck.reason || 'Risk check failed',
      };
    }

    // Get follower's API key
    const apiKeyId = await getFollowerApiKeyId(
      followerConfig.followerUserId,
      context.marketType,
      supabaseClient
    );

    if (!apiKeyId) {
      return {
        success: false,
        error: 'No active API key found for follower',
      };
    }

    // Execute trade for follower (with retry logic handled by error handler)
    const executionResult = await tradeExecutor.executeTrade({
      userId: followerConfig.followerUserId,
      symbol: context.symbol,
      side: context.side,
      marketType: context.marketType,
      positionSize: calculatedPosition.positionSize,
      entryPrice: context.entryPrice,
      stopLoss: context.stopLoss,
      takeProfit: context.takeProfit,
      leverage: calculatedPosition.leverage,
      apiKeyId,
    });

    if (!executionResult.success) {
      // Log failed trade
      await logCopyTrade(
        {
          strategyId: context.strategyId,
          masterUserId: context.masterUserId,
          followerUserId: followerConfig.followerUserId,
          masterTradeId: context.masterTradeId,
          masterSignalExecutionId: context.masterSignalExecutionId,
          symbol: context.symbol,
          side: context.side,
          marketType: context.marketType,
          leverage: calculatedPosition.leverage,
          masterPositionSize: context.positionSize,
          followerPositionSize: calculatedPosition.positionSize,
          followerAllocationBefore: calculatedPosition.allocationBefore,
          followerAllocationAfter: calculatedPosition.allocationAfter,
          status: 'FAILED',
          failReason: executionResult.error,
        },
        supabaseClient
      );

      // Audit log
      try {
        await auditLogTradeFailed(
          followerConfig.followerUserId,
          context.strategyId,
          context.symbol,
          executionResult.error || 'Unknown error'
        );
      } catch (e) {
        // Ignore audit errors
      }

      return {
        success: false,
        error: executionResult.error || 'Trade execution failed',
      };
    }

    // Log successful trade
    const logId = await logCopyTrade(
      {
        strategyId: context.strategyId,
        masterUserId: context.masterUserId,
        followerUserId: followerConfig.followerUserId,
        masterTradeId: context.masterTradeId,
        masterSignalExecutionId: context.masterSignalExecutionId,
        symbol: context.symbol,
        side: context.side,
        marketType: context.marketType,
        leverage: calculatedPosition.leverage,
        masterPositionSize: context.positionSize,
        followerPositionSize: calculatedPosition.positionSize,
        followerAllocationBefore: calculatedPosition.allocationBefore,
        followerAllocationAfter: calculatedPosition.allocationAfter,
        status: 'EXECUTED',
        openedAt: context.timestamp,
      },
      supabaseClient,
      executionResult.tradeId
    );

    // Audit log successful copy
    try {
      await auditLogTradeCopied(
        followerConfig.followerUserId,
        context.strategyId,
        executionResult.tradeId || '',
        context.symbol
      );
    } catch (e) {
      // Ignore audit errors
    }

    // Send notification to follower
    try {
      // Get strategy name
      const { data: strategy } = await supabaseClient
        .from('copy_strategies')
        .select('name')
        .eq('id', context.strategyId)
        .maybeSingle();

      // Get master name (from auth.users or profile)
      const { data: masterUser } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', context.masterUserId)
        .maybeSingle();

      await notifyFollowerTradeCopied(
        followerConfig.followerUserId,
        context.strategyId,
        strategy?.name || 'Unknown Strategy',
        context.masterUserId,
        masterUser?.full_name || masterUser?.email || 'Master',
        context.symbol,
        calculatedPosition.positionSize
      );
    } catch (notifError) {
      // Don't fail the trade if notification fails
      console.error('Error sending notification:', notifError);
    }

    return {
      success: true,
      logId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get follower's total equity (with caching)
 */
async function getFollowerEquity(
  followerUserId: string,
  supabaseClient: SupabaseClient
): Promise<number> {
  try {
    // Try cache first
    const cacheKey = CopyTradingCache.getFollowerEquityKey(followerUserId);
    const cachedEquity = copyTradingCache.get<number>(cacheKey);
    if (cachedEquity !== null) {
      return cachedEquity;
    }

    // Get total balance from portfolio_balances
    const { data: balances, error } = await supabaseClient
      .from('portfolio_balances')
      .select('total_balance')
      .eq('user_id', followerUserId);

    if (error) {
      console.error('Error fetching follower equity:', error);
      return 0;
    }

    // Sum all balances (assuming USDT or base currency)
    const totalEquity = balances?.reduce((sum: number, balance: any) => {
      return sum + (parseFloat(balance.total_balance) || 0);
    }, 0) || 0;

    // Cache for 1 minute (equity changes frequently)
    copyTradingCache.set(cacheKey, totalEquity, 60 * 1000);

    return totalEquity;
  } catch (error) {
    console.error('Error calculating follower equity:', error);
    return 0;
  }
}

/**
 * Get follower's initial equity (when they started copying)
 */
async function getFollowerInitialEquity(
  followerUserId: string,
  strategyId: string,
  currentEquity: number,
  supabaseClient: SupabaseClient
): Promise<number> {
  try {
    // Get first copy trade to determine initial equity
    const { data: firstTrade, error } = await supabaseClient
      .from('copy_trades_log')
      .select('follower_allocation_before')
      .eq('follower_user_id', followerUserId)
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !firstTrade) {
      // If no previous trades, use current equity as initial
      return currentEquity;
    }

    // Calculate initial equity from first trade allocation
    if (firstTrade.follower_allocation_before) {
      // This is approximate - in production, store initial equity separately
      return currentEquity; // For now, use current equity
    }

    return currentEquity;
  } catch (error) {
    console.error('Error getting follower initial equity:', error);
    return currentEquity;
  }
}

/**
 * Get follower's current open trades count
 */
async function getFollowerOpenTradesCount(
  followerUserId: string,
  strategyId: string,
  supabaseClient: SupabaseClient
): Promise<number> {
  try {
    const { data: trades, error } = await supabaseClient
      .from('copy_trades_log')
      .select('id')
      .eq('follower_user_id', followerUserId)
      .eq('strategy_id', strategyId)
      .eq('status', 'EXECUTED')
      .is('closed_at', null);

    if (error) {
      console.error('Error counting open trades:', error);
      return 0;
    }

    return trades?.length || 0;
  } catch (error) {
    console.error('Error getting open trades count:', error);
    return 0;
  }
}

/**
 * Get follower's daily loss amount
 */
async function getFollowerDailyLoss(
  followerUserId: string,
  strategyId: string,
  supabaseClient: SupabaseClient
): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: trades, error } = await supabaseClient
      .from('copy_trades_log')
      .select('pnl_amount')
      .eq('follower_user_id', followerUserId)
      .eq('strategy_id', strategyId)
      .gte('created_at', today.toISOString())
      .not('pnl_amount', 'is', null);

    if (error) {
      console.error('Error getting daily loss:', error);
      return 0;
    }

    const totalLoss = trades?.reduce((sum: number, trade: any) => {
      const pnl = parseFloat(trade.pnl_amount) || 0;
      return sum + (pnl < 0 ? Math.abs(pnl) : 0);
    }, 0) || 0;

    return totalLoss;
  } catch (error) {
    console.error('Error calculating daily loss:', error);
    return 0;
  }
}

/**
 * Get follower's existing positions value
 */
async function getFollowerPositionsValue(
  followerUserId: string,
  strategyId: string,
  supabaseClient: SupabaseClient
): Promise<number> {
  try {
    const { data: trades, error } = await supabaseClient
      .from('copy_trades_log')
      .select('follower_position_size')
      .eq('follower_user_id', followerUserId)
      .eq('strategy_id', strategyId)
      .eq('status', 'EXECUTED')
      .is('closed_at', null);

    if (error) {
      console.error('Error getting positions value:', error);
      return 0;
    }

    const totalValue = trades?.reduce((sum: number, trade: any) => {
      return sum + (parseFloat(trade.follower_position_size) || 0);
    }, 0) || 0;

    return totalValue;
  } catch (error) {
    console.error('Error calculating positions value:', error);
    return 0;
  }
}

/**
 * Get follower's API key ID for the market type
 */
async function getFollowerApiKeyId(
  followerUserId: string,
  marketType: 'SPOT' | 'FUTURES',
  supabaseClient: SupabaseClient
): Promise<string | null> {
  try {
    const { data: apiKeys, error } = await supabaseClient
      .from('api_keys')
      .select('id')
      .eq('user_id', followerUserId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error || !apiKeys) {
      return null;
    }

    return apiKeys.id;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Log copy trade to database
 */
async function logCopyTrade(
  logData: Partial<CopyTradeLog>,
  supabaseClient: SupabaseClient,
  tradeId?: string
): Promise<string> {
  try {
    const logEntry: any = {
      strategy_id: logData.strategyId,
      master_user_id: logData.masterUserId,
      follower_user_id: logData.followerUserId,
      master_trade_id: logData.masterTradeId || tradeId,
      master_signal_execution_id: logData.masterSignalExecutionId,
      symbol: logData.symbol,
      side: logData.side,
      market_type: logData.marketType,
      leverage: logData.leverage,
      master_position_size: logData.masterPositionSize,
      follower_position_size: logData.followerPositionSize,
      follower_allocation_before: logData.followerAllocationBefore,
      follower_allocation_after: logData.followerAllocationAfter,
      status: logData.status,
      fail_reason: logData.failReason,
      opened_at: logData.openedAt,
      closed_at: logData.closedAt,
    };

    const { data, error } = await supabaseClient
      .from('copy_trades_log')
      .insert(logEntry)
      .select('id')
      .single();

    if (error) {
      console.error('Error logging copy trade:', error);
      return '';
    }

    return data.id;
  } catch (error) {
    console.error('Error in logCopyTrade:', error);
    return '';
  }
}

/**
 * Pause follower (auto-pause when limits reached)
 */
async function pauseFollower(
  followerId: string,
  supabaseClient: SupabaseClient
): Promise<void> {
  try {
    await supabaseClient
      .from('copy_followers')
      .update({ status: 'PAUSED' })
      .eq('id', followerId);
  } catch (error) {
    console.error('Error pausing follower:', error);
  }
}

/**
 * Handle master trade close and close follower trades
 */
export async function handleMasterTradeClose(
  context: MasterExecutionContext,
  supabaseClient: SupabaseClient,
  tradeExecutor: TradeExecutor
): Promise<{
  success: boolean;
  closedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let closedCount = 0;

  try {
    // Find all open copied trades for this master trade
    const { data: copiedTrades, error } = await supabaseClient
      .from('copy_trades_log')
      .select('*')
      .eq('master_trade_id', context.masterTradeId)
      .eq('status', 'EXECUTED')
      .is('closed_at', null);

    if (error) {
      throw new Error(`Failed to fetch copied trades: ${error.message}`);
    }

    if (!copiedTrades || copiedTrades.length === 0) {
      return {
        success: true,
        closedCount: 0,
        errors: [],
      };
    }

    // Close each copied trade
    for (const copiedTrade of copiedTrades) {
      try {
        // Get entry price from master trade or use opened_at price
        let entryPrice = 0;
        if (context.masterTradeId) {
          const { data: masterTrade } = await supabaseClient
            .from('trades')
            .select('entry_price')
            .eq('id', context.masterTradeId)
            .maybeSingle();
          
          if (masterTrade?.entry_price) {
            entryPrice = parseFloat(masterTrade.entry_price.toString());
          }
        }
        
        // If we couldn't get entry price from master trade, try to get from position
        if (entryPrice === 0 && copiedTrade.master_trade_id) {
          const { data: masterTrade } = await supabaseClient
            .from('trades')
            .select('entry_price')
            .eq('id', copiedTrade.master_trade_id)
            .maybeSingle();
          
          if (masterTrade?.entry_price) {
            entryPrice = parseFloat(masterTrade.entry_price.toString());
          }
        }

        // Use context.entryPrice as exit price (this is the price at which master closed)
        const exitPrice = context.entryPrice;
        
        // If we still don't have entry price, we can't calculate PnL accurately
        if (entryPrice === 0) {
          console.warn(`Cannot calculate PnL for trade ${copiedTrade.id}: missing entry price`);
        }

        // Execute close trade for follower
        const closeResult = await tradeExecutor.executeTrade({
          userId: copiedTrade.follower_user_id,
          symbol: copiedTrade.symbol,
          side: copiedTrade.side === 'BUY' || copiedTrade.side === 'LONG' ? 'SELL' : 'BUY',
          marketType: copiedTrade.market_type as 'SPOT' | 'FUTURES',
          positionSize: copiedTrade.follower_position_size,
          entryPrice: exitPrice, // Use current price as exit price
          leverage: copiedTrade.leverage,
        });

        if (closeResult.success) {
          // Calculate PnL using actual prices
          let pnlAmount = 0;
          let pnlPercentage = 0;
          
          if (entryPrice > 0 && exitPrice > 0) {
            // Convert side to format expected by calculateCopyTradePnL
            const side = copiedTrade.side === 'BUY' || copiedTrade.side === 'LONG' 
              ? 'LONG' 
              : 'SHORT';
            
            pnlPercentage = calculateCopyTradePnL(
              entryPrice,
              exitPrice,
              side,
              copiedTrade.leverage || undefined
            );
            
            pnlAmount = calculateCopyTradePnLAmount(
              parseFloat(copiedTrade.follower_position_size.toString()),
              entryPrice,
              exitPrice,
              side,
              copiedTrade.leverage || undefined
            );
          }

          // Update copy trade log
          await supabaseClient
            .from('copy_trades_log')
            .update({
              closed_at: context.timestamp,
              pnl_percentage: pnlPercentage,
              pnl_amount: pnlAmount,
            })
            .eq('id', copiedTrade.id);

          // Notify follower
          try {
            await notifyFollowerTradeClosed(
              copiedTrade.follower_user_id,
              copiedTrade.symbol,
              pnlAmount
            );
          } catch (notifError) {
            console.error('Error sending close notification:', notifError);
          }

          closedCount++;
        } else {
          errors.push(`Failed to close trade ${copiedTrade.id}: ${closeResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error closing trade ${copiedTrade.id}: ${errorMsg}`);
      }
    }

    return {
      success: true,
      closedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      closedCount: 0,
      errors: [errorMsg],
    };
  }
}

