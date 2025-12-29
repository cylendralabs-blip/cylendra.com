/**
 * Phase Y: Auto Trading Logging System
 * 
 * Comprehensive logging for every auto-trade decision
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ProcessingSignal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  entry_price: number;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  confidence_score: number;
  strategy_name: string;
  timeframe: string;
  created_at: string;
}

export type AutoTradeStatus = 'accepted' | 'rejected' | 'error' | 'pending';

export type LogStep = 
  | 'signal_received'
  | 'filters_applied'
  | 'limits_checked'
  | 'accepted'
  | 'accepted_for_execution'
  | 'rejected'
  | 'execution_skipped'
  | 'execute_called'
  | 'exchange_response'
  | 'error';

/**
 * Create a new auto_trade record
 */
export async function createAutoTrade(
  supabaseClient: ReturnType<typeof createClient>,
  params: {
    userId: string;
    botId?: string;
    signalId: string;
    signalSource: string;
    pair: string;
    direction: 'long' | 'short';
    status: AutoTradeStatus;
    reasonCode?: string;
    metadata?: Record<string, any>;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('auto_trades')
      .insert({
        user_id: params.userId,
        bot_id: params.botId || null,
        signal_id: params.signalId,
        signal_source: params.signalSource,
        pair: params.pair,
        direction: params.direction,
        status: params.status,
        reason_code: params.reasonCode || null,
        metadata: params.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating auto_trade:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Exception creating auto_trade:', error);
    return null;
  }
}

/**
 * Update auto_trade record
 */
export async function updateAutoTrade(
  supabaseClient: ReturnType<typeof createClient>,
  autoTradeId: string,
  updates: {
    status?: AutoTradeStatus;
    reasonCode?: string;
    executedAt?: Date;
    positionId?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.reasonCode) updateData.reason_code = updates.reasonCode;
    if (updates.executedAt) updateData.executed_at = updates.executedAt.toISOString();
    if (updates.positionId) updateData.position_id = updates.positionId;
    if (updates.metadata) {
      // Merge metadata
      const { data: existing } = await supabaseClient
        .from('auto_trades')
        .select('metadata')
        .eq('id', autoTradeId)
        .single();
      
      updateData.metadata = {
        ...(existing?.metadata || {}),
        ...updates.metadata
      };
    }

    const { error } = await supabaseClient
      .from('auto_trades')
      .update(updateData)
      .eq('id', autoTradeId);

    if (error) {
      console.error('Error updating auto_trade:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating auto_trade:', error);
    return false;
  }
}

/**
 * Add a log entry to auto_trade_logs
 */
export async function addAutoTradeLog(
  supabaseClient: ReturnType<typeof createClient>,
  autoTradeId: string,
  step: LogStep,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('auto_trade_logs')
      .insert({
        auto_trade_id: autoTradeId,
        step,
        message,
        data: data || {}
      });

    if (error) {
      console.error('Error adding auto_trade_log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception adding auto_trade_log:', error);
    return false;
  }
}

/**
 * Normalize signal source name
 */
export function normalizeSignalSource(source: string): string {
  const normalized = source.toLowerCase();
  if (normalized === 'ai' || normalized === 'ai_ultra') return 'ai_ultra';
  if (normalized === 'realtime_ai' || normalized === 'ai_realtime') return 'ai_realtime';
  if (normalized === 'tradingview' || normalized === 'tv') return 'tradingview';
  return 'legacy';
}

/**
 * Get direction from signal type
 */
export function getDirectionFromSignal(signal: ProcessingSignal): 'long' | 'short' {
  const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
  return isBuy ? 'long' : 'short';
}

