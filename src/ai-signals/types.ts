/**
 * AI Ultra Signal Engine - Types
 * 
 * Unified type definitions for Phase X.1 - AI Multi-Factor Analyzer
 * 
 * Phase X: AI Ultra Signal Engine
 */

import { Candle } from '@/services/marketData/types';
import type { UserAISettings } from '@/types/ai-settings';

/**
 * Timeframe type
 */
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

/**
 * Trend Direction
 */
export type TrendDirection = 'UP' | 'DOWN' | 'SIDEWAYS';

/**
 * Market Bias
 */
export type MarketBias = 'BUY' | 'SELL' | 'WAIT';

/**
 * Risk Level
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

/**
 * Volatility Level
 */
export type VolatilityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

/**
 * Technical Analysis Result
 */
export interface TechnicalAnalysisResult {
  trend: TrendDirection;
  momentum: number; // 0-100
  volatility: number; // 0-100
  technical_score: number; // 0-100
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  ema20: number;
  ema50: number;
  ema200: number;
  adx: {
    value: number;
    trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  atr: number;
  stochastic: {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: 'ABOVE_UPPER' | 'BETWEEN' | 'BELOW_LOWER';
    squeeze: boolean;
  };
  vwap?: number;
}

/**
 * Volume Analysis Result
 */
export interface VolumeAnalysisResult {
  volume_score: number; // 0-100
  buy_pressure: number; // 0-1
  sell_pressure: number; // 0-1
  liquidity_bias: MarketBias;
  volume_trend: TrendDirection;
  volume_spike: boolean;
  volume_spike_magnitude: number; // multiplier
  liquidity_zones: {
    support: number[];
    resistance: number[];
  };
  delta_volume: number; // positive = more buying, negative = more selling
}

/**
 * Pattern Detection Result
 */
export interface PatternAnalysisResult {
  pattern_score: number; // 0-100
  pattern?: string; // Pattern name
  pattern_type?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  pattern_confidence: number; // 0-1
  detected_patterns: Array<{
    name: string;
    type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    description: string;
  }>;
}

/**
 * Elliott Wave Analysis Result
 */
export interface ElliottWaveAnalysisResult {
  wave_score: number; // 0-100
  wave?: string; // Wave pattern name
  wave_phase?: 'IMPULSE' | 'CORRECTION' | 'UNKNOWN';
  current_wave?: number; // 1-5 for impulse, A-B-C for correction
  wave_structure?: {
    wave1?: { start: number; end: number; price: number };
    wave2?: { start: number; end: number; price: number };
    wave3?: { start: number; end: number; price: number };
    wave4?: { start: number; end: number; price: number };
    wave5?: { start: number; end: number; price: number };
  };
  fibonacci_levels?: {
    retracement_382?: number;
    retracement_500?: number;
    retracement_618?: number;
  };
}

/**
 * Sentiment Analysis Result
 */
export interface SentimentAnalysisResult {
  sentiment_score: number; // 0-100
  funding_rate?: number;
  overall_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  fear_greed_index?: number; // 0-100
  social_sentiment?: number; // 0-100 (optional)
  funding_bias?: MarketBias;
}

/**
 * AI Fusion Result
 */
export interface AIFusionResult {
  combined_score: number; // 0-100 (final weighted score)
  bias: MarketBias;
  confidence: number; // 0-1
  risk_level: RiskLevel;
  reasoning: string[]; // Array of reasoning strings
  weight_breakdown: {
    technical: number;
    volume: number;
    pattern: number;
    wave: number;
    sentiment: number;
    buy_pressure: number;
    sell_pressure: number;
  };
}

/**
 * Unified Analysis Result
 * 
 * This is the final output from Phase X.1 analyzer
 */
export interface AnalysisResult {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number; // Analysis timestamp
  
  // Core metrics
  trend: TrendDirection;
  momentum: number; // 0-100
  volatility: number; // 0-100
  risk: RiskLevel;
  bias: MarketBias;
  
