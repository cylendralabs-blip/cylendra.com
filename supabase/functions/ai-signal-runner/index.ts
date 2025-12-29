/**
 * AI Signal Runner Edge Function
 * 
 * Generates AI-powered Ultra Signals
 * Saves signals to ai_signals_history table
 * 
 * Fixed version with proper error handling and signal generation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('ai-signal-runner');

/**
 * Configuration
 */
const CONFIG = {
  DEFAULT_SYMBOLS: ['BTCUSDT', 'ETHUSDT'],
  DEFAULT_TIMEFRAMES: ['15m', '1h', '4h'],
  MIN_CANDLES: 50,
  CANDLE_LIMIT: 150,
  DEFAULT_EXCHANGE: 'binance' as 'binance' | 'okx',
  MIN_CONFIDENCE: 60,
  COOLDOWN_MINUTES: 8, // Cooldown period (slightly less than cron interval of 10 minutes)
  PRICE_CHANGE_THRESHOLD: 0.2, // Minimum price change % to generate new signal (0.2% - more flexible)
  CONFIDENCE_CHANGE_THRESHOLD: 5, // Minimum confidence change % to write to history (5%)
};

/**
 * Get candles URL
 */
function getCandlesUrl(): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return `${supabaseUrl}/functions/v1/get-candles`;
}

/**
 * Fetch candles from get-candles function
 */
