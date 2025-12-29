/**
 * Legacy Engine Signals Adapter
 * 
 * Fetches signals from Legacy Local Engine (trading_signals)
 */

import type { UnifiedSignal, BotConfig, SignalAdapterResult } from '../types';

/**
 * Convert Legacy signal from database to UnifiedSignal
 */
function mapLegacySignalToUnified(row: any, userId: string): UnifiedSignal {
  const signalType = row.signal_type || '';
  const isBuy = signalType.includes('BUY');
  const side = isBuy ? 'BUY' : 'SELL';
  
  return {
    id: row.id,
    user_id: userId,
    symbol: row.symbol,
    timeframe: row.timeframe || '15m',
    side,
    entryPrice: row.entry_price,
    stopLoss: row.stop_loss_price,
    takeProfit: row.take_profit_price,
    leverage: row.leverage,
    confidence: row.confidence_score,
    source: 'legacy',
    raw: row,
    generatedAt: row.created_at,
    strategy_name: row.strategy_name || 'Legacy Engine',
    signal_type: isBuy ? 'BUY' : 'SELL'
  };
}

/**
 * Get Legacy signal for bot
 */
export async function getLegacySignalForBot(
  supabaseClient: any,
  bot: BotConfig
): Promise<SignalAdapterResult> {
  try {
    // Build query for active signals
    let query = supabaseClient
      .from('trading_signals')
      .select('*')
      .eq('user_id', bot.user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by symbol if specified
    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      query = query.in('symbol', bot.allowed_symbols);
    }

    // Filter by timeframe if specified
    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    // Filter by confidence if specified
    const minConfidence = bot.min_confidence || 70;
    query = query.gte('confidence_score', minConfidence);

    // Only get fresh signals (last 30 minutes)
    const minTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    query = query.gte('created_at', minTimestamp);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Legacy signal:', error);
      return {
        signal: null,
        error: error.message,
        source: 'legacy'
      };
    }

    if (!data || data.length === 0) {
      return {
        signal: null,
        error: 'No Legacy signals found',
        source: 'legacy'
      };
    }

    const signal = mapLegacySignalToUnified(data[0], bot.user_id);

    return {
      signal,
      source: 'legacy'
    };
  } catch (error) {
    console.error('Error in getLegacySignalForBot:', error);
    return {
      signal: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'legacy'
    };
  }
}

