/**
 * Signal Router
 * 
 * Routes signal requests to the appropriate source based on bot configuration
 * 
 * Phase X.6 - Bot Execution Integration
 */

import type { UnifiedSignal, BotConfig, SignalSourceType } from './types';
import { getAiSignalForBot } from './signalSources/aiSource';
import { getTradingViewSignalForBot } from './signalSources/tradingviewSource';
import { getLegacySignalForBot } from './signalSources/legacySource';
import { getRealtimeAiSignalForBot } from './signalSources/realtimeAiSource';

/**
 * Load bot configuration from database
 */
export async function loadBotConfig(
  supabaseClient: any,
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
        // No settings found
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
      blacklist_symbols: undefined, // Can be added later
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
 * Get next signal for bot from configured source
 * 
 * This is the main entry point for getting signals in the auto-trading system
 */
export async function getNextSignalForBot(
  supabaseClient: any,
  botId: string
): Promise<UnifiedSignal | null> {
  try {
    // Load bot configuration
    const bot = await loadBotConfig(supabaseClient, botId);
    
    if (!bot) {
      console.warn(`No bot configuration found for user ${botId}`);
      return null;
    }

    // Check if bot is active
    if (!bot.is_active) {
      console.log(`Bot for user ${botId} is not active`);
      return null;
    }

    // Route to appropriate source
    const source = bot.signal_source || 'ai';
    let result;

    switch (source) {
      case 'ai':
        result = await getAiSignalForBot(supabaseClient, bot);
        break;
      
      case 'realtime_ai':
        result = await getRealtimeAiSignalForBot(supabaseClient, bot);
        break;
      
      case 'tradingview':
        result = await getTradingViewSignalForBot(supabaseClient, bot);
        break;
      
      case 'legacy':
        result = await getLegacySignalForBot(supabaseClient, bot);
        break;
      
      default:
        console.warn(`Unknown signal source: ${source}, defaulting to AI`);
        result = await getAiSignalForBot(supabaseClient, bot);
    }

    if (result.error) {
      console.error(`Error fetching signal from ${source}:`, result.error);
      return null;
    }

    return result.signal;
  } catch (error) {
    console.error('Error in getNextSignalForBot:', error);
    return null;
  }
}

/**
 * Convert UnifiedSignal to ProcessingSignal format (for compatibility with existing worker)
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

