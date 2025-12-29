/**
 * Ultra Signal Fusion Engine
 *
 * Phase X.2 - Combines multiple signal sources into a single Ultra Signal
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AnalysisResult,
  MarketBias,
  RiskLevel,
  Timeframe
} from '../types';
import {
  type RawSignalSource,
  type UltraSignal,
  type FusionEngineConfig,
  type GenerateUltraSignalParams,
  type SourceWeightConfig,
  type ConfidenceContribution,
  type SignalStrength
} from './types';
import type { UserAISettings } from '@/types/ai-settings';
import { forecastSignal, forecastSignalRuleBased } from '@/core/forecasting/forecastEngine';
import { buildFeaturesFromSignalData } from '@/core/forecasting/featureBuilder';

const DEFAULT_SOURCE_WEIGHTS: SourceWeightConfig = {
  AI_ANALYZER: 0.5,
  TV_WEBHOOK: 0.25,
  LEGACY_ENGINE: 0.15,
  MANUAL: 0.1
};

const DEFAULT_CONFIG: Required<FusionEngineConfig> = {
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  minConfidenceForAction: 55,
  dominanceThreshold: 0.6,
  defaultTtlMs: 60 * 60 * 1000 // 1 hour
};

/**
 * Utility: map numeric score to strength label
 */
function mapConfidenceToStrength(score: number): SignalStrength {
  if (score >= 75) return 'STRONG';
  if (score >= 60) return 'MODERATE';
  return 'WEAK';
}

/**
 * Fusion engine responsible for producing Ultra Signals
 */
export class UltraSignalEngine {
  private readonly config: Required<FusionEngineConfig>;

