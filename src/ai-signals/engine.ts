/**
 * AI Ultra Signal Engine
 * 
 * Main orchestrator for Phase X.1 - AI Multi-Factor Analyzer
 * 
 * Coordinates all analyzers and produces unified AnalysisResult
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { Candle } from '@/services/marketData/types';
import { analyzeTechnical } from './analyzer/technical';
import { analyzeVolume } from './analyzer/volume';
import { analyzePatterns } from './analyzer/patterns';
import { analyzeElliottWaves } from './analyzer/elliott';
import { analyzeSentiment } from './analyzer/sentiment';
import { fuseAnalysis } from './analyzer/ai';
import type {
  AnalysisResult,
  AnalysisInput,
  AnalyzerConfig,
  VolumeData,
  SentimentData,
  TechnicalAnalysisResult,
  VolumeAnalysisResult,
  PatternAnalysisResult,
  ElliottWaveAnalysisResult,
  SentimentAnalysisResult
} from './types';
import { DEFAULT_ANALYZER_CONFIG } from './types';
import type { UserAISettings } from '@/types/ai-settings';
import { cloneSmartDefaults } from '@/core/ai-settings/defaults';

function getLastCandle(candles: Candle[]): Candle {
  return candles[candles.length - 1] ?? {
    openTime: 0,
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    closeTime: 0
  };
}

function neutralTechnicalResult(candles: Candle[]): TechnicalAnalysisResult {
  const last = getLastCandle(candles);
  return {
    trend: 'SIDEWAYS',
    momentum: 50,
    volatility: 50,
    technical_score: 50,
    rsi: 50,
    macd: { line: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' },
    ema20: last.close,
    ema50: last.close,
    ema200: last.close,
    adx: { value: 15, trend_strength: 'WEAK' },
    atr: 0,
    stochastic: { k: 50, d: 50, signal: 'NEUTRAL' },
    bollingerBands: {
      upper: last.close,
      middle: last.close,
      lower: last.close,
      position: 'BETWEEN',
      squeeze: false
    }
  };
}

function neutralVolumeResult(): VolumeAnalysisResult {
  return {
    volume_score: 50,
    buy_pressure: 0.5,
    sell_pressure: 0.5,
    liquidity_bias: 'WAIT',
    volume_trend: 'SIDEWAYS',
    volume_spike: false,
    volume_spike_magnitude: 1,
    liquidity_zones: { support: [], resistance: [] },
    delta_volume: 0
  };
}

function neutralPatternResult(): PatternAnalysisResult {
  return {
    pattern_score: 50,
    pattern_confidence: 0.5,
    detected_patterns: []
  };
}

function neutralWaveResult(): ElliottWaveAnalysisResult {
  return {
    wave_score: 50,
    wave_phase: 'UNKNOWN'
  };
}

function neutralSentimentResult(): SentimentAnalysisResult {
  return {
    sentiment_score: 50,
    overall_sentiment: 'NEUTRAL'
  };
}

function convertFusionWeights(settings?: UserAISettings['fusionWeights']) {
  if (!settings) return undefined;
  const base = {
    technical: settings.technical / 100,
    volume: settings.volume / 100,
    pattern: settings.patterns / 100,
    wave: settings.elliott / 100,
    sentiment: settings.sentiment / 100,
    buy_pressure: 0.05,
    sell_pressure: 0.05
  };
  const total = Object.values(base).reduce((sum, val) => sum + val, 0) || 1;
  Object.keys(base).forEach((key) => {
    base[key as keyof typeof base] = base[key as keyof typeof base] / total;
  });
  return base;
}

function applyTechnicalParams(config: AnalyzerConfig, settings?: UserAISettings) {
  const params = settings?.indicators?.technical?.params;
  if (!params) return config;
  return {
    ...config,
    rsi_period: params.rsiLength ? Number(params.rsiLength) : config.rsi_period,
    macd_fast: params.macdFast ? Number(params.macdFast) : config.macd_fast,
    macd_slow: params.macdSlow ? Number(params.macdSlow) : config.macd_slow,
    macd_signal: params.macdSignal ? Number(params.macdSignal) : config.macd_signal,
    atr_period: params.atrPeriod ? Number(params.atrPeriod) : config.atr_period,
    adx_period: params.adxPeriod ? Number(params.adxPeriod) : config.adx_period
  };
}

function applyVolumeParams(config: AnalyzerConfig, settings?: UserAISettings) {
  const params = settings?.indicators?.volume?.params;
  if (!params) return config;
  return {
    ...config,
    volume_lookback: params.lookback ? Number(params.lookback) : config.volume_lookback,
    volume_spike_threshold: params.spikeMultiplier
      ? Number(params.spikeMultiplier)
      : config.volume_spike_threshold
  };
}

/**
 * Ultra Signal Analyzer Engine
 */
export class UltraSignalAnalyzer {
  private config: AnalyzerConfig;

