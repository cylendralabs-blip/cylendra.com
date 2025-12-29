/**
 * Volume & Order Flow Analyzer
 * 
 * Analyzes volume patterns, buy/sell pressure, and liquidity zones
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { Candle } from '@/services/marketData/types';
import type { VolumeAnalysisResult, MarketBias, TrendDirection, VolumeData, AnalyzerConfig } from '../types';

/**
 * Calculate buy vs sell pressure from candle structure
 */
function calculateBuySellPressure(candles: Candle[]): { buyPressure: number; sellPressure: number } {
  if (candles.length === 0) {
    return { buyPressure: 0.5, sellPressure: 0.5 };
  }

  let totalBuyVolume = 0;
  let totalSellVolume = 0;
  let totalVolume = 0;

  for (const candle of candles) {
    const volume = candle.volume || 0;
    totalVolume += volume;

    // Estimate buy vs sell volume based on candle body
    // Green candle (close > open) = more buying
    // Red candle (close < open) = more selling
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    
    if (totalRange === 0) {
      // Doji - neutral
      totalBuyVolume += volume * 0.5;
      totalSellVolume += volume * 0.5;
    } else {
      const bodyRatio = bodySize / totalRange;
      
      if (candle.close > candle.open) {
        // Bullish candle
        const buyRatio = 0.5 + (bodyRatio * 0.5); // 0.5 to 1.0
        totalBuyVolume += volume * buyRatio;
        totalSellVolume += volume * (1 - buyRatio);
      } else {
        // Bearish candle
        const sellRatio = 0.5 + (bodyRatio * 0.5); // 0.5 to 1.0
        totalSellVolume += volume * sellRatio;
        totalBuyVolume += volume * (1 - sellRatio);
      }
    }
  }

  if (totalVolume === 0) {
    return { buyPressure: 0.5, sellPressure: 0.5 };
  }

  const buyPressure = totalBuyVolume / totalVolume;
  const sellPressure = totalSellVolume / totalVolume;

  return {
    buyPressure: Math.max(0, Math.min(1, buyPressure)),
    sellPressure: Math.max(0, Math.min(1, sellPressure))
  };
}

/**
 * Calculate delta volume (buy volume - sell volume)
 */
function calculateDeltaVolume(candles: Candle[]): number {
  const { buyPressure, sellPressure } = calculateBuySellPressure(candles);
  const totalVolume = candles.reduce((sum, c) => sum + (c.volume || 0), 0);
  return (buyPressure - sellPressure) * totalVolume;
}

/**
 * Detect volume spikes
 */
function detectVolumeSpike(
  candles: Candle[],
  threshold: number = 1.5,
  lookback: number = 20
): { isSpike: boolean; magnitude: number } {
  if (candles.length < lookback + 1) {
    return { isSpike: false, magnitude: 1.0 };
  }

  const recentCandles = candles.slice(-lookback - 1);
  const volumes = recentCandles.map(c => c.volume || 0);
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(0, -1).reduce((sum, v) => sum + v, 0) / (volumes.length - 1);

  if (avgVolume === 0) {
    return { isSpike: false, magnitude: 1.0 };
  }

  const magnitude = currentVolume / avgVolume;
  const isSpike = magnitude >= threshold;

  return { isSpike, magnitude };
}

/**
 * Identify liquidity zones (support and resistance)
 */
function identifyLiquidityZones(candles: Candle[]): { support: number[]; resistance: number[] } {
  if (candles.length < 20) {
    return { support: [], resistance: [] };
  }

  // Use recent candles for liquidity zones
  const recentCandles = candles.slice(-50);
  const lows = recentCandles.map(c => c.low);
  const highs = recentCandles.map(c => c.high);
  const volumes = recentCandles.map(c => c.volume || 0);

  // Find support levels (local lows with high volume)
  const support: number[] = [];
  const resistance: number[] = [];

  // Simple approach: find local minima and maxima
  for (let i = 2; i < lows.length - 2; i++) {
    const isLocalLow = lows[i] < lows[i - 1] && 
                      lows[i] < lows[i - 2] && 
                      lows[i] < lows[i + 1] && 
                      lows[i] < lows[i + 2];
    
    const isLocalHigh = highs[i] > highs[i - 1] && 
                       highs[i] > highs[i - 2] && 
                       highs[i] > highs[i + 1] && 
                       highs[i] > highs[i + 2];

    if (isLocalLow && volumes[i] > 0) {
      support.push(lows[i]);
    }

    if (isLocalHigh && volumes[i] > 0) {
      resistance.push(highs[i]);
    }
  }

  // Remove duplicates and sort
  const uniqueSupport = [...new Set(support)].sort((a, b) => a - b);
  const uniqueResistance = [...new Set(resistance)].sort((a, b) => b - a);

  // Keep only significant levels (top 3-5)
  return {
    support: uniqueSupport.slice(0, 5),
    resistance: uniqueResistance.slice(0, 5)
  };
}

/**
 * Determine volume trend
 */
