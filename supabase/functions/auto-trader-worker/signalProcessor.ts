/**
 * Signal Processor
 * 
 * Processes signals from database and prepares for execution
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { WORKER_CONFIG } from './config.ts';

// Type definitions (inlined for Deno Edge Function)
export type ExecutionStatus = 'PENDING' | 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED';

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
  execution_status?: ExecutionStatus;
  execution_reason?: string | null;
}

/**
 * Fetch pending signals
 */
export async function fetchPendingSignals(
  supabaseClient: ReturnType<typeof createClient>,
  limit: number = WORKER_CONFIG.MAX_SIGNALS_PER_RUN
): Promise<ProcessingSignal[]> {
  const { data, error } = await supabaseClient
    .from('tradingview_signals')
    .select('*')
    .eq('execution_status', 'PENDING')
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching pending signals:', error);
    throw error;
  }
  
  return (data || []).map(signal => ({
    id: signal.id,
    user_id: signal.user_id,
    symbol: signal.symbol,
    signal_type: signal.signal_type,
    entry_price: signal.entry_price,
    stop_loss_price: signal.stop_loss_price,
    take_profit_price: signal.take_profit_price,
    confidence_score: signal.confidence_score,
    strategy_name: signal.strategy_name,
    timeframe: signal.timeframe,
    created_at: signal.created_at,
    execution_status: signal.execution_status || 'PENDING',
    execution_reason: signal.execution_reason
  }));
}

/**
 * Update signal execution status
 */
