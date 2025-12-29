/**
 * Engine Tests
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { describe, it, expect } from 'vitest';
import { UltraSignalAnalyzer, analyzeMarket } from '../engine';
import type { AnalysisInput } from '../types';
import { Candle } from '@/services/marketData/types';

/**
 * Generate mock candles
 */
function generateMockCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let basePrice = 50000;
  
  for (let i = 0; i < count; i++) {
    const priceChange = (Math.random() - 0.5) * 200;
    const open = basePrice;
    const close = basePrice + priceChange;
    const high = Math.max(open, close) + Math.random() * 50;
    const low = Math.min(open, close) - Math.random() * 50;
    const volume = 1000 + Math.random() * 500;
    
    candles.push({
      openTime: Date.now() - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume,
      closeTime: Date.now() - (count - i) * 60000 + 59000
    });
    
    basePrice = close;
  }
  
  return candles;
}

describe('Ultra Signal Analyzer Engine', () => {
  describe('UltraSignalAnalyzer', () => {
    it('should create analyzer instance', () => {
      const analyzer = new UltraSignalAnalyzer();
      expect(analyzer).toBeDefined();
    });

    it('should analyze market', async () => {
      const analyzer = new UltraSignalAnalyzer();
      const input: AnalysisInput = {
        symbol: 'BTCUSDT',
        timeframe: '5m',
        candles: generateMockCandles(100)
      };
      
      const result = await analyzer.analyzeMarket(input);
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.timeframe).toBe('5m');
      expect(result.combined_score).toBeGreaterThanOrEqual(0);
      expect(result.combined_score).toBeLessThanOrEqual(100);
      expect(result.bias).toBeDefined();
      expect(['BUY', 'SELL', 'WAIT']).toContain(result.bias);
      expect(result.technical).toBeDefined();
      expect(result.volume).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.elliott).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.ai_fusion).toBeDefined();
    });

    it('should throw error for invalid input', async () => {
      const analyzer = new UltraSignalAnalyzer();
      const input: AnalysisInput = {
        symbol: '',
        timeframe: '5m',
        candles: generateMockCandles(100)
      };
      
      await expect(analyzer.analyzeMarket(input)).rejects.toThrow('Symbol is required');
    });

    it('should throw error for insufficient candles', async () => {
      const analyzer = new UltraSignalAnalyzer();
      const input: AnalysisInput = {
        symbol: 'BTCUSDT',
        timeframe: '5m',
        candles: generateMockCandles(20)
      };
      
      await expect(analyzer.analyzeMarket(input)).rejects.toThrow('Insufficient candles');
    });

    it('should update configuration', () => {
      const analyzer = new UltraSignalAnalyzer();
      analyzer.updateConfig({ min_candles: 30 });
      
      const config = analyzer.getConfig();
      expect(config.min_candles).toBe(30);
    });
  });

  describe('analyzeMarket convenience function', () => {
    it('should analyze market using convenience function', async () => {
      const input: AnalysisInput = {
        symbol: 'BTCUSDT',
        timeframe: '5m',
        candles: generateMockCandles(100)
      };
      
      const result = await analyzeMarket(input);
      
      expect(result).toBeDefined();
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.combined_score).toBeGreaterThanOrEqual(0);
      expect(result.combined_score).toBeLessThanOrEqual(100);
    });
  });
});

