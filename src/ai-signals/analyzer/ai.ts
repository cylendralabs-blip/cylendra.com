/**
 * AI Fusion Engine
 * 
 * Combines all analysis results using weighted formula to produce:
 * - Combined score (0-100)
 * - Market bias (BUY/SELL/WAIT)
 * - Risk level
 * - Confidence
 * - Reasoning
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import type {
  AIFusionResult,
  TechnicalAnalysisResult,
  VolumeAnalysisResult,
  PatternAnalysisResult,
  ElliottWaveAnalysisResult,
  SentimentAnalysisResult,
  MarketBias,
  RiskLevel,
  AnalyzerConfig
} from '../types';

/**
 * Fusion weights configuration
 */
interface FusionWeights {
  technical: number;
  volume: number;
  pattern: number;
  wave: number;
  sentiment: number;
  buy_pressure: number;
  sell_pressure: number;
}

/**
 * Default fusion weights
 */
const DEFAULT_FUSION_WEIGHTS: FusionWeights = {
  technical: 0.25,
  volume: 0.20,
  pattern: 0.15,
  wave: 0.15,
  sentiment: 0.10,
  buy_pressure: 0.10,
  sell_pressure: 0.05
};

/**
 * Validate and normalize weights
 */
function normalizeWeights(weights: Partial<FusionWeights>): FusionWeights {
  const normalized = { ...DEFAULT_FUSION_WEIGHTS, ...weights };
  
  // Calculate total
  const total = Object.values(normalized).reduce((sum, w) => sum + w, 0);
  
  // Normalize to sum to 1.0
  if (total > 0) {
    Object.keys(normalized).forEach(key => {
      normalized[key as keyof FusionWeights] = normalized[key as keyof FusionWeights] / total;
    });
  }
  
  return normalized;
}

/**
 * Generate reasoning for the fusion result
 */
function generateReasoning(
  technical: TechnicalAnalysisResult,
  volume: VolumeAnalysisResult,
  patterns: PatternAnalysisResult,
  elliott: ElliottWaveAnalysisResult,
  sentiment: SentimentAnalysisResult,
  combinedScore: number,
  bias: MarketBias
): string[] {
  const reasoning: string[] = [];

  // Technical analysis reasoning
  if (technical.technical_score >= 70) {
    reasoning.push(`Strong technical indicators (Score: ${technical.technical_score.toFixed(1)})`);
    if (technical.macd.trend === 'BULLISH') {
      reasoning.push('MACD shows bullish momentum');
    } else if (technical.macd.trend === 'BEARISH') {
      reasoning.push('MACD shows bearish momentum');
    }
    
    if (technical.rsi < 30) {
      reasoning.push('RSI indicates oversold conditions');
    } else if (technical.rsi > 70) {
      reasoning.push('RSI indicates overbought conditions');
    }
  } else if (technical.technical_score <= 30) {
    reasoning.push(`Weak technical indicators (Score: ${technical.technical_score.toFixed(1)})`);
  }

  // Volume analysis reasoning
  if (volume.volume_score >= 70) {
    reasoning.push(`Strong volume confirmation (Score: ${volume.volume_score.toFixed(1)})`);
    if (volume.buy_pressure > 0.6) {
      reasoning.push(`High buying pressure (${(volume.buy_pressure * 100).toFixed(1)}%)`);
    } else if (volume.sell_pressure > 0.6) {
      reasoning.push(`High selling pressure (${(volume.sell_pressure * 100).toFixed(1)}%)`);
    }
    
    if (volume.volume_spike) {
      reasoning.push(`Volume spike detected (${volume.volume_spike_magnitude.toFixed(2)}x average)`);
    }
  } else if (volume.volume_score <= 30) {
    reasoning.push(`Weak volume confirmation (Score: ${volume.volume_score.toFixed(1)})`);
  }

  // Pattern reasoning
  if (patterns.pattern) {
    reasoning.push(`Pattern detected: ${patterns.pattern} (Confidence: ${(patterns.pattern_confidence * 100).toFixed(1)}%)`);
    if (patterns.pattern_type === 'BULLISH') {
      reasoning.push('Pattern suggests bullish continuation/reversal');
    } else if (patterns.pattern_type === 'BEARISH') {
      reasoning.push('Pattern suggests bearish continuation/reversal');
    }
  }

  // Elliott Wave reasoning
  if (elliott.wave && elliott.wave_phase !== 'UNKNOWN') {
    reasoning.push(`Elliott Wave: ${elliott.wave} (Phase: ${elliott.wave_phase})`);
    if (elliott.current_wave) {
      reasoning.push(`Currently in Wave ${elliott.current_wave}`);
    }
  }

  // Sentiment reasoning
  if (sentiment.sentiment_score >= 70) {
    reasoning.push(`Positive market sentiment (Score: ${sentiment.sentiment_score.toFixed(1)})`);
    if (sentiment.overall_sentiment === 'POSITIVE') {
      reasoning.push('Overall sentiment is bullish');
    }
  } else if (sentiment.sentiment_score <= 30) {
    reasoning.push(`Negative market sentiment (Score: ${sentiment.sentiment_score.toFixed(1)})`);
    if (sentiment.overall_sentiment === 'NEGATIVE') {
      reasoning.push('Overall sentiment is bearish');
    }
  }

  if (sentiment.funding_rate !== undefined) {
    if (sentiment.funding_rate < -0.01) {
      reasoning.push('Negative funding rate suggests bullish sentiment');
    } else if (sentiment.funding_rate > 0.01) {
      reasoning.push('Positive funding rate suggests bearish sentiment');
    }
  }

  // Combined score reasoning
  if (combinedScore >= 75) {
    reasoning.push('High confidence signal - multiple factors align');
  } else if (combinedScore >= 60) {
    reasoning.push('Moderate confidence signal - most factors align');
  } else if (combinedScore <= 25) {
    reasoning.push('Low confidence signal - conflicting factors');
  } else if (combinedScore <= 40) {
    reasoning.push('Weak signal - mixed indicators');
  }

  // Bias reasoning
  if (bias === 'BUY') {
    reasoning.push('Overall bias: BUY - favorable conditions for long positions');
  } else if (bias === 'SELL') {
    reasoning.push('Overall bias: SELL - favorable conditions for short positions');
  } else {
    reasoning.push('Overall bias: WAIT - unclear direction, wait for confirmation');
  }

  return reasoning.length > 0 ? reasoning : ['Analysis completed - mixed signals'];
}