async function fetchCandles(
  symbol: string,
  timeframe: string,
  exchange: 'binance' | 'okx' = CONFIG.DEFAULT_EXCHANGE,
  limit: number = CONFIG.CANDLE_LIMIT
): Promise<any[]> {
  try {
    const url = getCandlesUrl();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceKey) {
      logger.error('system', 'fetch_candles', 'SUPABASE_SERVICE_ROLE_KEY is not set', { symbol, timeframe });
      return [];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        exchange,
        symbol,
        timeframe,
        limit
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('system', 'fetch_candles', `Failed to fetch candles: ${response.status} - ${errorText}`, { symbol, timeframe, exchange });
      return [];
    }

    const result = await response.json();
    
    if (!result || !result.candles) {
      logger.warn('system', 'fetch_candles', `No candles in response for ${symbol} ${timeframe}`, { result });
      return [];
    }

    return result.candles || [];
  } catch (error) {
    logger.error('system', 'fetch_candles', `Error fetching candles for ${symbol} ${timeframe}`, { symbol, timeframe, exchange }, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Normalize symbol format (BTC/USDT -> BTCUSDT)
 */
function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase();
}

/**
 * Fetch active symbols from user watchlists
 */
async function fetchActiveSymbols(supabaseClient: ReturnType<typeof createClient>): Promise<string[]> {
  try {
    // Get active bot settings
    const { data: botSettings } = await supabaseClient
      .from('bot_settings')
      .select('user_id')
      .eq('is_active', true)
      .limit(100);

    if (!botSettings || botSettings.length === 0) {
      logger.info('signal', 'fetch_symbols', 'No active bots found, using default symbols');
      return CONFIG.DEFAULT_SYMBOLS;
    }

    const userIds = botSettings.map(s => s.user_id);

    // Get symbols from watchlist
    const { data: watchlist } = await supabaseClient
      .from('price_watchlist')
      .select('symbol')
      .in('user_id', userIds);

    if (!watchlist || watchlist.length === 0) {
      logger.info('signal', 'fetch_symbols', 'No watchlist found, using default symbols');
      return CONFIG.DEFAULT_SYMBOLS;
    }

    const symbols = Array.from(new Set(watchlist.map((item: any) => normalizeSymbol(item.symbol)))) as string[];
    return symbols.length > 0 ? symbols : CONFIG.DEFAULT_SYMBOLS;
  } catch (error) {
    logger.error('signal', 'fetch_symbols', 'Error fetching active symbols', {}, error instanceof Error ? error : new Error(String(error)));
    return CONFIG.DEFAULT_SYMBOLS;
  }
}

/**
 * Get the last active signal for a symbol/timeframe
 */
async function getLastActiveSignal(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string
): Promise<any | null> {
  try {
    const { data, error } = await supabaseClient
      .from('ai_signals_active')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .single();

    if (error) {
      // If table doesn't exist or no record found, return null
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return null;
      }
      logger.warn('signal', 'get_active', `Error getting active signal for ${symbol} ${timeframe}`, { error: error.message });
      return null;
    }

    return data;
  } catch (error) {
    logger.warn('signal', 'get_active', `Error in getLastActiveSignal`, {}, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Check if signal should be written to history (meaningful change)
 */
function shouldWriteToHistory(
  currentSignal: any,
  lastActiveSignal: any | null
): { shouldWrite: boolean; reason: string } {
  // If no previous signal, always write
  if (!lastActiveSignal) {
    return { shouldWrite: true, reason: 'first_signal' };
  }

  // Check if direction changed
  if (lastActiveSignal.side !== currentSignal.side) {
    return { shouldWrite: true, reason: 'direction_changed' };
  }

  // Check if confidence changed significantly
  const confidenceChange = Math.abs(
    (currentSignal.final_confidence || 0) - (lastActiveSignal.final_confidence || 0)
  );
  if (confidenceChange >= CONFIG.CONFIDENCE_CHANGE_THRESHOLD) {
    return { shouldWrite: true, reason: `confidence_changed_${confidenceChange.toFixed(1)}%` };
  }

  // Check if price changed significantly
  const lastPrice = lastActiveSignal.entry_price;
  const currentPrice = currentSignal.entry_price;
  if (lastPrice && currentPrice) {
    const priceChangePercent = Math.abs((currentPrice - lastPrice) / lastPrice) * 100;
    if (priceChangePercent >= CONFIG.PRICE_CHANGE_THRESHOLD) {
      return { shouldWrite: true, reason: `price_changed_${priceChangePercent.toFixed(2)}%` };
    }
  }

  // No meaningful change - don't write to history
  return { shouldWrite: false, reason: 'no_meaningful_change' };
}

/**
 * Calculate RSI
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD
 */
function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  if (prices.length < 26) {
    return { line: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' };
  }
  
  // EMA 12
  const ema12 = calculateEMA(prices, 12);
  // EMA 26
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = ema12 - ema26;
  const signal = macdLine * 0.9; // Simplified signal line
  const histogram = macdLine - signal;
  
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (histogram > 0 && macdLine > signal) trend = 'BULLISH';
  else if (histogram < 0 && macdLine < signal) trend = 'BEARISH';
  
  return {
    line: macdLine,
    signal: signal,
    histogram: histogram,
    trend
  };
}

/**
 * Calculate EMA
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number; position: 'ABOVE_UPPER' | 'BELOW_LOWER' | 'MIDDLE' } {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1];
    return { upper: lastPrice, middle: lastPrice, lower: lastPrice, position: 'MIDDLE' };
  }

  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((sum, p) => sum + p, 0) / period;
  
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = sma + (stdDev * std);
  const lower = sma - (stdDev * std);
  
  const currentPrice = prices[prices.length - 1];
  let position: 'ABOVE_UPPER' | 'BELOW_LOWER' | 'MIDDLE' = 'MIDDLE';
  if (currentPrice > upper) position = 'ABOVE_UPPER';
  else if (currentPrice < lower) position = 'BELOW_LOWER';
  
  return { upper, middle: sma, lower, position };
}

/**
 * Generate AI signal using multi-indicator strategy
 */
async function generateAISignal(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string,
  candles: any[]
): Promise<any | null> {
  try {
    if (candles.length < CONFIG.MIN_CANDLES) {
      logger.warn('signal', 'generate_signal', `Insufficient candles for ${symbol} ${timeframe}: ${candles.length}`);
      return null;
    }

    const currentPrice = candles[candles.length - 1]?.close || 0;
    if (!currentPrice || currentPrice <= 0) {
      logger.warn('signal', 'generate_signal', `Invalid price for ${symbol} ${timeframe}`);
      return null;
    }
    
    // Calculate indicators
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bb = calculateBollingerBands(closes, 20, 2);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    
    // Multi-indicator strategy (similar to strategy-runner-worker)
    let buySignals = 0;
    let sellSignals = 0;
    
    // RSI signals
    if (rsi < 30) buySignals += 2;
    else if (rsi < 40) buySignals += 1;
    else if (rsi > 70) sellSignals += 2;
    else if (rsi > 60) sellSignals += 1;
    
    // MACD signals
    if (macd.trend === 'BULLISH' && macd.histogram > 0) buySignals += 2;
    else if (macd.trend === 'BEARISH' && macd.histogram < 0) sellSignals += 2;
    
    // Bollinger Bands signals
    if (bb.position === 'BELOW_LOWER') buySignals += 2;
    else if (bb.position === 'ABOVE_UPPER') sellSignals += 2;
    
    // EMA trend signals
    if (ema20 > ema50) buySignals += 1;
    else if (ema20 < ema50) sellSignals += 1;
    
    // Determine signal side
    let side: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 0;
    
    if (buySignals >= 3 && buySignals > sellSignals) {
      side = 'BUY';
      confidence = Math.min(100, 50 + (buySignals * 10));
    } else if (sellSignals >= 3 && sellSignals > buySignals) {
      side = 'SELL';
      confidence = Math.min(100, 50 + (sellSignals * 10));
    }
    
    // Only generate signal if confidence is high enough
    if (side === 'WAIT' || confidence < CONFIG.MIN_CONFIDENCE) {
      return null;
    }
    
    // Calculate SL/TP (2% SL, 4% TP)
    const stopLoss = side === 'BUY' 
      ? currentPrice * 0.98  // 2% below for BUY
      : currentPrice * 1.02;  // 2% above for SELL
      
    const takeProfit = side === 'BUY'
      ? currentPrice * 1.04  // 4% above for BUY
      : currentPrice * 0.96; // 4% below for SELL
    
    // Calculate risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (confidence >= 75) riskLevel = 'LOW';
    else if (confidence < 60) riskLevel = 'HIGH';
    
    // Calculate RR ratio
    const riskAmount = Math.abs(currentPrice - stopLoss);
    const rewardAmount = Math.abs(takeProfit - currentPrice);
    const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 2.0;
    
    const finalConfidence = Math.min(100, Math.round(confidence));
    
    return {
      symbol,
      timeframe,
      side,
      final_confidence: finalConfidence,
      confidence: finalConfidence, // Keep both for compatibility
      entry_price: currentPrice,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      rr_ratio: rrRatio,
      risk_level: riskLevel,
      ai_score: finalConfidence * 0.8,
      technical_score: finalConfidence,
      volume_score: 50,
      pattern_score: 50,
      wave_score: 50,
      sentiment_score: 50,
      sources_used: ['indicator_engine'],
      metadata: {
        strategyName: 'AI Multi-Indicator Strategy',
        indicatorsSnapshot: { 
          rsi, 
          macd, 
          bollingerBands: bb, 
          ema20, 
          ema50
        },
        confidenceFactors: {
          rsi: rsi / 100,
          macd: macd.histogram > 0 ? 0.8 : 0.2,
          trend: ema20 > ema50 ? 0.8 : 0.2,
        },
        reasoning: [
          `RSI: ${rsi.toFixed(1)}`,
          `MACD: ${macd.trend}`,
          `Bollinger: ${bb.position}`,
          `EMA Trend: ${ema20 > ema50 ? 'BULLISH' : 'BEARISH'}`
        ]
      }
    };
  } catch (error) {
    logger.error('signal', 'generate_signal', `Error in generateAISignal for ${symbol} ${timeframe}`, {}, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Upsert signal to ai_signals_active table (always updates)
 */
async function upsertActiveSignal(
  supabaseClient: ReturnType<typeof createClient>,
  signal: any
): Promise<boolean> {
  try {
    const confidence = signal.final_confidence || signal.confidence || 0;
    
    const signalData = {
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      side: signal.side,
      final_confidence: confidence,
      risk_level: signal.risk_level || 'MEDIUM',
      entry_price: signal.entry_price || null,
      stop_loss: signal.stop_loss || null,
      take_profit: signal.take_profit || null,
      rr_ratio: signal.rr_ratio || null,
      ai_score: signal.ai_score || null,
      technical_score: signal.technical_score || null,
      volume_score: signal.volume_score || null,
      pattern_score: signal.pattern_score || null,
      wave_score: signal.wave_score || null,
      sentiment_score: signal.sentiment_score || null,
      sources_used: signal.sources_used || [],
      metadata: signal.metadata || null,
      status: 'active',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('ai_signals_active')
      .upsert(signalData, {
        onConflict: 'symbol,timeframe',
        ignoreDuplicates: false
      });

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn('signal', 'upsert_active', '⚠️ ai_signals_active table does not exist. Please run migration to create it.');
        return false;
      }
      logger.error('signal', 'upsert_active', 'Error upserting active signal', {}, error instanceof Error ? error : new Error(String(error)));
      return false;
    }

    return true;
  } catch (error) {
    logger.error('signal', 'upsert_active', 'Error in upsertActiveSignal', {}, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Save signal to ai_signals_history table (only on meaningful changes)
 */
async function saveAISignalToHistory(
  supabaseClient: ReturnType<typeof createClient>,
  signal: any
): Promise<string | null> {
  try {
    const confidence = signal.final_confidence || signal.confidence || 0;
    
    const signalData = {
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      side: signal.side,
      final_confidence: confidence,
      risk_level: signal.risk_level || 'MEDIUM',
      entry_price: signal.entry_price || null,
      stop_loss: signal.stop_loss || null,
      take_profit: signal.take_profit || null,
      rr_ratio: signal.rr_ratio || null,
      ai_score: signal.ai_score || null,
      technical_score: signal.technical_score || null,
      volume_score: signal.volume_score || null,
      pattern_score: signal.pattern_score || null,
      wave_score: signal.wave_score || null,
      sentiment_score: signal.sentiment_score || null,
      sources_used: signal.sources_used || [],
      metadata: signal.metadata || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('ai_signals_history')
      .insert(signalData)
      .select('id')
      .single();

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn('signal', 'save_history', '⚠️ ai_signals_history table does not exist. Please run migration to create it.');
        return null;
      }
      logger.error('signal', 'save_history', 'Error saving signal to history', {}, error instanceof Error ? error : new Error(String(error)));
      return null;
    }

    return data.id;
  } catch (error) {
    logger.error('signal', 'save_history', 'Error in saveAISignalToHistory', {}, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Process a single symbol/timeframe
 */
async function processSymbol(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string
): Promise<{ processed: boolean; signalGenerated: boolean; historyWritten: boolean; reason?: string }> {
  try {
    // Fetch candles
    const candles = await fetchCandles(symbol, timeframe);
    
    if (candles.length < CONFIG.MIN_CANDLES) {
      logger.info('signal', 'process_symbol', `Skipping ${symbol} ${timeframe}: insufficient candles (${candles.length}/${CONFIG.MIN_CANDLES})`);
      return { processed: true, signalGenerated: false, historyWritten: false, reason: 'insufficient_candles' };
    }

    // Generate AI signal
    const signal = await generateAISignal(supabaseClient, symbol, timeframe, candles);
    
    if (!signal) {
      // No signal generated (conditions not met) - update active signal to 'no-signal'
      logger.info('signal', 'process_symbol', `No signal generated for ${symbol} ${timeframe} (conditions not met - confidence too low or indicators neutral)`);
      
      // Update active signal status to 'no-signal'
      try {
        await supabaseClient
          .from('ai_signals_active')
          .upsert({
            symbol,
            timeframe,
            side: 'WAIT',
            final_confidence: 0,
            risk_level: 'MEDIUM',
            status: 'no-signal',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'symbol,timeframe',
            ignoreDuplicates: false
          });
      } catch (error) {
        // Ignore errors if table doesn't exist
      }
      
      return { processed: true, signalGenerated: false, historyWritten: false, reason: 'conditions_not_met' };
    }

    // Get last active signal to check for meaningful changes
    const lastActiveSignal = await getLastActiveSignal(supabaseClient, symbol, timeframe);
    
    // Always upsert to active signals (keeps UI alive)
    const activeUpserted = await upsertActiveSignal(supabaseClient, signal);
    if (!activeUpserted) {
      logger.warn('signal', 'process_symbol', `Failed to upsert active signal for ${symbol} ${timeframe}`);
    }

    // Check if we should write to history (meaningful change)
    const historyCheck = shouldWriteToHistory(signal, lastActiveSignal);
    let historyWritten = false;
    
    if (historyCheck.shouldWrite) {
      const historyId = await saveAISignalToHistory(supabaseClient, signal);
      if (historyId) {
        historyWritten = true;
        logger.info('signal', 'process_symbol', `✅ Wrote signal to history: ${symbol} ${timeframe} ${signal.side} (${signal.final_confidence}%) - Reason: ${historyCheck.reason}`, { historyId });
      }
    } else {
      logger.info('signal', 'process_symbol', `ℹ️ Signal active but not written to history: ${symbol} ${timeframe} ${signal.side} (${signal.final_confidence}%) - Reason: ${historyCheck.reason}`);
    }

    return {
      processed: true,
      signalGenerated: true,
      historyWritten,
      reason: historyCheck.reason
    };
  } catch (error) {
    logger.error('signal', 'process_symbol', `Error processing ${symbol} ${timeframe}`, {}, error instanceof Error ? error : new Error(String(error)));
    return { processed: false, signalGenerated: false, historyWritten: false, reason: 'error' };
  }
}

/**
 * Main runner function
 */
async function runAISignalRunner(timeframes?: string[]): Promise<{ success: boolean; signalsGenerated: number; errors: string[] }> {
  const supabaseClient = getSupabaseClient();
  const result = {
    success: true,
    signalsGenerated: 0,
    errors: [] as string[]
  };

  try {
    logger.info('system', 'start', '🚀 Starting AI Signal Runner...');

    // Get active symbols
    const symbols = await fetchActiveSymbols(supabaseClient);
    logger.info('signal', 'fetch_symbols', `📊 Processing ${symbols.length} symbols: ${symbols.join(', ')}`);

    // Get timeframes to process
    const timeframesToProcess = timeframes || CONFIG.DEFAULT_TIMEFRAMES;
    logger.info('signal', 'fetch_timeframes', `⏰ Processing timeframes: ${timeframesToProcess.join(', ')}`);

    // Process each symbol/timeframe combination
    let totalProcessed = 0;
    let signalsGenerated = 0;
    let historyWritten = 0;
    let skippedConditions = 0;
    let skippedNoChange = 0;
    
    for (const timeframe of timeframesToProcess) {
      for (const symbol of symbols) {
        try {
          totalProcessed++;
          const processResult = await processSymbol(supabaseClient, symbol, timeframe);
          
          if (processResult.processed) {
            if (processResult.signalGenerated) {
              signalsGenerated++;
              if (processResult.historyWritten) {
                historyWritten++;
              } else {
                skippedNoChange++;
              }
            } else {
              skippedConditions++;
            }
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          const errorMsg = `Error processing ${symbol} ${timeframe}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error('signal', 'process_symbol', errorMsg, {}, error instanceof Error ? error : new Error(errorMsg));
          result.errors.push(errorMsg);
        }
      }
    }

    result.signalsGenerated = signalsGenerated;
    
    logger.info('system', 'complete', `✅ AI Signal Runner completed: ${signalsGenerated} signals generated (${historyWritten} written to history, ${skippedNoChange} skipped due to no meaningful change), ${skippedConditions} skipped due to conditions not met`, {
      totalProcessed,
      signalsGenerated,
      historyWritten,
      skippedConditions,
      skippedNoChange
    });
    
    return result;
  } catch (error) {
    logger.error('system', 'run_runner', '❌ Error in runAISignalRunner', {}, error instanceof Error ? error : new Error(String(error)));
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Edge Function handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body safely - same approach as strategy-runner-worker
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const timeframes = body.timeframes || undefined;

    const result = await runAISignalRunner(timeframes);

    return new Response(
      JSON.stringify({
        success: result.success,
        signalsGenerated: result.signalsGenerated,
        errors: result.errors,
        message: `AI Signal Runner completed: ${result.signalsGenerated} signals generated`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('system', 'handler', 'AI Signal Runner error', {}, error instanceof Error ? error : new Error(String(error)));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