  // Pressure indicators
  buy_pressure: number; // 0-1
  sell_pressure: number; // 0-1
  
  // Individual scores
  technical_score: number; // 0-100
  volume_score: number; // 0-100
  pattern_score: number; // 0-100
  wave_score: number; // 0-100
  sentiment_score: number; // 0-100
  
  // Combined AI score
  combined_score: number; // 0-100 (final weighted score)
  
  // Pattern and wave info
  pattern?: string;
  wave?: string;
  
  // Detailed results from each analyzer
  technical: TechnicalAnalysisResult;
  volume: VolumeAnalysisResult;
  patterns: PatternAnalysisResult;
  elliott: ElliottWaveAnalysisResult;
  sentiment: SentimentAnalysisResult;
  ai_fusion: AIFusionResult;
  
  // Additional metadata
  metadata?: {
    analysis_duration_ms?: number;
    candles_analyzed?: number;
    indicators_calculated?: string[];
    settings_mode?: 'custom' | 'default';
    settings_timeframe?: string;
    // Phase X.8: Real-time analysis metadata
    is_realtime?: boolean;
    realtime_delta_volume?: number;
    realtime_pressure_change?: number;
    current_candle_age_ms?: number;
  };
}

/**
 * Volume Data Input
 */
export interface VolumeData {
  candles: Candle[];
  takerBuyVolume?: number[];
  takerSellVolume?: number[];
  quoteVolume?: number[];
}

/**
 * Sentiment Data Input
 */
export interface SentimentData {
  fear_greed_index?: number;
  funding_rate?: number;
  open_interest?: number;
  social_sentiment?: number;
  timestamp?: number;
}

/**
 * Analysis Input Parameters
 */
export interface AnalysisInput {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  volumeData?: VolumeData;
  sentimentData?: SentimentData;
  settings?: UserAISettings;
  // Phase X.9: Optional Supabase client for database-backed sentiment
  supabaseClient?: any; // SupabaseClient type (avoiding circular dependency)
}

/**
 * Analyzer Configuration
 */
export interface AnalyzerConfig {
  // Technical indicators periods
  rsi_period?: number;
  macd_fast?: number;
  macd_slow?: number;
  macd_signal?: number;
  ema_periods?: {
    short: number;
    medium: number;
    long: number;
  };
  adx_period?: number;
  atr_period?: number;
  stochastic_period?: number;
  bollinger_period?: number;
  bollinger_std?: number;
  
  // Volume analysis
  volume_spike_threshold?: number; // multiplier
  volume_lookback?: number;
  
  // Pattern detection
  pattern_min_confidence?: number;
  
  // Elliott Wave
  wave_min_swings?: number;
  
  // AI Fusion weights
  fusion_weights?: {
    technical: number;
    volume: number;
    pattern: number;
    wave: number;
    sentiment: number;
    buy_pressure: number;
    sell_pressure: number;
  };
  
  // Minimum candles required
  min_candles?: number;
}

/**
 * Default Analyzer Configuration
 */
export const DEFAULT_ANALYZER_CONFIG: AnalyzerConfig = {
  rsi_period: 14,
  macd_fast: 12,
  macd_slow: 26,
  macd_signal: 9,
  ema_periods: {
    short: 20,
    medium: 50,
    long: 200
  },
  adx_period: 14,
  atr_period: 14,
  stochastic_period: 14,
  bollinger_period: 20,
  bollinger_std: 2,
  volume_spike_threshold: 1.5,
  volume_lookback: 20,
  pattern_min_confidence: 0.6,
  wave_min_swings: 5,
  fusion_weights: {
    technical: 0.25,
    volume: 0.20,
    pattern: 0.15,
    wave: 0.15,
    sentiment: 0.10,
    buy_pressure: 0.10,
    sell_pressure: 0.05
  },
  min_candles: 50
};

