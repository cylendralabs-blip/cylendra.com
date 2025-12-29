/**
 * TradingView Signals Adapter
 * 
 * Fetches signals from TradingView webhooks (tradingview_signals)
 */

import type { UnifiedSignal, BotConfig, SignalAdapterResult } from '../types';

/**
 * Convert TradingView signal from database to UnifiedSignal
 */
function mapTradingViewSignalToUnified(row: any, userId: string): UnifiedSignal {
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
    source: 'tradingview',
    raw: row,
    generatedAt: row.created_at,
    strategy_name: row.strategy_name || 'TradingView',
    signal_type: isBuy ? 'BUY' : 'SELL'
  };
}

/**
 * Get TradingView signal for bot
 */
export async function getTradingViewSignalForBot(
  supabaseClient: any,
  bot: BotConfig
): Promise<SignalAdapterResult> {
  try {
    // Build query for pending signals (only internal engine signals)
    let query = supabaseClient
      .from('tradingview_signals')
      .select('*')
      .eq('user_id', bot.user_id)
      .eq('execution_status', 'PENDING')
      // Filter only internal engine signals (not TradingView webhook signals)
      .eq('webhook_data->>source', 'internal_engine')
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
      console.error('Error fetching TradingView signal:', error);
      return {
        signal: null,
        error: error.message,
        source: 'tradingview'
      };
    }

    if (!data || data.length === 0) {
      return {
        signal: null,
        error: 'No TradingView signals found',
        source: 'tradingview'
      };
    }

    const signal = mapTradingViewSignalToUnified(data[0], bot.user_id);

    return {
      signal,
      source: 'tradingview'
    };
  } catch (error) {
    console.error('Error in getTradingViewSignalForBot:', error);
    return {
      signal: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'tradingview'
    };
  }
}

