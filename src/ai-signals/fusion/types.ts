/**
 * Fusion Engine Types
 *
 * Phase X.2 - Signal Fusion Engine
 */

import type { AnalysisResult, MarketBias, RiskLevel, Timeframe } from '../types';
import type { UserAISettings } from '@/types/ai-settings';
import type { ForecastResult } from '@/core/forecasting/types';

/**
 * Signal source types
 */
export type SignalSourceType =
  | 'AI_ANALYZER'
  | 'TV_WEBHOOK'
  | 'LEGACY_ENGINE'
  | 'MANUAL';

/**
 * Signal strength classification
 */
export type SignalStrength = 'WEAK' | 'MODERATE' | 'STRONG';

/**
 * Raw signal coming from any source
 */
export interface RawSignalSource {
  source: SignalSourceType;
  symbol: string;
  timeframe: Timeframe | string;
  side: 'BUY' | 'SELL';
  confidence?: number; // 0-100
  strength?: SignalStrength;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  rrRatio?: number;
  generatedAt?: string;
  meta?: Record<string, any>;
}

/**
 * Ultra Signal output (final signal)
 */
export interface UltraSignal {
  id: string;
  symbol: string;
  timeframe: Timeframe | string;
  side: 'BUY' | 'SELL' | 'WAIT';
  finalConfidence: number; // 0-100
  riskLevel: RiskLevel;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  rrRatio?: number;
  sourcesUsed: RawSignalSource[];
  aiScore: number;
  technicalScore: number;
  volumeScore: number;
  patternScore: number;
  waveScore: number;
  sentimentScore: number;
  bias: MarketBias;
  summary?: string;
  reasoning?: string[];
  createdAt: string;
  expiresAt?: string;
  settings?: UserAISettings;
  forecast?: ForecastResult; // Phase X.11: AI Trade Forecasting
}

/**
 * Source weight configuration
 */
export interface SourceWeightConfig {
  AI_ANALYZER: number;
  TV_WEBHOOK: number;
  LEGACY_ENGINE: number;
  MANUAL: number;
}

/**
 * Fusion configuration
 */
export interface FusionEngineConfig {
  /**
   * Weight per signal source when calculating dominance & confidence
   */
  sourceWeights?: Partial<SourceWeightConfig>;

  /**
   * Minimum confidence required to emit BUY/SELL (otherwise WAIT)
   */
  minConfidenceForAction?: number;

  /**
   * Minimum dominance ratio to trust direction (0-1)
   */
  dominanceThreshold?: number;

  /**
   * Default TTL (ms) before signal expires
   */
  defaultTtlMs?: number;
}

/**
 * Parameters for generating ultra signal
 */
export interface GenerateUltraSignalParams {
  symbol: string;
  timeframe: Timeframe | string;
  /**
   * Core AI analysis result (Phase X.1)
   */
  analysisResult?: AnalysisResult;
  /**
   * Raw signals from TradingView
   */
  tradingViewSignals?: RawSignalSource[];
  /**
   * Signals from legacy/internal engine
   */
  legacySignals?: RawSignalSource[];
  /**
   * Manual or experimental signals
   */
  manualSignals?: RawSignalSource[];
  /**
   * Optional current market price for price level calculations
   */
  marketPrice?: number;
  /**
   * Effective user settings for this signal
   */
  settings?: UserAISettings;
}

/**
 * Result from confidence contribution
 */
export interface ConfidenceContribution {
  weight: number;
  score: number;
  label: string;
}

