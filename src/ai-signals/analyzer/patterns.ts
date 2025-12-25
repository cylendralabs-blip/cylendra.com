/**
 * Price Pattern Detection Analyzer
 * 
 * Detects chart patterns:
 * - Triangles (Ascending, Descending, Symmetrical)
 * - Wedges (Rising, Falling)
 * - Flags (Bull, Bear)
 * - Double Tops/Bottoms
 * - Head & Shoulders
 * - Channels
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { Candle } from '@/services/marketData/types';
import type { PatternAnalysisResult, AnalyzerConfig } from '../types';

/**
 * Detected Pattern
 */
interface DetectedPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-1
  description: string;
}

/**
 * Find swing highs and lows
 */
function findSwingPoints(candles: Candle[], lookback: number = 5): {
  highs: Array<{ index: number; price: number }>;
  lows: Array<{ index: number; price: number }>;
} {
  const highs: Array<{ index: number; price: number }> = [];
  const lows: Array<{ index: number; price: number }> = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    // Check if it's a local high
    let isLocalHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= currentHigh) {
        isLocalHigh = false;
        break;
      }
    }

    // Check if it's a local low
    let isLocalLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= currentLow) {
        isLocalLow = false;
        break;
      }
    }

    if (isLocalHigh) {
      highs.push({ index: i, price: currentHigh });
    }

    if (isLocalLow) {
      lows.push({ index: i, price: currentLow });
    }
  }

  return { highs, lows };
}

/**
 * Detect Triangle patterns
 */
function detectTriangles(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 20) return null;

  const { highs, lows } = findSwingPoints(candles, 3);

  if (highs.length < 3 || lows.length < 3) return null;

  // Get recent swing points
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  // Ascending Triangle: Higher lows, similar highs
  const ascendingLows = recentLows.slice(-3);
  const ascendingHighs = recentHighs.slice(-3);
  
  let ascendingLowsTrend = true;
  for (let i = 1; i < ascendingLows.length; i++) {
    if (ascendingLows[i].price <= ascendingLows[i - 1].price) {
      ascendingLowsTrend = false;
      break;
    }
  }

  const highVariance = Math.max(...ascendingHighs.map(h => h.price)) - 
                      Math.min(...ascendingHighs.map(h => h.price));
  const avgHigh = ascendingHighs.reduce((sum, h) => sum + h.price, 0) / ascendingHighs.length;
  const highVariancePercent = (highVariance / avgHigh) * 100;

  if (ascendingLowsTrend && highVariancePercent < 3) {
    return {
      name: 'Ascending Triangle',
      type: 'BULLISH',
      confidence: 0.7,
      description: 'Higher lows with resistance level - bullish breakout expected'
    };
  }

  // Descending Triangle: Lower highs, similar lows
  const descendingHighs = recentHighs.slice(-3);
  const descendingLows = recentLows.slice(-3);

  let descendingHighsTrend = true;
  for (let i = 1; i < descendingHighs.length; i++) {
    if (descendingHighs[i].price >= descendingHighs[i - 1].price) {
      descendingHighsTrend = false;
      break;
    }
  }

  const lowVariance = Math.max(...descendingLows.map(l => l.price)) - 
                     Math.min(...descendingLows.map(l => l.price));
  const avgLow = descendingLows.reduce((sum, l) => sum + l.price, 0) / descendingLows.length;
  const lowVariancePercent = (lowVariance / avgLow) * 100;

  if (descendingHighsTrend && lowVariancePercent < 3) {
    return {
      name: 'Descending Triangle',
      type: 'BEARISH',
      confidence: 0.7,
      description: 'Lower highs with support level - bearish breakdown expected'
    };
  }

  // Symmetrical Triangle: Converging highs and lows
  const allPoints = [...recentHighs, ...recentLows].sort((a, b) => a.index - b.index);
  if (allPoints.length >= 4) {
    const firstHalf = allPoints.slice(0, Math.floor(allPoints.length / 2));
    const secondHalf = allPoints.slice(Math.floor(allPoints.length / 2));

    const firstRange = Math.max(...firstHalf.map(p => p.price)) - 
                      Math.min(...firstHalf.map(p => p.price));
    const secondRange = Math.max(...secondHalf.map(p => p.price)) - 
                      Math.min(...secondHalf.map(p => p.price));

    if (secondRange < firstRange * 0.7) {
      return {
        name: 'Symmetrical Triangle',
        type: 'NEUTRAL',
        confidence: 0.65,
        description: 'Converging trendlines - breakout direction uncertain'
      };
    }
  }

  return null;
}