function determineVolumeTrend(candles: Candle[], period: number = 20): TrendDirection {
  if (candles.length < period) {
    return 'SIDEWAYS';
  }

  const recentCandles = candles.slice(-period);
  const volumes = recentCandles.map(c => c.volume || 0);

  // Calculate volume moving average
  const firstHalf = volumes.slice(0, Math.floor(period / 2));
  const secondHalf = volumes.slice(Math.floor(period / 2));

  const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (changePercent > 10) {
    return 'UP';
  } else if (changePercent < -10) {
    return 'DOWN';
  }

  return 'SIDEWAYS';
}

/**
 * Analyze volume and order flow
 */
export function analyzeVolume(
  volumeData: VolumeData,
  config: AnalyzerConfig = {}
): VolumeAnalysisResult {
  const { candles, takerBuyVolume, takerSellVolume } = volumeData;

  if (candles.length === 0) {
    throw new Error('No candles provided for volume analysis');
  }

  // Calculate buy/sell pressure
  const { buyPressure, sellPressure } = calculateBuySellPressure(candles);

  // If we have taker buy/sell volume, use it for more accurate calculation
  let finalBuyPressure = buyPressure;
  let finalSellPressure = sellPressure;

  if (takerBuyVolume && takerSellVolume && takerBuyVolume.length > 0 && takerSellVolume.length > 0) {
    const totalBuy = takerBuyVolume.reduce((sum, v) => sum + v, 0);
    const totalSell = takerSellVolume.reduce((sum, v) => sum + v, 0);
    const total = totalBuy + totalSell;

    if (total > 0) {
      finalBuyPressure = totalBuy / total;
      finalSellPressure = totalSell / total;
    }
  }

  // Calculate delta volume
  const deltaVolume = calculateDeltaVolume(candles);

  // Detect volume spikes
  const spikeThreshold = config.volume_spike_threshold || 1.5;
  const lookback = config.volume_lookback || 20;
  const { isSpike, magnitude } = detectVolumeSpike(candles, spikeThreshold, lookback);

  // Identify liquidity zones
  const liquidityZones = identifyLiquidityZones(candles);

  // Determine volume trend
  const volumeTrend = determineVolumeTrend(candles);

  // Calculate volume score (0-100)
  let volumeScore = 50; // Base score

  // Buy/sell pressure contribution (0-30 points)
  if (finalBuyPressure > 0.6) {
    volumeScore += 30; // Strong buying pressure
  } else if (finalBuyPressure > 0.55) {
    volumeScore += 15; // Moderate buying pressure
  } else if (finalSellPressure > 0.6) {
    volumeScore -= 30; // Strong selling pressure
  } else if (finalSellPressure > 0.55) {
    volumeScore -= 15; // Moderate selling pressure
  }

  // Volume spike contribution (0-20 points)
  if (isSpike && magnitude > 2.0) {
    // Strong volume spike - indicates strong interest
    volumeScore += 20;
  } else if (isSpike && magnitude > 1.5) {
    volumeScore += 10;
  }

  // Volume trend contribution (0-15 points)
  if (volumeTrend === 'UP') {
    volumeScore += 15; // Increasing volume (bullish)
  } else if (volumeTrend === 'DOWN') {
    volumeScore -= 15; // Decreasing volume (bearish)
  }

  // Delta volume contribution (0-15 points)
  const deltaPercent = (deltaVolume / (candles.reduce((sum, c) => sum + (c.volume || 0), 0) || 1)) * 100;
  if (deltaPercent > 20) {
    volumeScore += 15; // Strong positive delta
  } else if (deltaPercent > 10) {
    volumeScore += 8;
  } else if (deltaPercent < -20) {
    volumeScore -= 15; // Strong negative delta
  } else if (deltaPercent < -10) {
    volumeScore -= 8;
  }

  // Normalize to 0-100
  volumeScore = Math.max(0, Math.min(100, volumeScore));

  // Determine liquidity bias
  let liquidityBias: MarketBias = 'WAIT';
  if (finalBuyPressure > 0.6 && volumeScore > 60) {
    liquidityBias = 'BUY';
  } else if (finalSellPressure > 0.6 && volumeScore < 40) {
    liquidityBias = 'SELL';
  }

  return {
    volume_score: volumeScore,
    buy_pressure: finalBuyPressure,
    sell_pressure: finalSellPressure,
    liquidity_bias: liquidityBias,
    volume_trend: volumeTrend,
    volume_spike: isSpike,
    volume_spike_magnitude: magnitude,
    liquidity_zones: liquidityZones,
    delta_volume: deltaVolume
  };
}

/**
 * Get buy pressure
 */
export function getBuyPressure(candles: Candle[]): number {
  const { buyPressure } = calculateBuySellPressure(candles);
  return buyPressure;
}

/**
 * Get sell pressure
 */
export function getSellPressure(candles: Candle[]): number {
  const { sellPressure } = calculateBuySellPressure(candles);
  return sellPressure;
}

/**
 * Get delta volume
 */
export function getDeltaVolume(candles: Candle[]): number {
  return calculateDeltaVolume(candles);
}

/**
 * Check for volume spike
 */
export function checkVolumeSpike(
  candles: Candle[],
  threshold: number = 1.5
): boolean {
  return detectVolumeSpike(candles, threshold).isSpike;
}

