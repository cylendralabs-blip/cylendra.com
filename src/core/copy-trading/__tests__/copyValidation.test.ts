/**
 * Copy Trading Validation Tests
 * 
 * Phase X.17 - Testing
 */

import { describe, it, expect } from 'vitest';
import {
  validateFollowerConfig,
  validateStrategy,
  sanitizeAllocationValue,
  sanitizeLeverage,
  sanitizeRiskMultiplier,
} from '../copyValidation';

describe('Copy Trading Validation', () => {
  describe('validateFollowerConfig', () => {
    it('should validate correct configuration', () => {
      const result = validateFollowerConfig({
        allocationMode: 'PERCENT',
        allocationValue: 10,
        maxDailyLoss: 5,
        maxTotalLoss: 20,
        maxOpenTrades: 10,
        maxLeverage: 3,
        riskMultiplier: 1,
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid allocation percentage', () => {
      const result = validateFollowerConfig({
        allocationMode: 'PERCENT',
        allocationValue: 150, // Exceeds 100%
        maxDailyLoss: 5,
        maxTotalLoss: 20,
        maxOpenTrades: 10,
        maxLeverage: 3,
        riskMultiplier: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Allocation percentage'))).toBe(true);
    });

    it('should reject invalid leverage', () => {
      const result = validateFollowerConfig({
        allocationMode: 'PERCENT',
        allocationValue: 10,
        maxDailyLoss: 5,
        maxTotalLoss: 20,
        maxOpenTrades: 10,
        maxLeverage: 200, // Exceeds 125
        riskMultiplier: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('leverage'))).toBe(true);
    });
  });

  describe('sanitizeAllocationValue', () => {
    it('should sanitize percentage allocation', () => {
      expect(sanitizeAllocationValue(150, 'PERCENT')).toBe(100);
      expect(sanitizeAllocationValue(-10, 'PERCENT')).toBe(0.1);
      expect(sanitizeAllocationValue(50, 'PERCENT')).toBe(50);
    });

    it('should sanitize fixed allocation', () => {
      expect(sanitizeAllocationValue(-10, 'FIXED')).toBe(1);
      expect(sanitizeAllocationValue(50, 'FIXED')).toBe(50);
    });
  });

  describe('sanitizeLeverage', () => {
    it('should sanitize leverage values', () => {
      expect(sanitizeLeverage(200)).toBe(125);
      expect(sanitizeLeverage(-10)).toBe(1);
      expect(sanitizeLeverage(10)).toBe(10);
    });
  });

  describe('sanitizeRiskMultiplier', () => {
    it('should sanitize risk multiplier', () => {
      expect(sanitizeRiskMultiplier(10)).toBe(5);
      expect(sanitizeRiskMultiplier(-10)).toBe(0.1);
      expect(sanitizeRiskMultiplier(2)).toBe(2);
    });
  });
});

