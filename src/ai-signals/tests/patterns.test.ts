/**
 * Pattern Analyzer Tests
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzePatterns } from '../analyzer/patterns';
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

describe('Pattern Analyzer', () => {
  describe('analyzePatterns', () => {
    it('should detect patterns', () => {
      const candles = generateMockCandles(50);
      const result = analyzePatterns(candles);
      
      expect(result).toBeDefined();
      expect(result.pattern_score).toBeGreaterThanOrEqual(0);
      expect(result.pattern_score).toBeLessThanOrEqual(100);
      expect(result.pattern_confidence).toBeGreaterThanOrEqual(0);
      expect(result.pattern_confidence).toBeLessThanOrEqual(1);
      expect(result.detected_patterns).toBeInstanceOf(Array);
    });

    it('should throw error for insufficient candles', () => {
      const candles = generateMockCandles(10);
      
      expect(() => {
        analyzePatterns(candles);
      }).toThrow('Insufficient candles');
    });

    it('should return pattern type if pattern detected', () => {
      const candles = generateMockCandles(50);
      const result = analyzePatterns(candles);
      
      if (result.pattern) {
        expect(result.pattern_type).toBeDefined();
        expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(result.pattern_type);
      }
    });
  });
});