/**
 * Detect Wedge patterns
 */
function detectWedges(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 20) return null;

  const { highs, lows } = findSwingPoints(candles, 3);

  if (highs.length < 3 || lows.length < 3) return null;

  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  // Rising Wedge: Both highs and lows rising, but converging
  if (recentHighs.length >= 3 && recentLows.length >= 3) {
    const highsRising = recentHighs.slice(-3).every((h, i, arr) => 
      i === 0 || h.price > arr[i - 1].price
    );
    const lowsRising = recentLows.slice(-3).every((l, i, arr) => 
      i === 0 || l.price > arr[i - 1].price
    );

    if (highsRising && lowsRising) {
      const highSlope = (recentHighs[recentHighs.length - 1].price - recentHighs[0].price) / 
                        (recentHighs[recentHighs.length - 1].index - recentHighs[0].index);
      const lowSlope = (recentLows[recentLows.length - 1].price - recentLows[0].price) / 
                       (recentLows[recentLows.length - 1].index - recentLows[0].index);

      // Highs rising faster than lows = bearish
      if (highSlope > lowSlope * 1.2) {
        return {
          name: 'Rising Wedge',
          type: 'BEARISH',
          confidence: 0.7,
          description: 'Converging rising trendlines - bearish reversal expected'
        };
      }
    }

    // Falling Wedge: Both highs and lows falling, but converging
    const highsFalling = recentHighs.slice(-3).every((h, i, arr) => 
      i === 0 || h.price < arr[i - 1].price
    );
    const lowsFalling = recentLows.slice(-3).every((l, i, arr) => 
      i === 0 || l.price < arr[i - 1].price
    );

    if (highsFalling && lowsFalling) {
      const highSlope = (recentHighs[recentHighs.length - 1].price - recentHighs[0].price) / 
                        (recentHighs[recentHighs.length - 1].index - recentHighs[0].index);
      const lowSlope = (recentLows[recentLows.length - 1].price - recentLows[0].price) / 
                       (recentLows[recentLows.length - 1].index - recentLows[0].index);

      // Lows falling faster than highs = bullish
      if (Math.abs(lowSlope) > Math.abs(highSlope) * 1.2) {
        return {
          name: 'Falling Wedge',
          type: 'BULLISH',
          confidence: 0.7,
          description: 'Converging falling trendlines - bullish reversal expected'
        };
      }
    }
  }

  return null;
}

/**
 * Detect Flag patterns
 */
function detectFlags(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 30) return null;

  // Need a strong move followed by consolidation
  const firstHalf = candles.slice(0, Math.floor(candles.length / 2));
  const secondHalf = candles.slice(Math.floor(candles.length / 2));

  const firstHalfRange = Math.max(...firstHalf.map(c => c.high)) - 
                        Math.min(...firstHalf.map(c => c.low));
  const secondHalfRange = Math.max(...secondHalf.map(c => c.high)) - 
                         Math.min(...secondHalf.map(c => c.low));

  const firstHalfAvg = firstHalf.reduce((sum, c) => sum + c.close, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, c) => sum + c.close, 0) / secondHalf.length;

  // Bull Flag: Strong up move, then consolidation
  if (firstHalfAvg < secondHalfAvg && 
      firstHalfRange > secondHalfRange * 2 &&
      secondHalfRange / firstHalfAvg < 0.05) {
    return {
      name: 'Bull Flag',
      type: 'BULLISH',
      confidence: 0.75,
      description: 'Strong upward move followed by consolidation - continuation expected'
    };
  }

  // Bear Flag: Strong down move, then consolidation
  if (firstHalfAvg > secondHalfAvg && 
      firstHalfRange > secondHalfRange * 2 &&
      secondHalfRange / firstHalfAvg < 0.05) {
    return {
      name: 'Bear Flag',
      type: 'BEARISH',
      confidence: 0.75,
      description: 'Strong downward move followed by consolidation - continuation expected'
    };
  }

  return null;
}