  constructor(config: Partial<AnalyzerConfig> = {}) {
    this.config = {
      ...DEFAULT_ANALYZER_CONFIG,
      ...config
    };
  }

  /**
   * Analyze market using all analyzers
   * 
   * This is the main entry point for Phase X.1
   * 
   * Phase X.8: Enhanced with real-time analysis support
   */
  async analyzeMarket(input: AnalysisInput): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Validate input
    this.validateInput(input);

    // Phase X.8: Detect if this is a real-time analysis (short timeframes)
    const isRealtime = this.isRealtimeTimeframe(input.timeframe);

    const userSettings: UserAISettings = input.settings
      ? structuredClone(input.settings)
      : cloneSmartDefaults();

    let runtimeConfig: AnalyzerConfig = {
      ...this.config,
      fusion_weights: convertFusionWeights(userSettings.fusionWeights) || this.config.fusion_weights
    };

    runtimeConfig = applyVolumeParams(applyTechnicalParams(runtimeConfig, userSettings), userSettings);

    // Prepare volume data
    const volumeData: VolumeData = {
      candles: input.candles,
      takerBuyVolume: input.volumeData?.takerBuyVolume,
      takerSellVolume: input.volumeData?.takerSellVolume,
      quoteVolume: input.volumeData?.quoteVolume
    };

    // Prepare sentiment data
    const sentimentData: SentimentData = input.sentimentData || {};

    // Run all analyzers in parallel for better performance
    const [
      technical,
      volume,
      patterns,
      elliott,
      sentiment
    ] = await Promise.all([
      userSettings.indicators.technical?.enabled !== false
        ? Promise.resolve(analyzeTechnical(input.candles, runtimeConfig))
        : Promise.resolve(neutralTechnicalResult(input.candles)),
      userSettings.indicators.volume?.enabled !== false
        ? Promise.resolve(analyzeVolume(volumeData, runtimeConfig))
        : Promise.resolve(neutralVolumeResult()),
      userSettings.indicators.patterns?.enabled !== false
        ? Promise.resolve(analyzePatterns(input.candles, runtimeConfig))
        : Promise.resolve(neutralPatternResult()),
      userSettings.indicators.elliott?.enabled !== false
        ? Promise.resolve(analyzeElliottWaves(input.candles, runtimeConfig))
        : Promise.resolve(neutralWaveResult()),
      userSettings.indicators.sentiment?.enabled !== false
        ? analyzeSentiment(input.symbol, sentimentData, input.supabaseClient)
        : Promise.resolve(neutralSentimentResult())
    ]);

    // Fuse all results using AI fusion engine
    const aiFusion = fuseAnalysis(
      technical,
      volume,
      patterns,
      elliott,
      sentiment,
      runtimeConfig
    );

    // Calculate analysis duration
    const analysisDuration = Date.now() - startTime;

    // Phase X.8: Get real-time analysis data
    const realtimeVolumePressure = this.analyzeRealtimeVolumePressure(input.candles, isRealtime);
    const currentCandle = this.getCurrentCandle(input.candles, isRealtime);

    // Build final result
    const result: AnalysisResult = {
      symbol: input.symbol,
      timeframe: input.timeframe,
      timestamp: Date.now(),
      
      // Core metrics
      trend: technical.trend,
      momentum: technical.momentum,
      volatility: technical.volatility,
      risk: aiFusion.risk_level,
      bias: aiFusion.bias,
      
      // Pressure indicators
      buy_pressure: volume.buy_pressure,
      sell_pressure: volume.sell_pressure,
      
      // Individual scores
      technical_score: technical.technical_score,
      volume_score: volume.volume_score,
      pattern_score: patterns.pattern_score,
      wave_score: elliott.wave_score,
      sentiment_score: sentiment.sentiment_score,
      
      // Combined AI score
      combined_score: aiFusion.combined_score,
      
      // Pattern and wave info
      pattern: patterns.pattern,
      wave: elliott.wave,
      
      // Detailed results from each analyzer
      technical,
      volume,
      patterns,
      elliott,
      sentiment,
      ai_fusion: aiFusion,
      
      // Additional metadata
      metadata: {
        analysis_duration_ms: analysisDuration,
        candles_analyzed: input.candles.length,
        indicators_calculated: [
          'RSI',
          'MACD',
          'EMA',
          'ADX',
          'ATR',
          'Stochastic',
          'Bollinger Bands',
          'VWAP'
        ],
        settings_mode: input.settings ? 'custom' : 'default',
        settings_timeframe: input.timeframe,
        // Phase X.8: Real-time analysis metadata
        is_realtime: isRealtime,
        realtime_delta_volume: isRealtime ? realtimeVolumePressure.deltaVolume : undefined,
        realtime_pressure_change: isRealtime ? realtimeVolumePressure.pressureChange : undefined,
        current_candle_age_ms: isRealtime && currentCandle 
          ? Date.now() - currentCandle.openTime 
          : undefined
      }
    };

