/**
 * Position Processor
 * 
 * Processes individual positions: updates PnL, monitors TP/SL/DCA, syncs orders
 * 
 * Phase 6: Position Manager
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  shouldTriggerStopLoss,
  shouldTriggerTakeProfit,
  processPositionManagers
} from './managers.ts';
import {
  syncPositionOrders,
  updateOrderStatus
} from './orderSync.ts';

// Type definitions (inlined for Deno Edge Function)
interface Position {
  id: string;
  userId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbol: string;
  side: 'buy' | 'sell';
  status: 'open' | 'closing' | 'closed' | 'failed';
  avgEntryPrice: number;
  positionQty: number;
  leverage?: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  riskState: {
    stopLossPrice: number;
    takeProfitPrice: number | null;
    trailing?: {
      enabled: boolean;
      activationPrice: number;
      distance: number;
      currentStopPrice: number;
    };
    partialTp?: {
      levels: Array<{
        price: number;
        percentage: number;
        executed: boolean;
        executedAt?: string;
      }>;
    };
    breakEven?: {
      enabled: boolean;
      triggerPrice: number;
      activated: boolean;
      activatedAt?: string;
    };
  };
  meta: {
    strategyId: string;
    signalId?: string;
  };
  openedAt: string;
  closedAt?: string;
  updatedAt: string;
}

interface ProcessPositionResult {
  success: boolean;
  positionId: string;
  actions: string[];
  errors: string[];
  updates?: {
    unrealizedPnl?: number;
    positionQty?: number;
    avgEntryPrice?: number;
    status?: string;
  };
}

/**
 * Calculate unrealized PnL for position
 */
function calculateUnrealizedPnl(
  position: Position,
  currentPrice: number
): number {
  if (!currentPrice || !position.avgEntryPrice || position.positionQty <= 0) {
    return 0;
  }

  const leverage = position.leverage || 1;
  const priceDiff = currentPrice - position.avgEntryPrice;
  
  const basePnL = position.side === 'buy' 
    ? priceDiff * position.positionQty
    : -priceDiff * position.positionQty;
  
  const unrealizedPnl = position.marketType === 'futures'
    ? basePnL * leverage
    : basePnL;
  
  return unrealizedPnl;
}

/**
 * Get current price for symbol
 */
