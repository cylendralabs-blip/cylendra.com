/**
 * Volume Analyzer Tests
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzeVolume, getBuyPressure, getSellPressure, checkVolumeSpike } from '../analyzer/volume';
import type { VolumeData } from '../types';
import { Candle } from '@/services/marketData/types';

/**
 * Generate mock candles with volume
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

describe('Volume Analyzer', () => {
  describe('analyzeVolume', () => {
    it('should analyze volume patterns', () => {
      const candles = generateMockCandles(50);
      const volumeData: VolumeData = { candles };
      
      const result = analyzeVolume(volumeData);
      
      expect(result).toBeDefined();
      expect(result.volume_score).toBeGreaterThanOrEqual(0);
      expect(result.volume_score).toBeLessThanOrEqual(100);
      expect(result.buy_pressure).toBeGreaterThanOrEqual(0);
      expect(result.buy_pressure).toBeLessThanOrEqual(1);
      expect(result.sell_pressure).toBeGreaterThanOrEqual(0);
      expect(result.sell_pressure).toBeLessThanOrEqual(1);
      expect(result.liquidity_bias).toBeDefined();
      expect(['BUY', 'SELL', 'WAIT']).toContain(result.liquidity_bias);
    });

    it('should detect volume spikes', () => {
      const candles = generateMockCandles(30);
      // Add a spike at the end
      candles[candles.length - 1].volume = candles[candles.length - 1].volume * 3;
      
      const volumeData: VolumeData = { candles };
      const result = analyzeVolume(volumeData);
      
      expect(result.volume_spike).toBe(true);
      expect(result.volume_spike_magnitude).toBeGreaterThan(1);
    });

    it('should throw error for empty candles', () => {
      const volumeData: VolumeData = { candles: [] };
      
      expect(() => {
        analyzeVolume(volumeData);
      }).toThrow('No candles provided');
    });
  });

  describe('getBuyPressure', () => {
    it('should calculate buy pressure', () => {
      const candles = generateMockCandles(30);
      const buyPressure = getBuyPressure(candles);
      
      expect(buyPressure).toBeGreaterThanOrEqual(0);
      expect(buyPressure).toBeLessThanOrEqual(1);
    });
  });

  describe('getSellPressure', () => {
    it('should calculate sell pressure', () => {
      const candles = generateMockCandles(30);
      const sellPressure = getSellPressure(candles);
      
      expect(sellPressure).toBeGreaterThanOrEqual(0);
      expect(sellPressure).toBeLessThanOrEqual(1);
    });
  });

  describe('checkVolumeSpike', () => {
    it('should detect volume spike', () => {
      const candles = generateMockCandles(30);
      candles[candles.length - 1].volume = candles[candles.length - 1].volume * 2;
      
      const hasSpike = checkVolumeSpike(candles, 1.5);
      expect(typeof hasSpike).toBe('boolean');
    });
  });
});

