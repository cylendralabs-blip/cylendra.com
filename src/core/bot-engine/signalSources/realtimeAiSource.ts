/**
 * Realtime AI Signals Adapter
 * 
 * Fetches signals from live WebSocket stream (ai_signals_stream)
 * Phase X.8 - Real-Time AI Signal Stream
 */

import type { UnifiedSignal, BotConfig, SignalAdapterResult } from '../types';

/**
 * Get Realtime AI signal for bot
 * 
 * This adapter subscribes to the live WebSocket stream and returns
 * the most recent signal matching the bot's criteria.
 */
export async function getRealtimeAiSignalForBot(
  supabaseClient: any,
  bot: BotConfig
): Promise<SignalAdapterResult> {
  try {
    // For Edge Functions, we'll query the most recent signal from ai_signals_history
    // that was created in the last minute (real-time window)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // Build query
    let query = supabaseClient
      .from('ai_signals_history')
      .select('*')
      .gte('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by symbol if specified
    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      // Convert symbol format if needed (BTC/USDT -> BTCUSDT)
      const symbol = bot.allowed_symbols[0].replace('/', '');
      query = query.eq('symbol', symbol);
    }

    // Filter by timeframe if specified
    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    // Filter by confidence if specified
    const minConfidence = bot.min_confidence || 60; // Higher threshold for real-time
    query = query.gte('final_confidence', minConfidence);

    // Only get BUY or SELL signals (not WAIT)
    query = query.in('side', ['BUY', 'SELL']);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching realtime AI signal:', error);
      return {
        signal: null,
        error: error.message,
        source: 'realtime_ai'
      };
    }

    if (!data || data.length === 0) {
      return {
        signal: null,
        error: 'No realtime AI signals found',
        source: 'realtime_ai'
      };
    }

    const row = data[0];
    const side = row.side === 'BUY' ? 'BUY' : row.side === 'SELL' ? 'SELL' : 'BUY';

    const signal: UnifiedSignal = {
      id: row.id,
      user_id: bot.user_id,
      symbol: row.symbol,
      timeframe: row.timeframe,
      side,
      entryPrice: row.entry_price,
      stopLoss: row.stop_loss,
      takeProfit: row.take_profit,
      confidence: row.final_confidence || row.confidence,
      source: 'realtime_ai',
      raw: row,
      generatedAt: row.created_at,
      strategy_name: 'AI Ultra Signal (Real-Time)',
      signal_type: side === 'BUY' ? 'BUY' : 'SELL'
    };

    return {
      signal,
      source: 'realtime_ai'
    };
  } catch (error) {
    console.error('Error in getRealtimeAiSignalForBot:', error);
    return {
      signal: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'realtime_ai'
    };
  }
}