  constructor(config?: FusionEngineConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      sourceWeights: {
        ...DEFAULT_SOURCE_WEIGHTS,
        ...(config?.sourceWeights || {})
      }
    };
  }

  /**
   * Generate Ultra Signal from provided sources
   * Phase X.11: Now async to support forecasting
   */
  async generate(params: GenerateUltraSignalParams): Promise<UltraSignal> {
    const sources = this.collectSources(params);

    if (sources.length === 0) {
      throw new Error('No signal sources provided for fusion');
    }

    const analysis = params.analysisResult;
    const contributions = this.buildConfidenceContributions(analysis, sources, params.settings);
    const baseConfidence = this.calculateWeightedConfidence(contributions);
    const sensitivityMultiplier =
      params.settings?.sensitivity === 'high'
        ? 1.08
        : params.settings?.sensitivity === 'low'
        ? 0.92
        : 1;
    let adjustedConfidence = Math.max(0, Math.min(100, baseConfidence * sensitivityMultiplier));
    const minConfidence = params.settings?.minConfidence ?? this.config.minConfidenceForAction;

    let finalSide = this.determineFinalSide(sources, adjustedConfidence, params.settings);

    if (adjustedConfidence < minConfidence) {
      finalSide = 'WAIT';
    }

    if (params.settings?.biasMode === 'breakout' && finalSide === 'WAIT' && analysis?.bias && analysis.bias !== 'WAIT') {
      finalSide = analysis.bias;
    } else if (
      params.settings?.biasMode === 'reversal' &&
      finalSide !== 'WAIT' &&
      analysis?.bias &&
      analysis.bias !== finalSide
    ) {
      finalSide = analysis.bias;
    }

    // Phase X.9: Risk level determination is now async (but we'll make it sync for backward compatibility)
    // For now, we'll use a synchronous version that doesn't access database
    // The async version will be used when supabaseClient is provided
    const riskLevel = analysis?.risk || (adjustedConfidence >= 75 ? 'LOW' : adjustedConfidence >= 60 ? 'MEDIUM' : adjustedConfidence >= 45 ? 'HIGH' : 'EXTREME');

    const { entry, stopLoss, takeProfit } = this.resolvePriceLevels(
      sources,
      analysis,
      params.marketPrice
    );

    const rrRatio =
      entry && stopLoss && takeProfit
        ? this.calculateRiskReward(entry, stopLoss, takeProfit, finalSide)
        : undefined;

    const reasoning = this.buildReasoning(finalSide, adjustedConfidence, contributions, analysis);

    const ultraSignal: UltraSignal = {
      id: uuidv4(),
      symbol: params.symbol,
      timeframe: params.timeframe,
      side: finalSide,
      finalConfidence: adjustedConfidence,
      riskLevel,
      entryPrice: entry,
      stopLoss,
      takeProfit,
      rrRatio,
      sourcesUsed: sources,
      aiScore: analysis?.combined_score ?? 0,
      technicalScore: analysis?.technical_score ?? 0,
      volumeScore: analysis?.volume_score ?? 0,
      patternScore: analysis?.pattern_score ?? 0,
      waveScore: analysis?.wave_score ?? 0,
      sentimentScore: analysis?.sentiment_score ?? 0,
      bias: analysis?.bias ?? 'WAIT',
      summary: this.buildSummary(finalSide, adjustedConfidence, riskLevel),
      reasoning,
      createdAt: new Date().toISOString(),
      settings: params.settings
    };

    // Phase X.11: Generate forecast if signal is not WAIT
    if (finalSide !== 'WAIT') {
      try {
        // Build features from signal data
        const features = buildFeaturesFromSignalData({
          symbol: params.symbol,
          timeframe: params.timeframe,
          side: finalSide,
          ai_score: ultraSignal.aiScore,
          technical_score: ultraSignal.technicalScore,
          volume_score: ultraSignal.volumeScore,
          pattern_score: ultraSignal.patternScore,
          wave_score: ultraSignal.waveScore,
          sentiment_score: ultraSignal.sentimentScore,
          risk_level: riskLevel,
        });

        // Try to get forecast from historical data, fallback to rule-based
        const forecast = await forecastSignal({
          symbol: params.symbol,
          timeframe: params.timeframe,
          side: finalSide,
          ai_score: ultraSignal.aiScore,
          technical_score: ultraSignal.technicalScore,
          volume_score: ultraSignal.volumeScore,
          pattern_score: ultraSignal.patternScore,
          wave_score: ultraSignal.waveScore,
          sentiment_score: ultraSignal.sentimentScore,
          risk_level: riskLevel,
        }).catch(() => {
          // Fallback to rule-based if forecast fails
          return forecastSignalRuleBased(features);
        });

        if (forecast) {
          ultraSignal.forecast = forecast;
        }
      } catch (error) {
        console.warn('Error generating forecast for signal:', error);
        // Continue without forecast
      }
    }

    return ultraSignal;
  }

  /**
   * Collect raw sources from all inputs
   */
  private collectSources(params: GenerateUltraSignalParams): RawSignalSource[] {
    const sources: RawSignalSource[] = [];

    if (params.analysisResult) {
      const analysisSource = this.convertAnalysisResultToSource(
        params.analysisResult,
        params.marketPrice
      );
      if (analysisSource) {
        sources.push(analysisSource);
      }
    }

    if (params.tradingViewSignals) {
      sources.push(...params.tradingViewSignals);
    }

    if (params.legacySignals) {
      sources.push(...params.legacySignals);
    }

    if (params.manualSignals) {
      sources.push(...params.manualSignals);
    }

    // Filter only relevant symbol/timeframe
    return sources.filter(
      (source) =>
        source.symbol === params.symbol &&
        (source.timeframe === params.timeframe || !source.timeframe)
    );
  }

  /**
   * Convert analysis result to raw source (AI_ANALYZER)
   */
  private convertAnalysisResultToSource(
    analysis: AnalysisResult,
    marketPrice?: number
  ): RawSignalSource | null {
    if (analysis.bias === 'WAIT') {
      return null;
    }

    const atr = analysis.technical.atr || 0;
    const referencePrice =
      marketPrice ||
      analysis.technical.vwap ||
      analysis.technical.ema20 ||
      analysis.technical.ema50;

    let entry = referencePrice;
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;

    if (referencePrice && atr > 0) {
      const riskUnit = atr * 1.5;
      const rewardUnit = atr * 2.5;
      if (analysis.bias === 'BUY') {
        stopLoss = referencePrice - riskUnit;
        takeProfit = referencePrice + rewardUnit;
      } else {
        stopLoss = referencePrice + riskUnit;
        takeProfit = referencePrice - rewardUnit;
      }
    }

    return {
      source: 'AI_ANALYZER',
      symbol: analysis.symbol,
      timeframe: analysis.timeframe,
      side: analysis.bias === 'BUY' ? 'BUY' : 'SELL',
      confidence: analysis.combined_score,
      strength: mapConfidenceToStrength(analysis.combined_score),
      entry,
      stopLoss,
      takeProfit,
      rrRatio:
        entry && stopLoss && takeProfit
          ? this.calculateRiskReward(entry, stopLoss, takeProfit, analysis.bias === 'BUY' ? 'BUY' : 'SELL')
          : undefined,
      generatedAt: new Date(analysis.timestamp).toISOString(),
      meta: {
        riskLevel: analysis.risk,
        trend: analysis.trend
      }
    };
  }

  /**
   * Build contributions list for confidence calculation
   */
  private buildConfidenceContributions(
    analysis: AnalysisResult | undefined,
    sources: RawSignalSource[],
    settings?: UserAISettings
  ): ConfidenceContribution[] {
    const contributions: ConfidenceContribution[] = [];
    const weights = settings?.fusionWeights;
    const weightFor = (key: keyof NonNullable<UserAISettings['fusionWeights']> | 'ai', fallback: number) => {
      if (!weights) return fallback;
      if (key === 'ai') return weights.aiFusion / 100;
      return (weights[key] ?? fallback) / 100;
    };

    if (analysis) {
      contributions.push(
        { label: 'AI Score', weight: weightFor('ai', 0.4), score: analysis.combined_score },
        { label: 'Technical', weight: weightFor('technical', 0.1), score: analysis.technical_score },
        { label: 'Volume', weight: weightFor('volume', 0.1), score: analysis.volume_score },
        { label: 'Patterns', weight: weightFor('patterns', 0.1), score: analysis.pattern_score },
        { label: 'Waves', weight: weightFor('elliott', 0.1), score: analysis.wave_score },
        { label: 'Sentiment', weight: weightFor('sentiment', 0.1), score: analysis.sentiment_score }
      );
    }

    const tradingViewSources = sources.filter((s) => s.source === 'TV_WEBHOOK');
    if (tradingViewSources.length > 0) {
      const avgTvConfidence =
        tradingViewSources.reduce(
          (sum, s) => sum + (s.confidence ?? 60),
          0
        ) / tradingViewSources.length;
      contributions.push({
        label: 'TradingView',
        weight: 0.25,
        score: avgTvConfidence
      });
    }

    const legacySources = sources.filter((s) => s.source === 'LEGACY_ENGINE');
    if (legacySources.length > 0) {
      const avgLegacyConfidence =
        legacySources.reduce(
          (sum, s) => sum + (s.confidence ?? 55),
          0
        ) / legacySources.length;
      contributions.push({
        label: 'Legacy Engine',
        weight: 0.15,
        score: avgLegacyConfidence
      });
    }

    const manualSources = sources.filter((s) => s.source === 'MANUAL');
    if (manualSources.length > 0) {
      const avgManualConfidence =
        manualSources.reduce(
          (sum, s) => sum + (s.confidence ?? 50),
          0
        ) / manualSources.length;
      contributions.push({
        label: 'Manual',
        weight: 0.1,
        score: avgManualConfidence
      });
    }

    return contributions;
  }

  /**
   * Weighted confidence calculation (renormalizes weights actually used)
   */
  private calculateWeightedConfidence(contributions: ConfidenceContribution[]): number {
    if (contributions.length === 0) {
      return 50;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    contributions.forEach(({ weight, score }) => {
      weightedSum += weight * score;
      totalWeight += weight;
    });

    if (totalWeight === 0) {
      return 50;
    }

    return Math.max(0, Math.min(100, weightedSum / totalWeight));
  }

  /**
   * Determine final side (BUY/SELL/WAIT)
   */
  private determineFinalSide(
    sources: RawSignalSource[],
    finalConfidence: number,
    settings?: UserAISettings
  ): 'BUY' | 'SELL' | 'WAIT' {
    const voteScore = { BUY: 0, SELL: 0 };
    const weights = this.config.sourceWeights;
    const dominance =
      settings?.sensitivity === 'high'
        ? this.config.dominanceThreshold * 0.85
        : settings?.sensitivity === 'low'
        ? this.config.dominanceThreshold * 1.1
        : this.config.dominanceThreshold;

    sources.forEach((source) => {
      const weight = weights[source.source] ?? 0.1;
      const confidence = (source.confidence ?? 60) / 100;
      voteScore[source.side] += weight * confidence;
    });

    const totalVotes = voteScore.BUY + voteScore.SELL;
    if (totalVotes === 0) {
      return 'WAIT';
    }

    const dominantSide = voteScore.BUY >= voteScore.SELL ? 'BUY' : 'SELL';
    const dominanceRatio = voteScore[dominantSide] / totalVotes;

    if (
      dominanceRatio >= dominance &&
      finalConfidence >= (settings?.minConfidence ?? this.config.minConfidenceForAction)
    ) {
      return dominantSide;
    }

    return 'WAIT';
  }

  /**
   * Determine risk level
   * Phase X.9: Enhanced with asset risk profiles (when available via analysis metadata)
   */
  private determineRiskLevel(
    confidence: number,
    analysis?: AnalysisResult
  ): RiskLevel {
    // Phase X.9: Check if analysis has asset risk profile data in metadata
    const metadata = analysis?.metadata as any;
    if (metadata?.asset_risk_level) {
      const assetRisk = metadata.asset_risk_level as RiskLevel;
      
      // Adjust based on confidence
      if (confidence >= 80 && assetRisk === 'EXTREME') {
        return 'HIGH';
      } else if (confidence >= 75 && assetRisk === 'HIGH') {
        return 'MEDIUM';
      } else if (confidence < 50 && assetRisk === 'LOW') {
        return 'MEDIUM';
      } else if (confidence < 40 && assetRisk === 'MEDIUM') {
        return 'HIGH';
      }
      
      return assetRisk;
    }

    // Default logic
    if (analysis?.risk) {
      return analysis.risk;
    }

    if (confidence >= 75) return 'LOW';
    if (confidence >= 60) return 'MEDIUM';
    if (confidence >= 45) return 'HIGH';
    return 'EXTREME';
  }

  /**
   * Resolve entry/stop/take levels from sources (prefer highest confidence)
   */
  private resolvePriceLevels(
    sources: RawSignalSource[],
    analysis?: AnalysisResult,
    fallbackPrice?: number
  ): { entry?: number; stopLoss?: number; takeProfit?: number } {
    const sortedSources = [...sources].sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );

    for (const source of sortedSources) {
      if (source.entry && source.stopLoss && source.takeProfit) {
        return {
          entry: source.entry,
          stopLoss: source.stopLoss,
          takeProfit: source.takeProfit
        };
      }
    }

    if (analysis) {
      const atr = analysis.technical.atr || 0;
      const basePrice =
        fallbackPrice ||
        analysis.technical.vwap ||
        analysis.technical.ema20 ||
        analysis.technical.ema50;

      if (basePrice && atr > 0) {
        const riskUnit = atr * 1.4;
        const rewardUnit = atr * 2.2;
        const direction = analysis.bias;

        if (direction === 'BUY') {
          return {
            entry: basePrice,
            stopLoss: basePrice - riskUnit,
            takeProfit: basePrice + rewardUnit
          };
        } else if (direction === 'SELL') {
          return {
            entry: basePrice,
            stopLoss: basePrice + riskUnit,
            takeProfit: basePrice - rewardUnit
          };
        }
      }
    }

    if (fallbackPrice) {
      return { entry: fallbackPrice };
    }

    return {};
  }

  /**
   * Calculate risk/reward ratio
   */
  private calculateRiskReward(
    entry: number,
    stopLoss: number,
    takeProfit: number,
    side: 'BUY' | 'SELL' | 'WAIT'
  ): number {
    if (!entry || !stopLoss || !takeProfit || side === 'WAIT') {
      return 0;
    }

    if (side === 'BUY') {
      const risk = entry - stopLoss;
      const reward = takeProfit - entry;
      return risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
    }

    const risk = stopLoss - entry;
    const reward = entry - takeProfit;
    return risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
  }

  /**
   * Build simple summary text
   */
  private buildSummary(side: 'BUY' | 'SELL' | 'WAIT', confidence: number, risk: RiskLevel): string {
    if (side === 'WAIT') {
      return 'Market conditions are mixed. Waiting for confirmation.';
    }

    return `${side} signal with ${confidence.toFixed(1)}% confidence (${risk} risk).`;
  }

  /**
   * Build reasoning array
   */
  private buildReasoning(
    side: 'BUY' | 'SELL' | 'WAIT',
    confidence: number,
    contributions: ConfidenceContribution[],
    analysis?: AnalysisResult
  ): string[] {
    const reasoning: string[] = [];

    if (analysis) {
      reasoning.push(`AI analyzer bias: ${analysis.bias} (${analysis.combined_score.toFixed(1)}%)`);
      reasoning.push(`Trend: ${analysis.trend}, Momentum: ${analysis.momentum.toFixed(1)}`);
    }

    contributions.forEach((c) => {
      reasoning.push(`${c.label}: ${c.score.toFixed(1)} (weight ${Math.round(c.weight * 100)}%)`);
    });

    if (side === 'WAIT') {
      reasoning.push('Final decision: WAIT due to insufficient confidence/dominance.');
    } else {
      reasoning.push(`Final decision: ${side} with ${confidence.toFixed(1)}% confidence.`);
    }

    return reasoning;
  }
}

/**
 * Convenience function
 * Phase X.11: Now async to support forecasting
 */
export async function generateUltraSignal(
  params: GenerateUltraSignalParams,
  config?: FusionEngineConfig
): Promise<UltraSignal> {
  const engine = new UltraSignalEngine(config);
  return engine.generate(params);
}

