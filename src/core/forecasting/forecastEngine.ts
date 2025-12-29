/**
 * Forecasting Engine
 * 
 * Phase X.11 - AI Trade Forecasting Engine
 * 
 * Predicts signal success probability and expected returns
 */

import { supabase } from '@/integrations/supabase/client';
import type { SignalFeatures, ForecastResult } from './types';
import { buildFeaturesForSignal, buildFeaturesFromSignalData } from './featureBuilder';

/**
 * Find similar historical signals based on features
 */
async function findSimilarSignals(
  features: SignalFeatures,
  symbol: string,
  side: string,
  limit: number = 100
): Promise<any[]> {
  try {
    // Query signal_outcomes for similar signals
    // We'll match on:
    // - Same symbol (or similar category)
    // - Same side
    // - Similar AI scores (±15)
    // - Similar risk level
    
    const aiScoreMin = Math.max(0, features.ai_score - 15);
    const aiScoreMax = Math.min(100, features.ai_score + 15);
    
    const riskLevelMap: Record<number, string[]> = {
      1: ['LOW'],
      2: ['MEDIUM'],
      3: ['HIGH'],
      4: ['EXTREME'],
    };
    
    const riskLevels = riskLevelMap[features.risk_level_numeric] || ['MEDIUM', 'HIGH'];

    const { data, error } = await supabase
      .from('signal_outcomes' as any)
      .select('*')
      .eq('side', side)
      .eq('symbol', symbol)
      .gte('ai_score', aiScoreMin)
      .lte('ai_score', aiScoreMax)
      .in('risk_level', riskLevels)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error finding similar signals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in findSimilarSignals:', error);
    return [];
  }
}

/**
 * Calculate conditional statistics from similar signals
 */
function calculateConditionalStats(similarSignals: any[]): {
  successRate: number;
  avgReturn: number;
  avgHoldingTime: number;
  winCount: number;
  lossCount: number;
} {
  if (similarSignals.length === 0) {
    return {
      successRate: 50, // Default to 50% if no data
      avgReturn: 0,
      avgHoldingTime: 3600, // 1 hour default
      winCount: 0,
      lossCount: 0,
    };
  }

  const wins = similarSignals.filter(s => s.result_label === 'WIN');
  const losses = similarSignals.filter(s => s.result_label === 'LOSS');
  const winCount = wins.length;
  const lossCount = losses.length;
  const successRate = (winCount / similarSignals.length) * 100;

  // Calculate average return (weighted by win/loss)
  const totalReturn = similarSignals.reduce((sum, s) => sum + (s.profit_loss_percentage || 0), 0);
  const avgReturn = totalReturn / similarSignals.length;

  // Calculate average holding time for winning trades
  const winningHoldingTimes = wins
    .filter(s => s.holding_duration_seconds)
    .map(s => s.holding_duration_seconds);
  const avgHoldingTime = winningHoldingTimes.length > 0
    ? winningHoldingTimes.reduce((sum, t) => sum + t, 0) / winningHoldingTimes.length
    : 3600;

  return {
    successRate,
    avgReturn,
    avgHoldingTime: Math.round(avgHoldingTime),
    winCount,
    lossCount,
  };
}

/**
 * Calculate risk-adjusted score
 */
