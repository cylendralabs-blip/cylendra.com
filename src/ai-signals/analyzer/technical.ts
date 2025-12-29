/**
 * Technical Indicators Analyzer
 * 
 * Analyzes market using technical indicators:
 * - RSI, MACD, EMA (20/50/200), ADX, ATR, Stochastic, Bollinger Bands, VWAP
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { Candle } from '@/services/marketData/types';
import { TechnicalIndicatorsEngine } from '@/utils/technicalIndicators';
import { calculateIndicatorsFromCandles, calculateTrendStrength, calculateVolatility } from '@/core/engines/indicatorEngine';
import type { TechnicalAnalysisResult, TrendDirection, AnalyzerConfig } from '../types';

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 0;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }
  
  if (cumulativeVolume === 0) {
    // Fallback to average price if no volume data
    return candles.reduce((sum, c) => sum + c.close, 0) / candles.length;
  }
  
  return cumulativeTPV / cumulativeVolume;
}

/**
 * Calculate EMA with specific period
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length === 1) return prices[0];
  if (prices.length < period) {
    // Use SMA if not enough data
    return prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Analyze technical indicators
 */
export function analyzeTechnical(
  candles: Candle[],
  config: AnalyzerConfig = {}
): TechnicalAnalysisResult {
  if (candles.length < (config.min_candles || 50)) {
    throw new Error(`Insufficient candles: ${candles.length} (minimum: ${config.min_candles || 50})`);
  }

  // Calculate all indicators using existing engine
  const indicators = calculateIndicatorsFromCandles(candles);
  
  // Calculate EMA 200 if we have enough candles
  const closes = candles.map(c => c.close);
  const ema200 = candles.length >= 200 
    ? calculateEMA(closes, config.ema_periods?.long || 200)
    : calculateEMA(closes, closes.length);
  
  // Calculate VWAP
  const vwap = calculateVWAP(candles);
  
  // Calculate trend strength
  const trendStrength = calculateTrendStrength(candles, 20);
  
  // Calculate volatility
  const volatility = calculateVolatility(candles, 20);
  
  // Determine trend direction
  let trend: TrendDirection = 'SIDEWAYS';
  if (trendStrength.direction === 'BULLISH' && trendStrength.strength > 30) {
    trend = 'UP';
  } else if (trendStrength.direction === 'BEARISH' && trendStrength.strength > 30) {
    trend = 'DOWN';
  }
  
  // Calculate momentum (0-100)
  // Based on RSI, MACD histogram, and trend strength
  const rsiMomentum = indicators.rsi > 50 
    ? ((indicators.rsi - 50) / 50) * 50 
    : ((50 - indicators.rsi) / 50) * -50;
  
  const macdMomentum = indicators.macd.histogram > 0
    ? Math.min(50, (indicators.macd.histogram / Math.abs(indicators.macd.line || 1)) * 50)
    : Math.max(-50, (indicators.macd.histogram / Math.abs(indicators.macd.line || 1)) * 50);
  
  const trendMomentum = trendStrength.direction === 'BULLISH'
    ? trendStrength.strength
    : trendStrength.direction === 'BEARISH'
    ? -trendStrength.strength
    : 0;
  
  const momentum = Math.max(0, Math.min(100, 50 + (rsiMomentum * 0.3) + (macdMomentum * 0.3) + (trendMomentum * 0.4)));
  
  // Calculate technical score (0-100)
  // Based on multiple factors
  let technicalScore = 50; // Base score
  
  // RSI contribution (0-20 points)
  if (indicators.rsi < 30) {
    technicalScore += 20; // Strong oversold
  } else if (indicators.rsi < 40) {
    technicalScore += 10; // Oversold
  } else if (indicators.rsi > 70) {
    technicalScore -= 20; // Strong overbought
  } else if (indicators.rsi > 60) {
    technicalScore -= 10; // Overbought
  }
  
  // MACD contribution (0-20 points)
  if (indicators.macd.trend === 'BULLISH' && indicators.macd.histogram > 0) {
    technicalScore += 20;
  } else if (indicators.macd.trend === 'BEARISH' && indicators.macd.histogram < 0) {
    technicalScore -= 20;
  } else if (indicators.macd.trend === 'BULLISH') {
    technicalScore += 10;
  } else if (indicators.macd.trend === 'BEARISH') {
    technicalScore -= 10;
  }
  
  // ADX contribution (0-15 points)
  if (indicators.adx.trend_strength === 'STRONG' && indicators.adx.value > 25) {
    technicalScore += 15;
  } else if (indicators.adx.trend_strength === 'MODERATE' && indicators.adx.value > 20) {
    technicalScore += 8;
  }
  
  // Bollinger Bands contribution (0-15 points)
  if (indicators.bollingerBands.position === 'BELOW_LOWER') {
    technicalScore += 15; // Oversold
  } else if (indicators.bollingerBands.position === 'ABOVE_UPPER') {
    technicalScore -= 15; // Overbought
  }
  
  // Stochastic contribution (0-10 points)
  if (indicators.stochastic.signal === 'OVERSOLD') {
    technicalScore += 10;
  } else if (indicators.stochastic.signal === 'OVERBOUGHT') {
    technicalScore -= 10;
  }
  
  // EMA trend contribution (0-10 points)
  if (indicators.ema20 > indicators.ema50 && indicators.ema50 > ema200) {
    technicalScore += 10; // Strong uptrend
  } else if (indicators.ema20 < indicators.ema50 && indicators.ema50 < ema200) {
    technicalScore -= 10; // Strong downtrend
  } else if (indicators.ema20 > indicators.ema50) {
    technicalScore += 5; // Short-term uptrend
  } else if (indicators.ema20 < indicators.ema50) {
    technicalScore -= 5; // Short-term downtrend
  }
  
  // VWAP contribution (0-10 points)
  const currentPrice = candles[candles.length - 1].close;
  if (currentPrice > vwap) {
    technicalScore += 5; // Price above VWAP (bullish)
  } else {
    technicalScore -= 5; // Price below VWAP (bearish)
  }
  
  // Normalize to 0-100
  technicalScore = Math.max(0, Math.min(100, technicalScore));
  
  return {
    trend,
    momentum,
    volatility: volatility.volatilityPercent * 10, // Scale to 0-100
    technical_score: technicalScore,
    rsi: indicators.rsi,
    macd: indicators.macd,
    ema20: indicators.ema20,
    ema50: indicators.ema50,
    ema200,
    adx: indicators.adx,
    atr: indicators.atr,
    stochastic: indicators.stochastic,
    bollingerBands: indicators.bollingerBands,
    vwap
  };
}

