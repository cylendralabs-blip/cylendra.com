/**
 * Technical Analyzer Tests
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzeTechnical, getRSI, getMACD, getADX } from '../analyzer/technical';
import { Candle } from '@/services/marketData/types';

/**
 * Generate mock candles
 */
function generateMockCandles(count: number, trend: 'up' | 'down' | 'sideways' = 'sideways'): Candle[] {
  const candles: Candle[] = [];
  let basePrice = 50000;
  
  for (let i = 0; i < count; i++) {
    let priceChange = 0;
    
    if (trend === 'up') {
      priceChange = 100 + Math.random() * 200;
    } else if (trend === 'down') {
      priceChange = -100 - Math.random() * 200;
    } else {
      priceChange = (Math.random() - 0.5) * 200;
    }
    
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

describe('Technical Analyzer', () => {
  describe('analyzeTechnical', () => {
    it('should analyze technical indicators for uptrend', () => {
      const candles = generateMockCandles(100, 'up');
      const result = analyzeTechnical(candles);
      
      expect(result).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.momentum).toBeGreaterThanOrEqual(0);
      expect(result.momentum).toBeLessThanOrEqual(100);
      expect(result.volatility).toBeGreaterThanOrEqual(0);
      expect(result.technical_score).toBeGreaterThanOrEqual(0);
      expect(result.technical_score).toBeLessThanOrEqual(100);
      expect(result.rsi).toBeGreaterThanOrEqual(0);
      expect(result.rsi).toBeLessThanOrEqual(100);
      expect(result.macd).toBeDefined();
      expect(result.ema20).toBeGreaterThan(0);
      expect(result.ema50).toBeGreaterThan(0);
    });

    it('should analyze technical indicators for downtrend', () => {
      const candles = generateMockCandles(100, 'down');
      const result = analyzeTechnical(candles);
      
      expect(result).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.technical_score).toBeGreaterThanOrEqual(0);
      expect(result.technical_score).toBeLessThanOrEqual(100);
    });

    it('should throw error for insufficient candles', () => {
      const candles = generateMockCandles(20);
      
      expect(() => {
        analyzeTechnical(candles);
      }).toThrow('Insufficient candles');
    });
  });

  describe('getRSI', () => {
    it('should calculate RSI', () => {
      const candles = generateMockCandles(50);
      const rsi = getRSI(candles, 14);
      
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('getMACD', () => {
    it('should calculate MACD', () => {
      const candles = generateMockCandles(50);
      const macd = getMACD(candles);
      
      expect(macd).toBeDefined();
      expect(macd.trend).toBeDefined();
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(macd.trend);
    });
  });

  describe('getADX', () => {
    it('should calculate ADX', () => {
      const candles = generateMockCandles(50);
      const adx = getADX(candles, 14);
      
      expect(adx).toBeDefined();
      expect(adx.value).toBeGreaterThanOrEqual(0);
      expect(['STRONG', 'MODERATE', 'WEAK']).toContain(adx.trend_strength);
    });
  });
});