export async function updateSignalStatus(
  supabaseClient: ReturnType<typeof createClient>,
  signalId: string,
  status: ExecutionStatus,
  reason?: string,
  tradeId?: string,
  error?: string
): Promise<void> {
  const updateData: any = {
    execution_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (reason) {
    updateData.execution_reason = reason;
  }
  
  if (tradeId) {
    updateData.executed_trade_id = tradeId;
  }
  
  if (error) {
    updateData.execution_error = error;
  }
  
  if (status === 'EXECUTING') {
    updateData.execution_started_at = new Date().toISOString();
    updateData.execution_attempts = (await supabaseClient
      .from('tradingview_signals')
      .select('execution_attempts')
      .eq('id', signalId)
      .single()).data?.execution_attempts || 0;
    updateData.execution_attempts += 1;
  }
  
  if (status === 'EXECUTED' || status === 'FAILED' || status === 'FILTERED' || status === 'IGNORED') {
    updateData.execution_completed_at = new Date().toISOString();
  }
  
  const { error: updateError } = await supabaseClient
    .from('tradingview_signals')
    .update(updateData)
    .eq('id', signalId);
  
  if (updateError) {
    console.error('Error updating signal status:', updateError);
    throw updateError;
  }
}

/**
 * Get user bot settings
 */
export async function getUserBotSettings(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<any | null> {
  const { data, error } = await supabaseClient
    .from('bot_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found
      return null;
    }
    console.error('Error fetching bot settings:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get user API keys
 * 
 * Supports both UUID (api_key id) and platform name
 */
export async function getUserApiKeys(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  platformOrId?: string
): Promise<any[]> {
  let query = supabaseClient
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (platformOrId) {
    // Check if it's a UUID (api_key id) or platform name
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters with dashes)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(platformOrId);
    
    if (isUUID) {
      // Search by id (UUID)
      query = query.eq('id', platformOrId);
    } else {
      // Search by platform name
      query = query.eq('platform', platformOrId);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get active trades count for user
 */
export async function getActiveTradesCount(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  symbol?: string
): Promise<number> {
  let query = supabaseClient
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');
  
  if (symbol) {
    query = query.eq('symbol', symbol);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Error counting active trades:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get last trade time for symbol
 */
export async function getLastTradeTime(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  symbol: string
): Promise<Date | null> {
  const { data, error } = await supabaseClient
    .from('trades')
    .select('created_at')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No trades found
      return null;
    }
    console.error('Error fetching last trade time:', error);
    return null;
  }
  
  return data ? new Date(data.created_at) : null;
}

/**
 * Check if duplicate trade exists
 */
export async function checkDuplicateTrade(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  symbol: string,
  side: 'buy' | 'sell',
  marketType: 'spot' | 'futures'
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('trades')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('trade_type', marketType)
    .eq('side', side.toUpperCase())
    .eq('status', 'ACTIVE')
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No duplicate found
      return false;
    }
    console.error('Error checking duplicate trade:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Risk Management Functions
 * Phase 5: Risk Management Engine Integration
 */

/**
 * Check if kill switch is active for user
 */
export async function checkKillSwitch(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ isActive: boolean; reason?: string; expiresAt?: string }> {
  const { data, error } = await supabaseClient
    .from('kill_switch_states')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No kill switch found
      return { isActive: false };
    }
    console.error('Error checking kill switch:', error);
    return { isActive: false };
  }
  
  if (!data) {
    return { isActive: false };
  }
  
  // Check if expired
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      // Kill switch expired
      return { isActive: false };
    }
    return {
      isActive: true,
      reason: data.reason || 'Kill switch is active',
      expiresAt: data.expires_at
    };
  }
  
  return {
    isActive: true,
    reason: data.reason || 'Kill switch is active'
  };
}

/**
 * Calculate daily PnL for user
 */
export async function calculateDailyPnL(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  currentEquity: number
): Promise<{ dailyPnL: number; dailyPnLPercentage: number }> {
  // Get today's date in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStart = tomorrow.toISOString();
  
  // Get trades closed today
  const { data: closedTrades, error } = await supabaseClient
    .from('trades')
    .select('realized_pnl, total_invested')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .gte('closed_at', todayStart)
    .lt('closed_at', tomorrowStart);
  
  if (error) {
    console.error('Error calculating daily PnL:', error);
    return { dailyPnL: 0, dailyPnLPercentage: 0 };
  }
  
  // Calculate realized PnL
  const realizedPnL = (closedTrades || []).reduce((sum, trade) => {
    return sum + (Number(trade.realized_pnl) || 0);
  }, 0);
  
  // Get active trades for unrealized PnL
  const { data: activeTrades } = await supabaseClient
    .from('trades')
    .select('unrealized_pnl, total_invested')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');
  
  const unrealizedPnL = (activeTrades || []).reduce((sum, trade) => {
    return sum + (Number(trade.unrealized_pnl) || 0);
  }, 0);
  
  const dailyPnL = realizedPnL + unrealizedPnL;
  const dailyPnLPercentage = currentEquity > 0 ? (dailyPnL / currentEquity) * 100 : 0;
  
  return { dailyPnL, dailyPnLPercentage };
}

/**
 * Calculate current drawdown
 */
export async function getDrawdownInfo(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  currentEquity: number
): Promise<{ currentDrawdown: number; currentDrawdownPercentage: number; peakEquity: number }> {
  // Get latest risk snapshot for peak equity
  const { data: latestSnapshot } = await supabaseClient
    .from('risk_snapshots')
    .select('peak_equity')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  // Get bot settings for starting equity
  const botSettings = await getUserBotSettings(supabaseClient, userId);
  const startingEquity = Number(botSettings?.total_capital) || currentEquity;
  
  // Calculate peak equity (max of current, starting, or snapshot)
  const peakEquity = Math.max(
    currentEquity,
    startingEquity,
    Number(latestSnapshot?.peak_equity) || startingEquity
  );
  
  // Update peak if current is higher
  if (currentEquity > peakEquity) {
    // Peak equity will be updated in next snapshot
  }
  
  const currentDrawdown = peakEquity - currentEquity;
  const currentDrawdownPercentage = peakEquity > 0 ? (currentDrawdown / peakEquity) * 100 : 0;
  
  return {
    currentDrawdown,
    currentDrawdownPercentage,
    peakEquity
  };
}

/**
 * Calculate total exposure
 */
export async function calculateTotalExposure(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  currentEquity: number
): Promise<{ totalExposure: number; totalExposurePercentage: number; symbolExposures: Record<string, number> }> {
  const { data: activeTrades, error } = await supabaseClient
    .from('trades')
    .select('symbol, total_invested')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');
  
  if (error) {
    console.error('Error calculating exposure:', error);
    return { totalExposure: 0, totalExposurePercentage: 0, symbolExposures: {} };
  }
  
  let totalExposure = 0;
  const symbolExposures: Record<string, number> = {};
  
  (activeTrades || []).forEach(trade => {
    const invested = Number(trade.total_invested) || 0;
    totalExposure += invested;
    
    if (!symbolExposures[trade.symbol]) {
      symbolExposures[trade.symbol] = 0;
    }
    symbolExposures[trade.symbol] += invested;
  });
  
  const totalExposurePercentage = currentEquity > 0 ? (totalExposure / currentEquity) * 100 : 0;
  
  return { totalExposure, totalExposurePercentage, symbolExposures };
}

/**
 * Evaluate risk for signal
 */
export async function evaluateRisk(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  symbol: string,
  botSettings: any
): Promise<{ allowed: boolean; reason?: string; adjustedCapital?: number; flags: string[] }> {
  const flags: string[] = [];
  
  // Get current equity
  const currentEquity = Number(botSettings.total_capital) || 1000;
  
  // 1. Check kill switch
  const killSwitch = await checkKillSwitch(supabaseClient, userId);
  if (killSwitch.isActive) {
    return {
      allowed: false,
      reason: killSwitch.reason || 'Kill switch is active',
      flags: ['KILL_SWITCH_ACTIVE']
    };
  }
  
  // 2. Check daily loss limit
  const dailyPnL = await calculateDailyPnL(supabaseClient, userId, currentEquity);
  const maxDailyLossUsd = Number(botSettings.max_daily_loss_usd);
  const maxDailyLossPct = Number(botSettings.max_daily_loss_pct);
  
  if (maxDailyLossUsd && dailyPnL.dailyPnL < -maxDailyLossUsd) {
    return {
      allowed: false,
      reason: `Daily loss limit exceeded (${dailyPnL.dailyPnL.toFixed(2)} USD < -${maxDailyLossUsd} USD)`,
      flags: ['DAILY_LOSS_LIMIT_EXCEEDED']
    };
  }
  
  if (maxDailyLossPct && dailyPnL.dailyPnLPercentage < -maxDailyLossPct) {
    return {
      allowed: false,
      reason: `Daily loss limit exceeded (${dailyPnL.dailyPnLPercentage.toFixed(2)}% < -${maxDailyLossPct}%)`,
      flags: ['DAILY_LOSS_LIMIT_EXCEEDED']
    };
  }
  
  if (dailyPnL.dailyPnL < 0) {
    flags.push('DAILY_LOSS');
  }
  
  // 3. Check drawdown limit
  const drawdown = await getDrawdownInfo(supabaseClient, userId, currentEquity);
  const maxDrawdownPct = Number(botSettings.max_drawdown_pct);
  
  if (maxDrawdownPct && drawdown.currentDrawdownPercentage > maxDrawdownPct) {
    return {
      allowed: false,
      reason: `Max drawdown exceeded (${drawdown.currentDrawdownPercentage.toFixed(2)}% > ${maxDrawdownPct}%)`,
      flags: ['MAX_DRAWDOWN_EXCEEDED']
    };
  }
  
  if (drawdown.currentDrawdownPercentage > maxDrawdownPct * 0.8) {
    flags.push('HIGH_DRAWDOWN');
  }
  
  // 4. Check exposure limits
  const exposure = await calculateTotalExposure(supabaseClient, userId, currentEquity);
  const maxExposureTotalPct = Number(botSettings.max_exposure_pct_total) || 80;
  const maxExposurePerSymbolPct = Number(botSettings.max_exposure_pct_per_symbol) || 30;
  
  if (exposure.totalExposurePercentage >= maxExposureTotalPct) {
    return {
      allowed: false,
      reason: `Total exposure limit exceeded (${exposure.totalExposurePercentage.toFixed(2)}% >= ${maxExposureTotalPct}%)`,
      flags: ['MAX_EXPOSURE_EXCEEDED']
    };
  }
  
  const symbolExposurePct = (exposure.symbolExposures[symbol] || 0) / currentEquity * 100;
  if (symbolExposurePct >= maxExposurePerSymbolPct) {
    return {
      allowed: false,
      reason: `Symbol exposure limit exceeded for ${symbol} (${symbolExposurePct.toFixed(2)}% >= ${maxExposurePerSymbolPct}%)`,
      flags: ['MAX_SYMBOL_EXPOSURE_EXCEEDED']
    };
  }
  
  if (exposure.totalExposurePercentage > maxExposureTotalPct * 0.8) {
    flags.push('HIGH_EXPOSURE');
  }
  
  // 5. Calculate adjusted capital (if needed)
  let adjustedCapital = currentEquity;
  
  // Reduce capital if near limits
  if (drawdown.currentDrawdownPercentage > maxDrawdownPct * 0.6) {
    adjustedCapital *= 0.7; // Reduce 30%
    flags.push('CAPITAL_REDUCED_DRAWDOWN');
  }
  
  if (exposure.totalExposurePercentage > maxExposureTotalPct * 0.6) {
    adjustedCapital *= 0.8; // Reduce 20%
    flags.push('CAPITAL_REDUCED_EXPOSURE');
  }
  
  return {
    allowed: true,
    adjustedCapital: adjustedCapital < currentEquity ? adjustedCapital : undefined,
    flags
  };
}

