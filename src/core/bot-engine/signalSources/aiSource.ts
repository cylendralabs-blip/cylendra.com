/**
 * AI Ultra Signals Adapter
 * 
 * Fetches signals from AI Ultra Signal Engine (ai_signals_history)
 */

import type { UnifiedSignal, BotConfig, SignalAdapterResult } from '../types';

/**
 * Convert AI signal from database to UnifiedSignal
 */
function mapAiSignalToUnified(row: any, userId: string): UnifiedSignal {
  const side = row.final_side === 'BUY' ? 'BUY' : row.final_side === 'SELL' ? 'SELL' : 'BUY';
  
  return {
    id: row.id,
    user_id: userId,
    symbol: row.symbol,
    timeframe: row.timeframe,
    side,
    entryPrice: row.entry_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    leverage: row.leverage,
    confidence: row.final_confidence,
    source: 'ai',
    raw: row,
    generatedAt: row.created_at,
    strategy_name: 'AI Ultra Signal',
    signal_type: side === 'BUY' ? 'BUY' : 'SELL'
  };
}

/**
 * Get AI signal for bot
 */
export async function getAiSignalForBot(
  supabaseClient: any,
  bot: BotConfig
): Promise<SignalAdapterResult> {
  try {
    // Build query
    let query = supabaseClient
      .from('ai_signals_history')
      .select('*')
      .eq('symbol', bot.allowed_symbols?.[0] || 'BTCUSDT') // For now, use first allowed symbol
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by timeframe if specified
    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    // Filter by confidence if specified
    const minConfidence = bot.min_confidence || 55;
    query = query.gte('final_confidence', minConfidence);

    // Only get signals that haven't been executed yet
    // (We'll add an execution tracking field later if needed)
    // For now, we'll use a time-based filter (signals from last 15 minutes for short timeframes, 1 hour for longer)
    const timeframes = bot.default_timeframe || '15m';
    const isShortTimeframe = ['1m', '3m', '5m', '15m'].includes(timeframes);
    const maxAgeMinutes = isShortTimeframe ? 15 : 60;
    const minTimestamp = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
    query = query.gte('created_at', minTimestamp);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching AI signal:', error);
      return {
        signal: null,
        error: error.message,
        source: 'ai'
      };
    }

    if (!data || data.length === 0) {
      return {
        signal: null,
        error: 'No AI signals found',
        source: 'ai'
      };
    }

    const signal = mapAiSignalToUnified(data[0], bot.user_id);

    return {
      signal,
      source: 'ai'
    };
  } catch (error) {
    console.error('Error in getAiSignalForBot:', error);
    return {
      signal: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'ai'
    };
  }
}