async function getCurrentPrice(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  exchange: 'binance' | 'okx'
): Promise<number | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const pricesUrl = `${supabaseUrl}/functions/v1/get-live-prices`;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const response = await fetch(pricesUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbols: [symbol],
        exchange
      })
    });
    
    if (!response.ok) {
      console.error(`Failed to get price for ${symbol}:`, response.status);
      return null;
    }
    
    const data = await response.json();
    const price = data?.prices?.[symbol];
    
    return price ? Number(price) : null;
  } catch (error) {
    console.error(`Error getting price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Process a single position
 */
export async function processPosition(
  supabaseClient: ReturnType<typeof createClient>,
  position: Position
): Promise<ProcessPositionResult> {
  const result: ProcessPositionResult = {
    success: true,
    positionId: position.id,
    actions: [],
    errors: []
  };
  
  try {
    // 1. Get current price
    const currentPrice = await getCurrentPrice(
      supabaseClient,
      position.symbol,
      position.exchange
    );
    
    if (!currentPrice) {
      result.errors.push('Failed to get current price');
      return result;
    }
    
    // 2. Calculate unrealized PnL
    const unrealizedPnl = calculateUnrealizedPnl(position, currentPrice);
    result.updates = { unrealizedPnl };
    result.actions.push(`Updated unrealized PnL: ${unrealizedPnl.toFixed(2)} USD`);
    
    // 3. Fetch kill switch state and risk limits
    let isKillSwitchActive = false;
    let currentDrawdownPct: number | undefined;
    let maxDrawdownPct: number | undefined;
    let dailyPnL: number | undefined;
    let maxDailyLossUsd: number | null = null;
    let maxDailyLossPct: number | null = null;
    let dailyCapital: number | undefined;
    let liquidationPrice: number | null = null;
    
    // Fetch kill switch state
    try {
      const { data: killSwitch } = await supabaseClient
        .from('kill_switch_states')
        .select('is_active')
        .eq('user_id', position.userId)
        .eq('exchange', position.exchange)
        .eq('symbol', position.symbol)
        .eq('is_active', true)
        .maybeSingle();
      
      isKillSwitchActive = killSwitch?.is_active || false;
    } catch (error) {
      console.warn('Error fetching kill switch state:', error);
    }
    
    // Fetch bot settings for risk limits
    try {
      const { data: botSettings } = await supabaseClient
        .from('bot_settings')
        .select('max_daily_loss_usd, max_daily_loss_pct, max_drawdown_pct, total_capital')
        .eq('user_id', position.userId)
        .maybeSingle();
      
      if (botSettings) {
        maxDailyLossUsd = botSettings.max_daily_loss_usd || null;
        maxDailyLossPct = botSettings.max_daily_loss_pct || null;
        maxDrawdownPct = botSettings.max_drawdown_pct || undefined;
        dailyCapital = botSettings.total_capital || undefined;
      }
    } catch (error) {
      console.warn('Error fetching bot settings:', error);
    }
    
    // Calculate daily PnL from trades
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: dailyTrades } = await supabaseClient
        .from('trades')
        .select('realized_pnl')
        .eq('user_id', position.userId)
        .eq('platform', position.exchange)
        .gte('closed_at', today.toISOString());
      
      if (dailyTrades) {
        dailyPnL = dailyTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0);
      }
    } catch (error) {
      console.warn('Error calculating daily PnL:', error);
    }
    
    // Calculate current drawdown from portfolio
    try {
      const { data: portfolio } = await supabaseClient
        .from('portfolios')
        .select('equity, peak_equity')
        .eq('user_id', position.userId)
        .eq('exchange', position.exchange)
        .maybeSingle();
      
      if (portfolio && portfolio.peak_equity && portfolio.equity) {
        currentDrawdownPct = ((portfolio.peak_equity - portfolio.equity) / portfolio.peak_equity) * 100;
      }
    } catch (error) {
      console.warn('Error calculating drawdown:', error);
    }
    
    // Process all managers (TP/SL/DCA/Auto-Close)
    const managerContext = {
      isKillSwitchActive,
      currentDrawdownPct,
      maxDrawdownPct,
      dailyPnL,
      maxDailyLossUsd,
      maxDailyLossPct,
      dailyCapital,
      liquidationPrice
    };
    
    const managerResult = processPositionManagers(
      position,
      currentPrice,
      currentPrice, // Using current price as peak for now (can be enhanced to track separately)
      managerContext
    );
    
    if (managerResult.action === 'close') {
      result.actions.push(managerResult.message || 'Position closing');
      result.updates.status = 'closing';
      // Update position with closing status
      if (managerResult.position) {
        Object.assign(position, managerResult.position);
      }
    } else if (managerResult.action === 'update') {
      result.actions.push(managerResult.message || 'Position updated');
        // Update position with changes
        if (managerResult.position) {
          Object.assign(position, managerResult.position);
          // Note: riskState updates are handled through position object assignment
          // The position object is updated in the database separately
        }
    }
    
    // 7. Sync orders from exchange
    try {
      const syncedOrders = await syncPositionOrders(
        supabaseClient,
        position.id,
        position.userId
      );
      
      if (syncedOrders.length > 0) {
        result.actions.push(`Synced ${syncedOrders.length} orders from exchange`);
        
        // Update order statuses in database
        for (const order of syncedOrders) {
          await updateOrderStatus(supabaseClient, order, position.id);
        }
      }
    } catch (syncError: any) {
      result.errors.push(`Order sync error: ${syncError.message}`);
    }
    
    // 8. Update position in database
    const { error: updateError } = await supabaseClient
      .from('trades')
      .update({
        unrealized_pnl: unrealizedPnl,
        current_price: currentPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', position.id);
    
    if (updateError) {
      result.errors.push(`Failed to update position: ${updateError.message}`);
    } else {
      result.actions.push('Position updated in database');
    }
    
    return result;
    
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message || 'Unknown error processing position');
    return result;
  }
}

/**
 * Fetch all open positions
 */
export async function fetchOpenPositions(
  supabaseClient: ReturnType<typeof createClient>
): Promise<Position[]> {
  try {
    // Fetch trades with status = 'ACTIVE'
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('opened_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching open positions:', error);
      return [];
    }
    
    // Convert to Position format
    const positions: Position[] = (data || []).map((trade: any) => ({
      id: trade.id,
      userId: trade.user_id,
      exchange: (trade.platform?.toLowerCase() as 'binance' | 'okx') || 'binance',
      marketType: trade.trade_type || 'spot',
      symbol: trade.symbol,
      side: trade.side,
      status: 'open' as const,
      avgEntryPrice: Number(trade.entry_price) || 0,
      positionQty: Number(trade.quantity) || 0,
      leverage: trade.leverage ? Number(trade.leverage) : undefined,
      realizedPnlUsd: Number(trade.realized_pnl) || 0,
      unrealizedPnlUsd: Number(trade.unrealized_pnl) || 0,
      riskState: {
        stopLossPrice: Number(trade.stop_loss_price) || 0,
        takeProfitPrice: trade.take_profit_price ? Number(trade.take_profit_price) : null
      },
      meta: {
        strategyId: 'main'
      },
      openedAt: trade.opened_at || new Date().toISOString(),
      updatedAt: trade.updated_at || new Date().toISOString()
    }));
    
    return positions;
    
  } catch (error) {
    console.error('Error fetching open positions:', error);
    return [];
  }
}

/**
 * Log position event
 */
export async function logPositionEvent(
  supabaseClient: ReturnType<typeof createClient>,
  positionId: string,
  userId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  try {
    await supabaseClient
      .from('order_events')
      .insert({
        trade_id: positionId,
        user_id: userId,
        event_type: eventType,
        event_status: 'SUCCESS',
        event_data: eventData,
        source: 'POSITION_MONITOR',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging position event:', error);
  }
}

