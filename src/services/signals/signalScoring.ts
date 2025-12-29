/**
 * Signal Scoring & Confidence
 * 
 * Calculate signal confidence and risk level
 * Phase 4: Strategy Engine
 */

import { TechnicalIndicatorData } from '@/core/engines/indicatorEngine.ts';
import { Candle } from '@/services/marketData/types.ts';

/**
 * Confidence Factors
 */
export interface ConfidenceFactors {
  rsi: number;        // 0-1
  macd: number;       // 0-1
  trend: number;      // 0-1
  volume: number;     // 0-1
  pattern: number;    // 0-1
  bollinger: number;  // 0-1
  stochastic: number; // 0-1
}

/**
 * Signal Score Result
 */
export interface SignalScore {
  confidence: number;  // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: ConfidenceFactors;
  reasoning: string[];
}

/**
 * Calculate signal confidence from indicators
 */
export function calculateSignalConfidence(
  indicators: TechnicalIndicatorData,
  candles: Candle[],
  side: 'buy' | 'sell'
): SignalScore {
  const factors: ConfidenceFactors = {
    rsi: calculateRSIConfidence(indicators.rsi, side),
    macd: calculateMACDConfidence(indicators.macd, side),
    trend: calculateTrendConfidence(indicators, side),
    volume: calculateVolumeConfidence(candles),
    pattern: 0.5, // Placeholder - would come from pattern detection
    bollinger: calculateBollingerConfidence(indicators.bollingerBands, side),
    stochastic: calculateStochasticConfidence(indicators.stochastic, side)
  };

  // Calculate weighted confidence
  const weights = {
    rsi: 0.2,
    macd: 0.2,
    trend: 0.2,
    volume: 0.15,
    pattern: 0.1,
    bollinger: 0.1,
    stochastic: 0.05
  };

  const confidence = Math.round(
    factors.rsi * weights.rsi +
    factors.macd * weights.macd +
    factors.trend * weights.trend +
    factors.volume * weights.volume +
    factors.pattern * weights.pattern +
    factors.bollinger * weights.bollinger +
    factors.stochastic * weights.stochastic
  ) * 100;

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (confidence >= 75) {
    riskLevel = 'LOW';
  } else if (confidence < 50) {
    riskLevel = 'HIGH';
  }

  // Generate reasoning
  const reasoning = generateReasoning(indicators, factors, side, confidence);

  return {
    confidence: Math.max(0, Math.min(100, confidence)),
    riskLevel,
    factors,
    reasoning
  };
}

/**
 * Calculate RSI confidence
 */
function calculateRSIConfidence(rsi: number, side: 'buy' | 'sell'): number {
  if (side === 'buy') {
    // Buy signal: RSI should be oversold (< 30) or recovering from oversold
    if (rsi < 30) {
      return 0.9; // Very strong buy signal
    } else if (rsi < 40) {
      return 0.7; // Good buy signal
    } else if (rsi < 50) {
      return 0.5; // Neutral to bullish
    } else {
      return 0.2; // Weak or bearish
    }
  } else {
    // Sell signal: RSI should be overbought (> 70) or declining from overbought
    if (rsi > 70) {
      return 0.9; // Very strong sell signal
    } else if (rsi > 60) {
      return 0.7; // Good sell signal
    } else if (rsi > 50) {
      return 0.5; // Neutral to bearish
    } else {
      return 0.2; // Weak or bullish
    }
  }
}

/**
 * Calculate MACD confidence
 */
function calculateMACDConfidence(
  macd: { line: number; signal: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' },
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    if (macd.trend === 'BULLISH' && macd.histogram > 0) {
      return 0.9;
    } else if (macd.trend === 'BULLISH') {
      return 0.7;
    } else if (macd.line > macd.signal) {
      return 0.5;
    } else {
      return 0.2;
    }
  } else {
    if (macd.trend === 'BEARISH' && macd.histogram < 0) {
      return 0.9;
    } else if (macd.trend === 'BEARISH') {
      return 0.7;
    } else if (macd.line < macd.signal) {
      return 0.5;
    } else {
      return 0.2;
    }
  }
}

/**
 * Calculate trend confidence
 */