    return result;
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: AnalysisInput): void {
    if (!input.symbol || input.symbol.trim() === '') {
      throw new Error('Symbol is required');
    }

    if (!input.timeframe) {
      throw new Error('Timeframe is required');
    }

    if (!input.candles || input.candles.length === 0) {
      throw new Error('Candles are required');
    }

    const minCandles = this.config.min_candles || 50;
    if (input.candles.length < minCandles) {
      throw new Error(
        `Insufficient candles: ${input.candles.length} (minimum: ${minCandles})`
      );
    }

    // Validate candle data
    for (let i = 0; i < input.candles.length; i++) {
      const candle = input.candles[i];
      if (!candle || 
          typeof candle.open !== 'number' ||
          typeof candle.high !== 'number' ||
          typeof candle.low !== 'number' ||
          typeof candle.close !== 'number') {
        throw new Error(`Invalid candle data at index ${i}`);
      }

      // Validate OHLC logic
      if (candle.high < candle.low ||
          candle.high < candle.open ||
          candle.high < candle.close ||
          candle.low > candle.open ||
          candle.low > candle.close) {
        throw new Error(`Invalid OHLC values at index ${i}`);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyzerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyzerConfig {
    return { ...this.config };
  }

  /**
   * Phase X.8: Check if timeframe is real-time (short timeframes)
   */
  private isRealtimeTimeframe(timeframe: string): boolean {
    const realtimeTimeframes = ['1m', '3m', '5m', '15m'];
    return realtimeTimeframes.includes(timeframe);
  }

  /**
   * Phase X.8: Get current candle (before close) for real-time analysis
   */
  private getCurrentCandle(candles: Candle[], isRealtime: boolean): Candle | null {
    if (!isRealtime || candles.length === 0) {
      return null;
    }

    const lastCandle = candles[candles.length - 1];
    const now = Date.now();
    const candleAge = now - lastCandle.openTime;

    // If candle is less than 80% complete, consider it current
    const timeframeMs = this.getTimeframeMs(lastCandle);
    if (candleAge < timeframeMs * 0.8) {
      return lastCandle;
    }

    return null;
  }

  /**
   * Phase X.8: Get timeframe duration in milliseconds
   */
  private getTimeframeMs(candle: Candle): number {
    if (candle.closeTime && candle.openTime) {
      return candle.closeTime - candle.openTime + 1;
    }
    return 60000; // Default 1 minute
  }

  /**
   * Phase X.8: Calculate weighted score for real-time changes
   */
  private calculateRealtimeWeightedScore(
    currentScore: number,
    previousScore: number,
    timeframe: string
  ): number {
    const isRealtime = this.isRealtimeTimeframe(timeframe);
    if (!isRealtime) {
      return currentScore;
    }

    // Weight recent changes more heavily for short timeframes
    const change = currentScore - previousScore;
    const timeframeWeights: Record<string, number> = {
      '1m': 1.5,  // Very high weight for 1m changes
      '3m': 1.3,
      '5m': 1.2,
      '15m': 1.1
    };

    const weight = timeframeWeights[timeframe] || 1.0;
    const weightedChange = change * weight;
    
    return Math.max(0, Math.min(100, currentScore + weightedChange * 0.3));
  }

  /**
   * Phase X.8: Analyze real-time volume pressure (delta volume)
   */
  private analyzeRealtimeVolumePressure(
    candles: Candle[],
    isRealtime: boolean
  ): { deltaVolume: number; pressureChange: number } {
    if (!isRealtime || candles.length < 2) {
      return { deltaVolume: 0, pressureChange: 0 };
    }

    // Get last 5 candles for real-time analysis
    const recentCandles = candles.slice(-5);
    const previousCandles = candles.slice(-10, -5);

    const recentDelta = recentCandles.reduce((sum, c) => {
      const bodySize = Math.abs(c.close - c.open);
      const isBullish = c.close > c.open;
      return sum + (isBullish ? bodySize : -bodySize) * (c.volume || 0);
    }, 0);

    const previousDelta = previousCandles.reduce((sum, c) => {
      const bodySize = Math.abs(c.close - c.open);
      const isBullish = c.close > c.open;
      return sum + (isBullish ? bodySize : -bodySize) * (c.volume || 0);
    }, 0);

    const deltaVolume = recentDelta;
    const pressureChange = previousDelta !== 0 
      ? ((recentDelta - previousDelta) / Math.abs(previousDelta)) * 100 
      : 0;

    return { deltaVolume, pressureChange };
  }
}

/**
 * Convenience function to analyze market
 * 
 * Creates a new analyzer instance and runs analysis
 */
export async function analyzeMarket(
  input: AnalysisInput,
  config?: Partial<AnalyzerConfig>
): Promise<AnalysisResult> {
  const analyzer = new UltraSignalAnalyzer(config);
  return analyzer.analyzeMarket(input);
}

/**
 * Export default analyzer instance
 */
export const defaultAnalyzer = new UltraSignalAnalyzer();