/**
 * Determine risk level based on combined factors
 */
function determineRiskLevel(
  combinedScore: number,
  technical: TechnicalAnalysisResult,
  volume: VolumeAnalysisResult,
  sentiment: SentimentAnalysisResult
): RiskLevel {
  // High volatility = higher risk
  const volatilityRisk = technical.volatility > 70 ? 1 : technical.volatility > 50 ? 0.5 : 0;
  
  // Low volume = higher risk
  const volumeRisk = volume.volume_score < 40 ? 1 : volume.volume_score < 60 ? 0.5 : 0;
  
  // Extreme sentiment = higher risk
  const sentimentRisk = sentiment.sentiment_score > 80 || sentiment.sentiment_score < 20 ? 0.5 : 0;
  
  // Low combined score = higher risk
  const scoreRisk = combinedScore < 40 ? 1 : combinedScore < 60 ? 0.5 : 0;
  
  const totalRisk = volatilityRisk + volumeRisk + sentimentRisk + scoreRisk;
  
  if (totalRisk >= 3) {
    return 'EXTREME';
  } else if (totalRisk >= 2) {
    return 'HIGH';
  } else if (totalRisk >= 1) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Calculate confidence (0-1) based on score consistency
 */
function calculateConfidence(
  combinedScore: number,
  technical: TechnicalAnalysisResult,
  volume: VolumeAnalysisResult,
  patterns: PatternAnalysisResult,
  elliott: ElliottWaveAnalysisResult,
  sentiment: SentimentAnalysisResult
): number {
  // Count how many analyzers agree
  const scores = [
    technical.technical_score,
    volume.volume_score,
    patterns.pattern_score,
    elliott.wave_score,
    sentiment.sentiment_score
  ];

  // Calculate standard deviation
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Lower stdDev = higher confidence (more agreement)
  const consistency = Math.max(0, 1 - (stdDev / 50)); // Normalize to 0-1

  // Also consider how far from neutral (50) the combined score is
  const distanceFromNeutral = Math.abs(combinedScore - 50) / 50; // 0-1

  // Confidence is combination of consistency and distance from neutral
  const confidence = (consistency * 0.6) + (distanceFromNeutral * 0.4);

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Fuse all analysis results using weighted formula
 */
export function fuseAnalysis(
  technical: TechnicalAnalysisResult,
  volume: VolumeAnalysisResult,
  patterns: PatternAnalysisResult,
  elliott: ElliottWaveAnalysisResult,
  sentiment: SentimentAnalysisResult,
  config: AnalyzerConfig = {}
): AIFusionResult {
  // Get fusion weights
  const weights = normalizeWeights(config.fusion_weights);

  // Calculate combined score using weighted formula
  const combinedScore = 
    (technical.technical_score * weights.technical) +
    (volume.volume_score * weights.volume) +
    (patterns.pattern_score * weights.pattern) +
    (elliott.wave_score * weights.wave) +
    (sentiment.sentiment_score * weights.sentiment) +
    (volume.buy_pressure * 100 * weights.buy_pressure) +
    ((1 - volume.sell_pressure) * 100 * weights.sell_pressure);

  // Normalize to 0-100
  const normalizedScore = Math.max(0, Math.min(100, combinedScore));

  // Determine market bias
  let bias: MarketBias = 'WAIT';
  if (normalizedScore >= 60) {
    bias = 'BUY';
  } else if (normalizedScore <= 40) {
    bias = 'SELL';
  }

  // Calculate confidence
  const confidence = calculateConfidence(
    normalizedScore,
    technical,
    volume,
    patterns,
    elliott,
    sentiment
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(
    normalizedScore,
    technical,
    volume,
    sentiment
  );

  // Generate reasoning
  const reasoning = generateReasoning(
    technical,
    volume,
    patterns,
    elliott,
    sentiment,
    normalizedScore,
    bias
  );

  return {
    combined_score: normalizedScore,
    bias,
    confidence,
    risk_level: riskLevel,
    reasoning,
    weight_breakdown: {
      technical: weights.technical,
      volume: weights.volume,
      pattern: weights.pattern,
      wave: weights.wave,
      sentiment: weights.sentiment,
      buy_pressure: weights.buy_pressure,
      sell_pressure: weights.sell_pressure
    }
  };
}