function calculateTrendConfidence(
  indicators: TechnicalIndicatorData,
  side: 'buy' | 'sell'
): number {
  // Use ADX to determine trend strength
  const adx = indicators.adx.value;
  const trendStrength = indicators.adx.trend_strength;

  if (trendStrength === 'STRONG' && adx > 25) {
    // Strong trend
    if (side === 'buy' && indicators.macd.trend === 'BULLISH') {
      return 0.9;
    } else if (side === 'sell' && indicators.macd.trend === 'BEARISH') {
      return 0.9;
    } else {
      return 0.3; // Trend in wrong direction
    }
  } else if (trendStrength === 'MODERATE' && adx > 20) {
    return 0.6;
  } else {
    // Weak or no trend
    return 0.3;
  }
}

/**
 * Calculate volume confidence
 */
function calculateVolumeConfidence(candles: Candle[]): number {
  if (candles.length < 2) return 0.5;

  const recentCandles = candles.slice(-10);
  const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
  const lastVolume = candles[candles.length - 1].volume;

  // Higher volume = higher confidence
  if (lastVolume > avgVolume * 1.5) {
    return 0.9; // Very high volume
  } else if (lastVolume > avgVolume * 1.2) {
    return 0.7; // Above average volume
  } else if (lastVolume > avgVolume * 0.8) {
    return 0.5; // Average volume
  } else {
    return 0.3; // Low volume
  }
}

/**
 * Calculate Bollinger Bands confidence
 */
function calculateBollingerConfidence(
  bb: { upper: number; middle: number; lower: number; squeeze: boolean; position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER' },
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    if (bb.position === 'BELOW_LOWER') {
      return 0.9; // Strong buy - oversold
    } else if (bb.squeeze) {
      return 0.7; // Potential breakout
    } else {
      return 0.4; // Neutral
    }
  } else {
    if (bb.position === 'ABOVE_UPPER') {
      return 0.9; // Strong sell - overbought
    } else if (bb.squeeze) {
      return 0.7; // Potential breakout
    } else {
      return 0.4; // Neutral
    }
  }
}

/**
 * Calculate Stochastic confidence
 */
function calculateStochasticConfidence(
  stoch: { k: number; d: number; signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' },
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    if (stoch.signal === 'OVERSOLD') {
      return 0.8;
    } else if (stoch.k < stoch.d && stoch.k < 50) {
      return 0.6;
    } else {
      return 0.4;
    }
  } else {
    if (stoch.signal === 'OVERBOUGHT') {
      return 0.8;
    } else if (stoch.k > stoch.d && stoch.k > 50) {
      return 0.6;
    } else {
      return 0.4;
    }
  }
}

/**
 * Generate reasoning for signal
 */
function generateReasoning(
  indicators: TechnicalIndicatorData,
  factors: ConfidenceFactors,
  side: 'buy' | 'sell',
  confidence: number
): string[] {
  const reasoning: string[] = [];

  // RSI reasoning
  if (factors.rsi >= 0.7) {
    if (side === 'buy') {
      reasoning.push(`RSI is oversold (${indicators.rsi.toFixed(1)}), indicating strong buy opportunity`);
    } else {
      reasoning.push(`RSI is overbought (${indicators.rsi.toFixed(1)}), indicating strong sell opportunity`);
    }
  }

  // MACD reasoning
  if (factors.macd >= 0.7) {
    reasoning.push(`MACD shows ${indicators.macd.trend.toLowerCase()} trend with histogram ${indicators.macd.histogram > 0 ? 'positive' : 'negative'}`);
  }

  // Trend reasoning
  if (factors.trend >= 0.7) {
    reasoning.push(`Strong ${indicators.macd.trend.toLowerCase()} trend detected (ADX: ${indicators.adx.value.toFixed(1)})`);
  }

  // Volume reasoning
  if (factors.volume >= 0.7) {
    reasoning.push('Volume is above average, confirming price movement');
  }

  // Bollinger Bands reasoning
  if (factors.bollinger >= 0.7) {
    if (side === 'buy') {
      reasoning.push('Price is below lower Bollinger Band, indicating oversold condition');
    } else {
      reasoning.push('Price is above upper Bollinger Band, indicating overbought condition');
    }
  }

  // Stochastic reasoning
  if (factors.stochastic >= 0.7) {
    reasoning.push(`Stochastic shows ${side === 'buy' ? 'oversold' : 'overbought'} condition`);
  }

  // Overall confidence
  if (confidence >= 75) {
    reasoning.push('High confidence signal based on multiple confirming indicators');
  } else if (confidence < 50) {
    reasoning.push('Low confidence signal - mixed signals from indicators');
  }

  return reasoning.length > 0 ? reasoning : ['Signal generated based on technical indicators'];
}

