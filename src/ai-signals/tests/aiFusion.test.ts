/**
 * AI Fusion Engine Tests
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { describe, it, expect } from 'vitest';
import { fuseAnalysis } from '../analyzer/ai';
import type {
  TechnicalAnalysisResult,
  VolumeAnalysisResult,
  PatternAnalysisResult,
  ElliottWaveAnalysisResult,
  SentimentAnalysisResult
} from '../types';

/**
 * Create mock analysis results
 */
function createMockResults(): {
  technical: TechnicalAnalysisResult;
  volume: VolumeAnalysisResult;
  patterns: PatternAnalysisResult;
  elliott: ElliottWaveAnalysisResult;
  sentiment: SentimentAnalysisResult;
} {
  return {
    technical: {
      trend: 'UP',
      momentum: 70,
      volatility: 50,
      technical_score: 75,
      rsi: 65,
      macd: {
        line: 100,
        signal: 90,
        histogram: 10,
        trend: 'BULLISH'
      },
      ema20: 50000,
      ema50: 49500,
      ema200: 49000,
      adx: {
        value: 30,
        trend_strength: 'STRONG'
      },
      atr: 500,
      stochastic: {
        k: 60,
        d: 55,
        signal: 'NEUTRAL'
      },
      bollingerBands: {
        upper: 51000,
        middle: 50000,
        lower: 49000,
        position: 'BETWEEN',
        squeeze: false
      },
      vwap: 50000
    },
    volume: {
      volume_score: 70,
      buy_pressure: 0.65,
      sell_pressure: 0.35,
      liquidity_bias: 'BUY',
      volume_trend: 'UP',
      volume_spike: false,
      volume_spike_magnitude: 1.0,
      liquidity_zones: {
        support: [49000, 49500],
        resistance: [50500, 51000]
      },
      delta_volume: 1000
    },
    patterns: {
      pattern_score: 65,
      pattern: 'Bull Flag',
      pattern_type: 'BULLISH',
      pattern_confidence: 0.75,
      detected_patterns: []
    },
    elliott: {
      wave_score: 60,
      wave: 'Impulse Wave (Bullish)',
      wave_phase: 'IMPULSE',
      current_wave: 3,
      wave_structure: undefined,
      fibonacci_levels: undefined
    },
    sentiment: {
      sentiment_score: 70,
      funding_rate: -0.005,
      overall_sentiment: 'POSITIVE',
      funding_bias: 'BUY'
    }
  };
}

describe('AI Fusion Engine', () => {
  describe('fuseAnalysis', () => {
    it('should fuse all analysis results', () => {
      const { technical, volume, patterns, elliott, sentiment } = createMockResults();
      
      const result = fuseAnalysis(
        technical,
        volume,
        patterns,
        elliott,
        sentiment
      );
      
      expect(result).toBeDefined();
      expect(result.combined_score).toBeGreaterThanOrEqual(0);
      expect(result.combined_score).toBeLessThanOrEqual(100);
      expect(result.bias).toBeDefined();
      expect(['BUY', 'SELL', 'WAIT']).toContain(result.bias);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.risk_level).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).toContain(result.risk_level);
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should produce BUY bias for bullish signals', () => {
      const { technical, volume, patterns, elliott, sentiment } = createMockResults();
      
      // Make all signals bullish
      const bullishTechnical = { ...technical, technical_score: 80 };
      const bullishVolume = { ...volume, volume_score: 75, buy_pressure: 0.7 };
      const bullishPatterns = { ...patterns, pattern_score: 70, pattern_type: 'BULLISH' as const };
      const bullishElliott = { ...elliott, wave_score: 70 };
      const bullishSentiment = { ...sentiment, sentiment_score: 75 };
      
      const result = fuseAnalysis(
        bullishTechnical,
        bullishVolume,
        bullishPatterns,
        bullishElliott,
        bullishSentiment
      );
      
      expect(result.bias).toBe('BUY');
      expect(result.combined_score).toBeGreaterThan(60);
    });

    it('should produce SELL bias for bearish signals', () => {
      const { technical, volume, patterns, elliott, sentiment } = createMockResults();
      
      // Make all signals bearish
      const bearishTechnical = { ...technical, technical_score: 20, trend: 'DOWN' as const };
      const bearishVolume = { ...volume, volume_score: 25, sell_pressure: 0.7 };
      const bearishPatterns = { ...patterns, pattern_score: 30, pattern_type: 'BEARISH' as const };
      const bearishElliott = { ...elliott, wave_score: 30 };
      const bearishSentiment = { ...sentiment, sentiment_score: 25 };
      
      const result = fuseAnalysis(
        bearishTechnical,
        bearishVolume,
        bearishPatterns,
        bearishElliott,
        bearishSentiment
      );
      
      expect(result.bias).toBe('SELL');
      expect(result.combined_score).toBeLessThan(40);
    });

    it('should produce WAIT bias for mixed signals', () => {
      const { technical, volume, patterns, elliott, sentiment } = createMockResults();
      
      // Mix signals
      const mixedTechnical = { ...technical, technical_score: 50 };
      const mixedVolume = { ...volume, volume_score: 50, buy_pressure: 0.5 };
      const mixedPatterns = { ...patterns, pattern_score: 50 };
      const mixedElliott = { ...elliott, wave_score: 50 };
      const mixedSentiment = { ...sentiment, sentiment_score: 50 };
      
      const result = fuseAnalysis(
        mixedTechnical,
        mixedVolume,
        mixedPatterns,
        mixedElliott,
        mixedSentiment
      );
      
      expect(result.bias).toBe('WAIT');
      expect(result.combined_score).toBeGreaterThanOrEqual(40);
      expect(result.combined_score).toBeLessThanOrEqual(60);
    });

    it('should include weight breakdown', () => {
      const { technical, volume, patterns, elliott, sentiment } = createMockResults();
      
      const result = fuseAnalysis(
        technical,
        volume,
        patterns,
        elliott,
        sentiment
      );
      
      expect(result.weight_breakdown).toBeDefined();
      expect(result.weight_breakdown.technical).toBeGreaterThan(0);
      expect(result.weight_breakdown.volume).toBeGreaterThan(0);
      expect(result.weight_breakdown.pattern).toBeGreaterThan(0);
      expect(result.weight_breakdown.wave).toBeGreaterThan(0);
      expect(result.weight_breakdown.sentiment).toBeGreaterThan(0);
    });
  });
});