function calculateRiskAdjustedScore(
  successRate: number,
  expectedReturn: number,
  riskLevel: number
): number {
  // Base score from success rate
  let score = successRate;

  // Adjust for expected return (positive returns boost score)
  if (expectedReturn > 0) {
    score += Math.min(20, expectedReturn * 2); // Cap at +20
  } else {
    score -= Math.min(20, Math.abs(expectedReturn) * 2); // Cap at -20
  }

  // Adjust for risk level (lower risk = higher score)
  const riskPenalty = (riskLevel - 1) * 5; // 0, 5, 10, 15
  score -= riskPenalty;

  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine forecast label based on scores
 */
function determineForecastLabel(
  successRate: number,
  riskAdjustedScore: number
): "HIGH" | "MEDIUM" | "LOW" {
  // High: success rate > 65% AND risk-adjusted > 70
  if (successRate >= 65 && riskAdjustedScore >= 70) {
    return 'HIGH';
  }

  // Low: success rate < 45% OR risk-adjusted < 45
  if (successRate < 45 || riskAdjustedScore < 45) {
    return 'LOW';
  }

  // Medium: everything else
  return 'MEDIUM';
}

/**
 * Forecast signal using statistical analysis
 */
export async function forecastSignal(
  signalIdOrData: string | {
    symbol: string;
    timeframe: string;
    side: string;
    ai_score?: number;
    technical_score?: number;
    volume_score?: number;
    pattern_score?: number;
    wave_score?: number;
    sentiment_score?: number;
    risk_level?: string;
    volatility_score?: number;
    activity_score?: number;
    funding_rate?: number;
    market_sentiment_value?: number;
  }
): Promise<ForecastResult | null> {
  try {
    // Build features
    let features: SignalFeatures | null;
    let symbol: string;
    let side: string;

    if (typeof signalIdOrData === 'string') {
      features = await buildFeaturesForSignal(signalIdOrData);
      if (!features) {
        return null;
      }
      
      // Get symbol and side from signal
      const { data: signal } = await supabase
        .from('ai_signals_history' as any)
        .select('symbol, side')
        .eq('id', signalIdOrData)
        .maybeSingle();
      
      if (!signal) {
        return null;
      }
      
      symbol = (signal as any).symbol;
      side = (signal as any).side;
    } else {
      features = buildFeaturesFromSignalData(signalIdOrData);
      symbol = signalIdOrData.symbol;
      side = signalIdOrData.side;
    }

    // Find similar historical signals
    const similarSignals = await findSimilarSignals(features, symbol, side);

    // Calculate conditional statistics
    const stats = calculateConditionalStats(similarSignals);

    // Calculate risk-adjusted score
    const riskAdjustedScore = calculateRiskAdjustedScore(
      stats.successRate,
      stats.avgReturn,
      features.risk_level_numeric
    );

    // Determine forecast label
    const forecastLabel = determineForecastLabel(stats.successRate, riskAdjustedScore);

    // Calculate confidence based on sample size
    const confidence = Math.min(100, Math.max(30, similarSignals.length * 0.5));

    return {
      success_probability: Math.round(stats.successRate * 10) / 10,
      expected_return_pct: Math.round(stats.avgReturn * 100) / 100,
      expected_holding_seconds: stats.avgHoldingTime,
      risk_adjusted_score: Math.round(riskAdjustedScore * 10) / 10,
      forecast_label: forecastLabel,
      sample_size: similarSignals.length,
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error('Error forecasting signal:', error);
    return null;
  }
}

/**
 * Rule-based forecast (fallback when no historical data)
 */
export function forecastSignalRuleBased(features: SignalFeatures): ForecastResult {
  // Simple rule-based approach
  let successProb = 50;
  let expectedReturn = 0;
  let riskAdjusted = 50;

  // Adjust based on AI score
  if (features.ai_score >= 80) {
    successProb += 20;
    expectedReturn += 2;
  } else if (features.ai_score >= 70) {
    successProb += 10;
    expectedReturn += 1;
  } else if (features.ai_score < 50) {
    successProb -= 15;
    expectedReturn -= 1;
  }

  // Adjust based on sentiment
  if (features.sentiment_score >= 70) {
    successProb += 5;
  } else if (features.sentiment_score < 40) {
    successProb -= 10;
  }

  // Adjust based on risk level
  const riskPenalty = (features.risk_level_numeric - 1) * 5;
  successProb -= riskPenalty;
  riskAdjusted -= riskPenalty;

  // Normalize
  successProb = Math.max(20, Math.min(90, successProb));
  riskAdjusted = Math.max(20, Math.min(90, riskAdjusted));

  const forecastLabel = determineForecastLabel(successProb, riskAdjusted);

  return {
    success_probability: Math.round(successProb * 10) / 10,
    expected_return_pct: Math.round(expectedReturn * 100) / 100,
    expected_holding_seconds: 3600, // Default 1 hour
    risk_adjusted_score: Math.round(riskAdjusted * 10) / 10,
    forecast_label: forecastLabel,
    confidence: 50, // Lower confidence for rule-based
  };
}

