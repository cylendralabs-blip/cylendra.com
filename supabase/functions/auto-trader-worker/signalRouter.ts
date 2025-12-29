/**
 * Signal Router (Deno Edge Function Version)
 * 
 * Routes signal requests to the appropriate source based on bot configuration
 * 
 * Phase X.6 - Bot Execution Integration
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type SignalSourceType = 'ai' | 'realtime_ai' | 'tradingview' | 'legacy';

export interface UnifiedSignal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  side: 'BUY' | 'SELL';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
  confidence?: number;
  source: SignalSourceType;
  raw?: any;
  generatedAt: string;
  strategy_name?: string;
  signal_type?: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
}

export interface BotConfig {
  user_id: string;
  is_active: boolean;
  signal_source: SignalSourceType;
  market_type: 'spot' | 'futures';
  allowed_symbols?: string[];
  blacklist_symbols?: string[];
  min_confidence?: number;
  default_timeframe?: string;
  [key: string]: any;
}

/**
 * Load bot configuration from database
 */
export async function loadBotConfig(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<BotConfig | null> {
  try {
    const { data, error } = await supabaseClient
      .from('bot_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error loading bot config:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Get watchlist symbols if available
    const { data: watchlist } = await supabaseClient
      .from('price_watchlist')
      .select('symbol')
      .eq('user_id', userId);

    const allowedSymbols = watchlist?.map((w: any) => w.symbol) || [];

    return {
      user_id: userId,
      is_active: data.is_active || false,
      signal_source: (data.signal_source || 'ai') as SignalSourceType,
      market_type: data.market_type || 'spot',
      allowed_symbols: allowedSymbols.length > 0 ? allowedSymbols : undefined,
      blacklist_symbols: undefined,
      min_confidence: data.min_confidence || undefined,
      default_timeframe: data.default_timeframe || undefined,
      ...data
    };
  } catch (error) {
    console.error('Error in loadBotConfig:', error);
    return null;
  }
}

/**
 * Get AI signal for bot
 */
async function getAiSignalForBot(
  supabaseClient: ReturnType<typeof createClient>,
  bot: BotConfig
): Promise<UnifiedSignal | null> {
  try {
    let query = supabaseClient
      .from('ai_signals_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      query = query.in('symbol', bot.allowed_symbols);
    }

    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    const minConfidence = bot.min_confidence || 55;
    query = query.gte('final_confidence', minConfidence);

    const timeframes = bot.default_timeframe || '15m';
    const isShortTimeframe = ['1m', '3m', '5m', '15m'].includes(timeframes);
    const maxAgeMinutes = isShortTimeframe ? 15 : 60;
    const minTimestamp = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
    query = query.gte('created_at', minTimestamp);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const side = row.final_side === 'BUY' ? 'BUY' : row.final_side === 'SELL' ? 'SELL' : 'BUY';

    return {
      id: row.id,
      user_id: bot.user_id,
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
  } catch (error) {
    console.error('Error in getAiSignalForBot:', error);
    return null;
  }
}

/**
 * Get TradingView signal for bot
 */
async function getTradingViewSignalForBot(
  supabaseClient: ReturnType<typeof createClient>,
  bot: BotConfig
): Promise<UnifiedSignal | null> {
  try {
    let query = supabaseClient
      .from('tradingview_signals')
      .select('*')
      .eq('user_id', bot.user_id)
      .eq('execution_status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1);

    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      query = query.in('symbol', bot.allowed_symbols);
    }

    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    const minConfidence = bot.min_confidence || 70;
    query = query.gte('confidence_score', minConfidence);

    const minTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    query = query.gte('created_at', minTimestamp);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const signalType = row.signal_type || '';
    const isBuy = signalType.includes('BUY');
    const side = isBuy ? 'BUY' : 'SELL';

    return {
      id: row.id,
      user_id: bot.user_id,
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
  } catch (error) {
    console.error('Error in getTradingViewSignalForBot:', error);
    return null;
  }
}

/**
 * Get Realtime AI signal for bot
 */
async function getRealtimeAiSignalForBot(
  supabaseClient: ReturnType<typeof createClient>,
  bot: BotConfig
): Promise<UnifiedSignal | null> {
  try {
    // Query signals from last minute (real-time window)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    let query = supabaseClient
      .from('ai_signals_history')
      .select('*')
      .gte('created_at', oneMinuteAgo)
      .in('side', ['BUY', 'SELL'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      const symbol = bot.allowed_symbols[0].replace('/', '');
      query = query.eq('symbol', symbol);
    }

    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    const minConfidence = bot.min_confidence || 60;
    query = query.gte('final_confidence', minConfidence);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const side = row.side === 'BUY' ? 'BUY' : row.side === 'SELL' ? 'SELL' : 'BUY';

    return {
      id: row.id,
      user_id: bot.user_id,
      symbol: row.symbol,
      timeframe: row.timeframe,
      side,
      entryPrice: row.entry_price,
      stopLoss: row.stop_loss,
      takeProfit: row.take_profit,
      leverage: row.leverage,
      confidence: row.final_confidence || row.confidence,
      source: 'realtime_ai',
      raw: row,
      generatedAt: row.created_at,
      strategy_name: 'AI Ultra Signal (Real-Time)',
      signal_type: side === 'BUY' ? 'BUY' : 'SELL'
    };
  } catch (error) {
    console.error('Error in getRealtimeAiSignalForBot:', error);
    return null;
  }
}

/**
 * Get Legacy signal for bot
 */
async function getLegacySignalForBot(
  supabaseClient: ReturnType<typeof createClient>,
  bot: BotConfig
): Promise<UnifiedSignal | null> {
  try {
    let query = supabaseClient
      .from('trading_signals')
      .select('*')
      .eq('user_id', bot.user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (bot.allowed_symbols && bot.allowed_symbols.length > 0) {
      query = query.in('symbol', bot.allowed_symbols);
    }

    if (bot.default_timeframe) {
      query = query.eq('timeframe', bot.default_timeframe);
    }

    const minConfidence = bot.min_confidence || 70;
    query = query.gte('confidence_score', minConfidence);

    const minTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    query = query.gte('created_at', minTimestamp);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const signalType = row.signal_type || '';
    const isBuy = signalType.includes('BUY');
    const side = isBuy ? 'BUY' : 'SELL';

    return {
      id: row.id,
      user_id: bot.user_id,
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
  } catch (error) {
    console.error('Error in getLegacySignalForBot:', error);
    return null;
  }
}

/**
 * Get next signal for bot from configured source
 */
export async function getNextSignalForBot(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<UnifiedSignal | null> {
  try {
    const bot = await loadBotConfig(supabaseClient, userId);
    
    if (!bot || !bot.is_active) {
      return null;
    }

    const source = bot.signal_source || 'ai';
    let signal: UnifiedSignal | null = null;

    switch (source) {
      case 'ai':
        signal = await getAiSignalForBot(supabaseClient, bot);
        break;
      
      case 'realtime_ai':
        // For realtime_ai, query the most recent signal from last minute
        signal = await getRealtimeAiSignalForBot(supabaseClient, bot);
        break;
      
      case 'tradingview':
        signal = await getTradingViewSignalForBot(supabaseClient, bot);
        break;
      
      case 'legacy':
        signal = await getLegacySignalForBot(supabaseClient, bot);
        break;
      
      default:
        signal = await getAiSignalForBot(supabaseClient, bot);
    }

    return signal;
  } catch (error) {
    console.error('Error in getNextSignalForBot:', error);
    return null;
  }
}

/**
 * Convert UnifiedSignal to ProcessingSignal format
 */
export function convertToProcessingSignal(unified: UnifiedSignal): any {
  const isBuy = unified.side === 'BUY';
  
  return {
    id: unified.id,
    user_id: unified.user_id,
    symbol: unified.symbol,
    signal_type: isBuy ? 'BUY' : 'SELL',
    entry_price: unified.entryPrice || 0,
    stop_loss_price: unified.stopLoss || null,
    take_profit_price: unified.takeProfit || null,
    confidence_score: unified.confidence || 70,
    strategy_name: unified.strategy_name || `${unified.source} Signal`,
    timeframe: unified.timeframe,
    created_at: unified.generatedAt,
    execution_status: 'PENDING'
  };
}

