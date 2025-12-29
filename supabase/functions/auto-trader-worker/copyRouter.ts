/**
 * Copy Trading Router for Auto-Trader Worker
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Handles copying trades from master strategies to followers
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';
import type { ProcessingSignal } from './index.ts';

const logger = createLogger('copy-router');

/**
 * Check if user has a copy strategy linked to their bot
 */
export async function getCopyStrategyForBot(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  botId?: string
): Promise<{ strategyId: string; ownerUserId: string } | null> {
  try {
    if (!botId) {
      return null;
    }

    const { data: strategy, error } = await supabaseClient
      .from('copy_strategies')
      .select('id, owner_user_id, status')
      .eq('bot_id', botId)
      .eq('owner_user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      logger.error('Error fetching copy strategy:', error);
      return null;
    }

    if (!strategy) {
      return null;
    }

    return {
      strategyId: strategy.id,
      ownerUserId: strategy.owner_user_id,
    };
  } catch (error) {
    logger.error('Error in getCopyStrategyForBot:', error);
    return null;
  }
}

/**
 * Handle master trade execution for copy trading
 */
export async function handleMasterTradeExecution(
  supabaseClient: ReturnType<typeof createClient>,
  context: {
    strategyId: string;
    masterUserId: string;
    masterTradeId: string;
    masterSignalExecutionId?: string;
    signal: ProcessingSignal;
    botSettings: any;
    executionResult: any;
  }
): Promise<{
  success: boolean;
  copiedCount: number;
  errors: string[];
}> {
  try {
    // Build master execution context
    const marketType = context.botSettings.market_type === 'futures' ? 'FUTURES' : 'SPOT';
    const side = context.signal.signal_type === 'BUY' || context.signal.signal_type === 'STRONG_BUY'
      ? (marketType === 'FUTURES' ? 'LONG' : 'BUY')
      : (marketType === 'FUTURES' ? 'SHORT' : 'SELL');

    // Calculate position size from execution result or bot settings
    const positionSize = context.executionResult?.positionSize || 
      (context.botSettings.total_capital * (context.botSettings.risk_percentage || 2) / 100);

    const masterContext = {
      strategyId: context.strategyId,
      masterUserId: context.masterUserId,
      masterTradeId: context.masterTradeId,
      masterSignalExecutionId: context.masterSignalExecutionId,
      symbol: context.signal.symbol,
      marketType,
      side,
      leverage: marketType === 'FUTURES' ? (context.botSettings.leverage || 1) : undefined,
      positionSize,
      entryPrice: context.signal.entry_price,
      stopLoss: context.signal.stop_loss_price || undefined,
      takeProfit: context.signal.take_profit_price || undefined,
      direction: 'OPEN' as const,
      timestamp: new Date().toISOString(),
    };

    // Call copy engine via Edge Function
    const copyEngineUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/copy-execute-trade`;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(copyEngineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        action: 'copy_master_trade',
        context: masterContext,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Copy engine failed: ${response.status} - ${errorText}`);
      return {
        success: false,
        copiedCount: 0,
        errors: [`Copy engine error: ${errorText}`],
      };
    }

    const result = await response.json();

    if (result.error) {
      logger.error('Copy engine returned error:', result.error);
      return {
        success: false,
        copiedCount: 0,
        errors: [result.error],
      };
    }

    logger.info(`Copy trading: ${result.copiedCount} trades copied, ${result.failedCount} failed`);
    return {
      success: true,
      copiedCount: result.copiedCount || 0,
      errors: result.errors || [],
    };
  } catch (error) {
    logger.error('Error in handleMasterTradeExecution:', error);
    return {
      success: false,
      copiedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Handle master trade close for copy trading
 */
export async function handleMasterTradeClose(
  supabaseClient: ReturnType<typeof createClient>,
  context: {
    strategyId: string;
    masterUserId: string;
    masterTradeId: string;
    symbol: string;
    marketType: 'SPOT' | 'FUTURES';
    side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
    exitPrice: number;
  }
): Promise<{
  success: boolean;
  closedCount: number;
  errors: string[];
}> {
  try {
    const copyEngineUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/copy-execute-trade`;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(copyEngineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        action: 'close_master_trade',
        context: {
          ...context,
          direction: 'CLOSE',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Copy engine close failed: ${response.status} - ${errorText}`);
      return {
        success: false,
        closedCount: 0,
        errors: [`Copy engine error: ${errorText}`],
      };
    }

    const result = await response.json();

    if (result.error) {
      logger.error('Copy engine close returned error:', result.error);
      return {
        success: false,
        closedCount: 0,
        errors: [result.error],
      };
    }

    logger.info(`Copy trading: ${result.closedCount} trades closed`);
    return {
      success: true,
      closedCount: result.closedCount || 0,
      errors: result.errors || [],
    };
  } catch (error) {
    logger.error('Error in handleMasterTradeClose:', error);
    return {
      success: false,
      closedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