/**
 * Get RSI value
 */
export function getRSI(candles: Candle[], period: number = 14): number {
  const closes = candles.map(c => c.close);
  return TechnicalIndicatorsEngine.calculateRSI(closes, period);
}

/**
 * Get MACD values
 */
export function getMACD(candles: Candle[]): {
  line: number;
  signal: number;
  histogram: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
} {
  const closes = candles.map(c => c.close);
  return TechnicalIndicatorsEngine.calculateMACD(closes);
}

/**
 * Get ADX value
 */
export function getADX(candles: Candle[], period: number = 14): {
  value: number;
  trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
} {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  return TechnicalIndicatorsEngine.calculateADX(highs, lows, closes, period);
}

/**
 * Get ATR value
 */
export function getATR(candles: Candle[], period: number = 14): number {
  const indicators = calculateIndicatorsFromCandles(candles);
  return indicators.atr;
}

/**
 * Get Stochastic values
 */
export function getStochastic(candles: Candle[], period: number = 14): {
  k: number;
  d: number;
  signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
} {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  return TechnicalIndicatorsEngine.calculateStochastic(highs, lows, closes, period);
}

/**
 * Get Bollinger Bands
 */
export function getBollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER';
  squeeze: boolean;
} {
  const closes = candles.map(c => c.close);
  return TechnicalIndicatorsEngine.calculateBollingerBands(closes, period, stdDev);
}

/**
 * Get EMA values
 */
export function getEMA(candles: Candle[], period: number): number {
  const closes = candles.map(c => c.close);
  return calculateEMA(closes, period);
}

/**
 * Get VWAP value
 */
export function getVWAP(candles: Candle[]): number {
  return calculateVWAP(candles);
}

