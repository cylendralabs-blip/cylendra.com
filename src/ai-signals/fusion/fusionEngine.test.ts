import { describe, it, expect } from 'vitest';
import { generateUltraSignal, UltraSignalEngine } from './fusionEngine';
import type {
  AnalysisResult,
  TechnicalAnalysisResult,
  VolumeAnalysisResult,
  PatternAnalysisResult,
  ElliottWaveAnalysisResult,
  SentimentAnalysisResult
} from '../types';
import type { RawSignalSource } from './types';

const createTechnical = (): TechnicalAnalysisResult => ({
  trend: 'UP',
  momentum: 70,
  volatility: 40,
  technical_score: 75,
  rsi: 65,
  macd: {
    line: 1,
    signal: 0.8,
    histogram: 0.2,
    trend: 'BULLISH'
  },
  ema20: 50000,
  ema50: 49500,
  ema200: 48000,
  adx: {
    value: 30,
    trend_strength: 'STRONG'
  },
  atr: 400,
  stochastic: {
    k: 60,
    d: 55,
    signal: 'NEUTRAL'
  },
  bollingerBands: {
    upper: 50500,
    middle: 49800,
    lower: 49100,
    position: 'BETWEEN',
    squeeze: false
  },
  vwap: 50100
});

const createVolume = (): VolumeAnalysisResult => ({
  volume_score: 70,
  buy_pressure: 0.65,
  sell_pressure: 0.35,
  liquidity_bias: 'BUY',
  volume_trend: 'UP',
  volume_spike: false,
  volume_spike_magnitude: 1,
  liquidity_zones: { support: [49000], resistance: [51000] },
  delta_volume: 1200
});

const createPatterns = (): PatternAnalysisResult => ({
  pattern_score: 68,
  pattern: 'Bull Flag',
  pattern_type: 'BULLISH',
  pattern_confidence: 0.75,
  detected_patterns: []
});

const createElliott = (): ElliottWaveAnalysisResult => ({
  wave_score: 65,
  wave: 'Impulse Wave (Bullish)',
  wave_phase: 'IMPULSE',
  current_wave: 3,
  wave_structure: undefined,
  fibonacci_levels: undefined
});

const createSentiment = (): SentimentAnalysisResult => ({
  sentiment_score: 72,
  funding_rate: -0.004,
  overall_sentiment: 'POSITIVE',
  fear_greed_index: 65,
  social_sentiment: 70,
  funding_bias: 'BUY'
});

const createAnalysisResult = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
  symbol: 'BTCUSDT',
  timeframe: '5m',
  timestamp: Date.now(),
  trend: 'UP',
  momentum: 70,
  volatility: 45,
  risk: 'MEDIUM',
  bias: 'BUY',
  buy_pressure: 0.65,
  sell_pressure: 0.35,
  technical_score: 75,
  volume_score: 70,
  pattern_score: 68,
  wave_score: 65,
  sentiment_score: 72,
  combined_score: 78,
  pattern: 'Bull Flag',
  wave: 'Impulse Wave',
  technical: createTechnical(),
  volume: createVolume(),
  patterns: createPatterns(),
  elliott: createElliott(),
  sentiment: createSentiment(),
  ai_fusion: {
    combined_score: 78,
    bias: 'BUY',
    confidence: 0.8,
    risk_level: 'MEDIUM',
    reasoning: ['Mock reasoning'],
    weight_breakdown: {
      technical: 0.25,
      volume: 0.2,
      pattern: 0.15,
      wave: 0.15,
      sentiment: 0.1,
      buy_pressure: 0.1,
      sell_pressure: 0.05
    }
  },
  metadata: {
    analysis_duration_ms: 120,
    candles_analyzed: 120,
    indicators_calculated: []
  },
  ...overrides
});

const createRawSource = (overrides?: Partial<RawSignalSource>): RawSignalSource => ({
  source: 'TV_WEBHOOK',
  symbol: 'BTCUSDT',
  timeframe: '5m',
  side: 'BUY',
  confidence: 75,
  strength: 'STRONG',
  entry: 50200,
  stopLoss: 49700,
  takeProfit: 51000,
  generatedAt: new Date().toISOString(),
  meta: {},
  ...overrides
});

describe('UltraSignalEngine', () => {
  it('should generate BUY ultra signal when sources align', async () => {
    const analysis = createAnalysisResult();
    const tvSignal = createRawSource();

    const signal = await generateUltraSignal({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      analysisResult: analysis,
      tradingViewSignals: [tvSignal],
      marketPrice: 50300
    });

    expect(signal.side).toBe('BUY');
    expect(signal.finalConfidence).toBeGreaterThan(60);
    expect(signal.sourcesUsed.length).toBeGreaterThanOrEqual(2);
    expect(signal.entryPrice).toBeDefined();
    expect(signal.stopLoss).toBeDefined();
    expect(signal.takeProfit).toBeDefined();
  });

  it('should return WAIT when signals conflict heavily', async () => {
    const analysis = createAnalysisResult({ bias: 'BUY' });
    const tvSell = createRawSource({
      side: 'SELL',
      confidence: 80
    });

    const signal = await generateUltraSignal({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      analysisResult: analysis,
      tradingViewSignals: [tvSell]
    });

    expect(signal.side).toBe('WAIT');
  });

  it('should fallback to TradingView when AI analysis missing', async () => {
    const tvSignal = createRawSource({
      confidence: 82,
      strength: 'STRONG'
    });

    const signal = await generateUltraSignal({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      tradingViewSignals: [tvSignal]
    });

    expect(signal.side).toBe('BUY');
    expect(signal.finalConfidence).toBeGreaterThan(55);
  });

  it('should allow custom configuration via class', async () => {
    const engine = new UltraSignalEngine({
      minConfidenceForAction: 65
    });

    const signal = await engine.generate({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      analysisResult: createAnalysisResult()
    });

    expect(signal).toBeDefined();
    expect(signal.symbol).toBe('BTCUSDT');
  });
});

