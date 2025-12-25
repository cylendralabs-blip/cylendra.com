/**
 * Indicator Engine
 * 
 * Core technical indicators engine
 * Moved from src/utils/technicalIndicators.ts
 * Phase 4: Strategy Engine
 */

// Re-export from original location for backward compatibility
export {
  TechnicalIndicatorsEngine,
  CandlestickPatternDetector,
  type TechnicalIndicatorData,
  type CandlestickPattern
} from '@/utils/technicalIndicators';

/**
 * Enhanced indicator functions for strategy engine
 */

import { TechnicalIndicatorsEngine as BaseEngine } from '@/utils/technicalIndicators';
import { Candle } from '@/services/marketData/types.ts';

/**
 * Calculate all indicators from candles
 * Phase X.15: Added caching for performance optimization
 */
import { indicatorCache } from '@/core/performance/indicatorCache';

export function calculateIndicatorsFromCandles(
  candles: Candle[],
  symbol?: string,
  timeframe?: string
): {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
    position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER';
  };
  stochastic: {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  williams: number;
  cci: number;
  adx: {
    value: number;
    trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  ema20: number;
  ema50: number;
  sma20: number;
  sma50: number;
  atr: number;
} {
  if (candles.length === 0) {
    throw new Error('No candles provided');
  }

  // Phase X.15: Check cache first if symbol/timeframe provided
  if (symbol && timeframe) {
    const cached = indicatorCache.get<any>(symbol, timeframe, 'all-indicators');
    if (cached) {
      return cached;
    }
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const opens = candles.map(c => c.open);

  // Calculate base indicators
  const baseIndicators = BaseEngine.analyzeAllIndicators(
    closes,
    highs,
    lows,
    closes
  );

  // Calculate EMA
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  // Calculate SMA
  const sma20 = closes.slice(-20).reduce((sum, price) => sum + price, 0) / Math.min(20, closes.length);
  const sma50 = closes.slice(-50).reduce((sum, price) => sum + price, 0) / Math.min(50, closes.length);

  // Calculate ATR (Average True Range)
  const atr = calculateATR(highs, lows, closes, 14);

  const result = {
    ...baseIndicators,
    ema20,
    ema50,
    sma20,
    sma50,
    atr
  };

  // Phase X.15: Cache result if symbol/timeframe provided
  if (symbol && timeframe) {
    // Cache for 30 seconds (indicators change frequently)
    indicatorCache.set(symbol, timeframe, 'all-indicators', result, 30000);
  }

  return result;
}

/**
 * Calculate EMA (Exponential Moving Average)
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
 * Calculate ATR (Average True Range)
 */
function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  // Calculate ATR as EMA of true ranges
  if (trueRanges.length < period) {
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  // Initial SMA
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  // EMA for remaining periods
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Calculate trend strength
 */
export function calculateTrendStrength(candles: Candle[], period: number = 20): {
  strength: number; // 0-100
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  slope: number;
} {
  if (candles.length < period) {
    return { strength: 0, direction: 'NEUTRAL', slope: 0 };
  }

  const recentCandles = candles.slice(-period);
  const closes = recentCandles.map(c => c.close);

  // Linear regression for slope
  const n = closes.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = closes.reduce((sum, price) => sum + price, 0);
  const sumXY = closes.reduce((sum, price, i) => sum + (i * price), 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;

  // Calculate strength based on consistency of movement
  let consistentMovements = 0;
  for (let i = 1; i < closes.length; i++) {
    if ((slope > 0 && closes[i] > closes[i - 1]) || 
        (slope < 0 && closes[i] < closes[i - 1])) {
      consistentMovements++;
    }
  }

  const consistency = (consistentMovements / (closes.length - 1)) * 100;
  const strength = Math.min(100, consistency * Math.abs(priceChangePercent) / 10);

  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (slope > 0.0001) {
    direction = 'BULLISH';
  } else if (slope < -0.0001) {
    direction = 'BEARISH';
  }

  return {
    strength: Math.min(100, Math.max(0, strength)),
    direction,
    slope
  };
}

/**
 * Calculate volatility
 */
export function calculateVolatility(candles: Candle[], period: number = 20): {
  atr: number;
  volatilityPercent: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
} {
  if (candles.length < period) {
    return { atr: 0, volatilityPercent: 0, level: 'LOW' };
  }

  const recentCandles = candles.slice(-period);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const closes = recentCandles.map(c => c.close);

  const atr = calculateATR(highs, lows, closes, period);
  const avgPrice = closes.reduce((sum, price) => sum + price, 0) / closes.length;
  const volatilityPercent = (atr / avgPrice) * 100;

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (volatilityPercent > 10) {
    level = 'EXTREME';
  } else if (volatilityPercent > 5) {
    level = 'HIGH';
  } else if (volatilityPercent > 2) {
    level = 'MEDIUM';
  }

  return {
    atr,
    volatilityPercent,
    level
  };
}

