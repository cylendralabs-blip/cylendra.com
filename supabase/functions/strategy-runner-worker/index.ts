/**
 * Strategy Runner Worker
 * 
 * Scheduled Edge Function that runs strategies and generates signals
 * Phase 4: Strategy Engine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { createLogger } from '../_shared/logger.ts';
import { corsHeaders, STRATEGY_RUNNER_CONFIG, getCandlesUrl } from './config.ts';
import { saveSignalToDatabase, checkSignalExists } from './signalGenerator.ts';

const logger = createLogger('strategy-runner-worker');

/**
 * Fetch candles from get-candles function
 */
async function fetchCandles(
  symbol: string,
  timeframe: string,
  exchange: 'binance' | 'okx' = 'binance',
  limit: number = STRATEGY_RUNNER_CONFIG.MAX_CANDLES
): Promise<any[]> {
  try {
    const url = getCandlesUrl();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        exchange,
        symbol,
        timeframe,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch candles: ${response.status}`);
    }

    const result = await response.json();
    return result.candles || [];
  } catch (error) {
    logger.error(`Error fetching candles for ${symbol} ${timeframe}:`, error);
    return [];
  }
}

/**
 * Calculate indicators from candles (simplified version for Edge Function)
 */
function calculateIndicators(candles: any[]): any {
  if (candles.length < 20) {
    return null;
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);

  // Calculate RSI
  const rsi = calculateRSI(closes, 14);

  // Calculate MACD
  const macd = calculateMACD(closes);

  // Calculate Bollinger Bands
  const bb = calculateBollingerBands(closes, 20, 2);

  // Calculate EMA
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  // Calculate ATR
  const atr = calculateATR(highs, lows, closes, 14);

  // Calculate Stochastic
  const stoch = calculateStochastic(highs, lows, closes, 14);

  return {
    rsi,
    macd,
    bollingerBands: bb,
    ema20,
    ema50,
    atr,
    stochastic: stoch
  };
}

/**
 * Calculate RSI
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD
 */
function calculateMACD(prices: number[]): any {
  if (prices.length < 26) {
    return { line: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Simplified signal line
  const signalLine = calculateEMA([macdLine], 9);
  const histogram = macdLine - signalLine;

  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (macdLine > signalLine && histogram > 0) trend = 'BULLISH';
  else if (macdLine < signalLine && histogram < 0) trend = 'BEARISH';

  return {
    line: Number(macdLine.toFixed(4)),
    signal: Number(signalLine.toFixed(4)),
    histogram: Number(histogram.toFixed(4)),
    trend
  };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): any {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0, squeeze: false, position: 'BETWEEN' };
  }

  const recent = prices.slice(-period);
  const sma = recent.reduce((sum, p) => sum + p, 0) / period;

  const variance = recent.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = sma + (stdDev * multiplier);
  const lower = sma - (stdDev * multiplier);
  const currentPrice = prices[prices.length - 1];

  const squeeze = (upper - lower) / sma < 0.05; // Less than 5% band width

  let position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER' = 'BETWEEN';
  if (currentPrice > upper) position = 'ABOVE_UPPER';
  else if (currentPrice < lower) position = 'BELOW_LOWER';

  return {
    upper: Number(upper.toFixed(4)),
    middle: Number(sma.toFixed(4)),
    lower: Number(lower.toFixed(4)),
    squeeze,
    position
  };
}

/**
 * Calculate EMA
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length === 1) return prices[0];

  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
}

/**
 * Calculate ATR
 */
function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Calculate Stochastic
 */
function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): any {
  if (highs.length < period) {
    return { k: 50, d: 50, signal: 'NEUTRAL' };
  }

  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  const currentClose = closes[closes.length - 1];

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const d = k; // Simplified

  let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
  if (k > 80) signal = 'OVERBOUGHT';
  else if (k < 20) signal = 'OVERSOLD';

  return {
    k: Number(k.toFixed(2)),
    d: Number(d.toFixed(2)),
    signal
  };
}

/**
 * Generate signal using simplified strategy logic
 */
function generateSignal(
  symbol: string,
  timeframe: string,
  candles: any[],
  indicators: any,
  botSettings: any,
  userId: string
): any | null {
  if (!indicators || candles.length < STRATEGY_RUNNER_CONFIG.MIN_CANDLES) {
    return null;
  }

  const currentPrice = candles[candles.length - 1].close;
  let buySignals = 0;
  let sellSignals = 0;

  // RSI signals
  if (indicators.rsi < 30) {
    buySignals += 2;
  } else if (indicators.rsi < 40) {
    buySignals += 1;
  } else if (indicators.rsi > 70) {
    sellSignals += 2;
  } else if (indicators.rsi > 60) {
    sellSignals += 1;
  }

  // MACD signals
  if (indicators.macd.trend === 'BULLISH' && indicators.macd.histogram > 0) {
    buySignals += 2;
  } else if (indicators.macd.trend === 'BEARISH' && indicators.macd.histogram < 0) {
    sellSignals += 2;
  }

  // Bollinger Bands signals
  if (indicators.bollingerBands.position === 'BELOW_LOWER') {
    buySignals += 2;
  } else if (indicators.bollingerBands.position === 'ABOVE_UPPER') {
    sellSignals += 2;
  }

  // EMA trend signals
  if (indicators.ema20 > indicators.ema50) {
    buySignals += 1;
  } else if (indicators.ema20 < indicators.ema50) {
    sellSignals += 1;
  }

  // Stochastic signals
  if (indicators.stochastic.signal === 'OVERSOLD') {
    buySignals += 1;
  } else if (indicators.stochastic.signal === 'OVERBOUGHT') {
    sellSignals += 1;
  }

  // Determine signal side
  let side: 'buy' | 'sell' | null = null;
  let confidence = 0;

  if (buySignals >= 3 && buySignals > sellSignals) {
    side = 'buy';
    confidence = Math.min(100, 50 + (buySignals * 10));
  } else if (sellSignals >= 3 && sellSignals > buySignals) {
    side = 'sell';
    confidence = Math.min(100, 50 + (sellSignals * 10));
  }

  if (!side || confidence < STRATEGY_RUNNER_CONFIG.MIN_CONFIDENCE) {
    return null;
  }

  // Calculate stop loss and take profit
  const stopLossPercent = botSettings.stop_loss_percentage || 2;
  const takeProfitPercent = botSettings.take_profit_percentage || 4;

  let stopLoss: number;
  let takeProfit: number;

  if (side === 'buy') {
    if (indicators.atr > 0) {
      stopLoss = currentPrice - (indicators.atr * 2);
    } else {
      stopLoss = currentPrice * (1 - stopLossPercent / 100);
    }
    takeProfit = currentPrice * (1 + takeProfitPercent / 100);
  } else {
    if (indicators.atr > 0) {
      stopLoss = currentPrice + (indicators.atr * 2);
    } else {
      stopLoss = currentPrice * (1 + stopLossPercent / 100);
    }
    takeProfit = currentPrice * (1 - takeProfitPercent / 100);
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (confidence >= 75) riskLevel = 'LOW';
  else if (confidence < 60) riskLevel = 'HIGH';

  return {
    user_id: userId,
    source: 'internal_engine',
    symbol,
    side,
    timeframe,
    price_at_signal: currentPrice,
    confidence,
    riskLevel,
    stop_loss_price: stopLoss,
    take_profit_price: takeProfit,
    reason: `Multi-indicator signal: RSI=${indicators.rsi.toFixed(1)}, MACD=${indicators.macd.trend}, BB=${indicators.bollingerBands.position}`,
    meta: {
      strategyId: 'main_strategy',
      strategyName: 'Main Multi-Indicator Strategy',
      indicatorsSnapshot: indicators,
      confidenceFactors: {
        rsi: indicators.rsi / 100,
        macd: indicators.macd.trend === 'BULLISH' ? 0.8 : 0.2,
        trend: indicators.ema20 > indicators.ema50 ? 0.8 : 0.2,
        volume: 0.5,
        pattern: 0.5
      },
      reasoning: [
        `RSI: ${indicators.rsi.toFixed(1)}`,
        `MACD: ${indicators.macd.trend}`,
        `Bollinger: ${indicators.bollingerBands.position}`,
        `EMA Trend: ${indicators.ema20 > indicators.ema50 ? 'BULLISH' : 'BEARISH'}`
      ]
    }
  };
}

/**
 * Process user watchlist and generate signals
 */
async function processUserWatchlist(
  supabaseClient: ReturnType<typeof getSupabaseClient>,
  userId: string,
  botSettings: any,
  timeframe: string
): Promise<number> {
  try {
    // Get user watchlist
    const { data: watchlist, error: watchlistError } = await supabaseClient
      .from('price_watchlist')
      .select('symbol')
      .eq('user_id', userId);

    if (watchlistError || !watchlist || watchlist.length === 0) {
      logger.warn(`No watchlist found for user ${userId}`);
      return 0;
    }

    const symbols = watchlist.map((w: any) => w.symbol);
    logger.info(`Processing ${symbols.length} symbols for user ${userId} on ${timeframe}`);

    let signalsGenerated = 0;

    for (const symbol of symbols) {
      try {
        // Check if signal already exists (cooldown)
        const signalExists = await checkSignalExists(
          supabaseClient,
          userId,
          symbol,
          timeframe,
          'buy', // Check both sides
          15 // 15 minutes cooldown
        );

        if (signalExists) {
          logger.debug(`Signal already exists for ${symbol} ${timeframe}, skipping`);
          continue;
        }

        // Fetch candles
        const candles = await fetchCandles(
          symbol,
          timeframe,
          STRATEGY_RUNNER_CONFIG.DEFAULT_EXCHANGE,
          STRATEGY_RUNNER_CONFIG.MAX_CANDLES
        );

        if (candles.length < STRATEGY_RUNNER_CONFIG.MIN_CANDLES) {
          logger.warn(`Not enough candles for ${symbol} ${timeframe}: ${candles.length}`);
          continue;
        }

        // Calculate indicators
        const indicators = calculateIndicators(candles);

        if (!indicators) {
          logger.warn(`Failed to calculate indicators for ${symbol} ${timeframe}`);
          continue;
        }

        // Generate signal
        const signal = generateSignal(
          symbol,
          timeframe,
          candles,
          indicators,
          botSettings,
          userId
        );

        if (!signal) {
          continue; // No signal generated
        }

        // Save signal to database
        const signalId = await saveSignalToDatabase(
          supabaseClient,
          signal,
          'internal_engine'
        );

        if (signalId) {
          signalsGenerated++;
          logger.info(`✅ Generated ${signal.side.toUpperCase()} signal for ${symbol} ${timeframe} (confidence: ${signal.confidence}%)`);
        }

        // Rate limiting: small delay between symbols
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        logger.error(`Error processing ${symbol} for user ${userId}:`, error);
        continue;
      }
    }

    return signalsGenerated;

  } catch (error) {
    logger.error(`Error processing watchlist for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Main worker function
 */
serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Strategy runner worker started');

    const supabaseClient = getSupabaseClient();
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const { timeframe } = body;

    // Use timeframe from request or default to first supported timeframe
    const timeframesToProcess = timeframe
      ? [timeframe]
      : [STRATEGY_RUNNER_CONFIG.TIMEFRAMES[0]]; // Process one timeframe per run

    let totalSignalsGenerated = 0;
    const results: any = {};

    // Get all users with active bots
    const { data: botSettings, error: botSettingsError } = await supabaseClient
      .from('bot_settings')
      .select('user_id, *')
      .eq('is_active', true);

    if (botSettingsError || !botSettings || botSettings.length === 0) {
      logger.info('No active bots found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active bots found',
          signals_generated: 0,
          execution_time_ms: Date.now() - startTime
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logger.info(`Found ${botSettings.length} active bots`);

    // Process each user
    for (const settings of botSettings) {
      const userId = settings.user_id;
      
      try {
        for (const tf of timeframesToProcess) {
          const signalsGenerated = await processUserWatchlist(
            supabaseClient,
            userId,
            settings,
            tf
          );
          
          if (!results[userId]) results[userId] = {};
          results[userId][tf] = signalsGenerated;
          totalSignalsGenerated += signalsGenerated;
        }
      } catch (error) {
        logger.error(`Error processing user ${userId}:`, error);
        continue;
      }
    }

    logger.info(`Worker completed. Generated ${totalSignalsGenerated} signals`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Strategy runner completed successfully',
        signals_generated: totalSignalsGenerated,
        results,
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Worker error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