/**
 * Detect Double Top/Bottom
 */
function detectDoubleTopBottom(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 40) return null;

  const { highs, lows } = findSwingPoints(candles, 5);

  if (highs.length < 2 || lows.length < 2) return null;

  // Double Top: Two similar highs
  const recentHighs = highs.slice(-3);
  if (recentHighs.length >= 2) {
    const high1 = recentHighs[recentHighs.length - 2];
    const high2 = recentHighs[recentHighs.length - 1];
    const avgHigh = (high1.price + high2.price) / 2;
    const variance = Math.abs(high1.price - high2.price) / avgHigh;

    if (variance < 0.02) { // Within 2%
      const lowBetween = lows.find(l => l.index > high1.index && l.index < high2.index);
      if (lowBetween && lowBetween.price < avgHigh * 0.95) {
        return {
          name: 'Double Top',
          type: 'BEARISH',
          confidence: 0.8,
          description: 'Two similar highs with dip in between - bearish reversal pattern'
        };
      }
    }
  }

  // Double Bottom: Two similar lows
  const recentLows = lows.slice(-3);
  if (recentLows.length >= 2) {
    const low1 = recentLows[recentLows.length - 2];
    const low2 = recentLows[recentLows.length - 1];
    const avgLow = (low1.price + low2.price) / 2;
    const variance = Math.abs(low1.price - low2.price) / avgLow;

    if (variance < 0.02) { // Within 2%
      const highBetween = highs.find(h => h.index > low1.index && h.index < low2.index);
      if (highBetween && highBetween.price > avgLow * 1.05) {
        return {
          name: 'Double Bottom',
          type: 'BULLISH',
          confidence: 0.8,
          description: 'Two similar lows with peak in between - bullish reversal pattern'
        };
      }
    }
  }

  return null;
}

/**
 * Detect Head & Shoulders
 */
function detectHeadAndShoulders(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 50) return null;

  const { highs } = findSwingPoints(candles, 5);

  if (highs.length < 5) return null;

  const recentHighs = highs.slice(-5);

  // Head and Shoulders: Left shoulder, head (higher), right shoulder (similar to left)
  for (let i = 2; i < recentHighs.length - 2; i++) {
    const leftShoulder = recentHighs[i - 1];
    const head = recentHighs[i];
    const rightShoulder = recentHighs[i + 1];

    if (head.price > leftShoulder.price && 
        head.price > rightShoulder.price &&
        Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.03) {
      return {
        name: 'Head and Shoulders',
        type: 'BEARISH',
        confidence: 0.75,
        description: 'Three peaks with middle highest - bearish reversal pattern'
      };
    }
  }

  // Inverse Head and Shoulders
  const { lows } = findSwingPoints(candles, 5);
  if (lows.length < 5) return null;

  const recentLows = lows.slice(-5);

  for (let i = 2; i < recentLows.length - 2; i++) {
    const leftShoulder = recentLows[i - 1];
    const head = recentLows[i];
    const rightShoulder = recentLows[i + 1];

    if (head.price < leftShoulder.price && 
        head.price < rightShoulder.price &&
        Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.03) {
      return {
        name: 'Inverse Head and Shoulders',
        type: 'BULLISH',
        confidence: 0.75,
        description: 'Three troughs with middle lowest - bullish reversal pattern'
      };
    }
  }

  return null;
}

/**
 * Detect Channel patterns
 */
function detectChannels(candles: Candle[]): DetectedPattern | null {
  if (candles.length < 30) return null;

  const { highs, lows } = findSwingPoints(candles, 3);

  if (highs.length < 3 || lows.length < 3) return null;

  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  // Check if highs and lows form parallel lines
  if (recentHighs.length >= 3 && recentLows.length >= 3) {
    // Calculate slopes
    const highSlope = (recentHighs[recentHighs.length - 1].price - recentHighs[0].price) / 
                     (recentHighs[recentHighs.length - 1].index - recentHighs[0].index);
    const lowSlope = (recentLows[recentLows.length - 1].price - recentLows[0].price) / 
                    (recentLows[recentLows.length - 1].index - recentLows[0].index);

    // Parallel lines (similar slopes)
    const slopeDiff = Math.abs(highSlope - lowSlope);
    const avgSlope = (Math.abs(highSlope) + Math.abs(lowSlope)) / 2;

    if (slopeDiff / (avgSlope || 1) < 0.3) {
      if (highSlope > 0) {
        return {
          name: 'Ascending Channel',
          type: 'BULLISH',
          confidence: 0.7,
          description: 'Parallel rising trendlines - bullish continuation'
        };
      } else if (highSlope < 0) {
        return {
          name: 'Descending Channel',
          type: 'BEARISH',
          confidence: 0.7,
          description: 'Parallel falling trendlines - bearish continuation'
        };
      } else {
        return {
          name: 'Horizontal Channel',
          type: 'NEUTRAL',
          confidence: 0.65,
          description: 'Parallel horizontal trendlines - range-bound'
        };
      }
    }
  }

  return null;
}

/**
 * Analyze price patterns
 */
export function analyzePatterns(
  candles: Candle[],
  config: AnalyzerConfig = {}
): PatternAnalysisResult {
  if (candles.length < 20) {
    throw new Error('Insufficient candles for pattern detection (minimum: 20)');
  }

  const minConfidence = config.pattern_min_confidence || 0.6;
  const detectedPatterns: DetectedPattern[] = [];

  // Try to detect each pattern type
  const triangle = detectTriangles(candles);
  if (triangle && triangle.confidence >= minConfidence) {
    detectedPatterns.push(triangle);
  }

  const wedge = detectWedges(candles);
  if (wedge && wedge.confidence >= minConfidence) {
    detectedPatterns.push(wedge);
  }

  const flag = detectFlags(candles);
  if (flag && flag.confidence >= minConfidence) {
    detectedPatterns.push(flag);
  }

  const doubleTopBottom = detectDoubleTopBottom(candles);
  if (doubleTopBottom && doubleTopBottom.confidence >= minConfidence) {
    detectedPatterns.push(doubleTopBottom);
  }

  const headAndShoulders = detectHeadAndShoulders(candles);
  if (headAndShoulders && headAndShoulders.confidence >= minConfidence) {
    detectedPatterns.push(headAndShoulders);
  }

  const channel = detectChannels(candles);
  if (channel && channel.confidence >= minConfidence) {
    detectedPatterns.push(channel);
  }

  // Select the best pattern (highest confidence)
  const bestPattern = detectedPatterns.length > 0
    ? detectedPatterns.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      )
    : null;

  // Calculate pattern score (0-100)
  let patternScore = 50; // Base score

  if (bestPattern) {
    // Score based on pattern type and confidence
    const confidenceMultiplier = bestPattern.confidence;
    
    if (bestPattern.type === 'BULLISH') {
      patternScore = 50 + (50 * confidenceMultiplier);
    } else if (bestPattern.type === 'BEARISH') {
      patternScore = 50 - (50 * confidenceMultiplier);
    } else {
      // Neutral patterns don't change score much
      patternScore = 50;
    }

    // Bonus for multiple patterns confirming
    if (detectedPatterns.length > 1) {
      const bullishCount = detectedPatterns.filter(p => p.type === 'BULLISH').length;
      const bearishCount = detectedPatterns.filter(p => p.type === 'BEARISH').length;

      if (bullishCount > bearishCount) {
        patternScore += 10;
      } else if (bearishCount > bullishCount) {
        patternScore -= 10;
      }
    }
  }

  // Normalize to 0-100
  patternScore = Math.max(0, Math.min(100, patternScore));

  return {
    pattern_score: patternScore,
    pattern: bestPattern?.name,
    pattern_type: bestPattern?.type,
    pattern_confidence: bestPattern?.confidence || 0,
    detected_patterns: detectedPatterns
  };
}

