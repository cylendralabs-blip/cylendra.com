/**
 * Copy Trading Math Tests
 * 
 * Phase X.17 - Testing
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFollowerPositionSize,
  calculateAllocation,
  calculateRiskAdjustedSize,
} from '../copyMath';

describe('Copy Trading Math', () => {
  describe('calculateAllocation', () => {
    it('should calculate percentage allocation correctly', () => {
      const equity = 1000;
      const allocationValue = 10; // 10%
      const allocation = calculateAllocation(equity, 'PERCENT', allocationValue);
      expect(allocation).toBe(100);
    });

    it('should calculate fixed allocation correctly', () => {
      const equity = 1000;
      const allocationValue = 50; // $50
      const allocation = calculateAllocation(equity, 'FIXED', allocationValue);
      expect(allocation).toBe(50);
    });

    it('should not exceed equity for percentage allocation', () => {
      const equity = 1000;
      const allocationValue = 150; // 150% (should cap at 100%)
      const allocation = calculateAllocation(equity, 'PERCENT', allocationValue);
      expect(allocation).toBeLessThanOrEqual(equity);
    });
  });

  describe('calculateFollowerPositionSize', () => {
    it('should calculate position size based on master size and allocation', () => {
      const followerConfig = {
        id: 'test-follower',
        followerUserId: 'test-user',
        strategyId: 'test-strategy',
        status: 'ACTIVE' as const,
        allocationMode: 'PERCENT' as const,
        allocationValue: 10,
        riskMultiplier: 1,
        maxLeverage: 1,
        maxOpenTrades: 10,
      };
      const masterPositionSize = 1000;
      const masterEntryPrice = 100;
      const followerTotalEquity = 1000;

      const result = calculateFollowerPositionSize(
        followerConfig,
        masterPositionSize,
        masterEntryPrice,
        followerTotalEquity
      );

      expect(result.positionSize).toBeGreaterThan(0);
      expect(result.positionSize).toBeLessThanOrEqual(followerTotalEquity);
    });

    it('should apply risk multiplier correctly', () => {
      const followerConfigWithMultiplier = {
        id: 'test-follower',
        followerUserId: 'test-user',
        strategyId: 'test-strategy',
        status: 'ACTIVE' as const,
        allocationMode: 'PERCENT' as const,
        allocationValue: 10,
        riskMultiplier: 2,
        maxLeverage: 1,
        maxOpenTrades: 10,
      };
      const followerConfigWithoutMultiplier = {
        id: 'test-follower',
        followerUserId: 'test-user',
        strategyId: 'test-strategy',
        status: 'ACTIVE' as const,
        allocationMode: 'PERCENT' as const,
        allocationValue: 10,
        riskMultiplier: 1,
        maxLeverage: 1,
        maxOpenTrades: 10,
      };
      const masterPositionSize = 1000;
      const masterEntryPrice = 100;
      const followerTotalEquity = 1000;

      const result = calculateFollowerPositionSize(
        followerConfigWithMultiplier,
        masterPositionSize,
        masterEntryPrice,
        followerTotalEquity
      );

      const resultWithoutMultiplier = calculateFollowerPositionSize(
        followerConfigWithoutMultiplier,
        masterPositionSize,
        masterEntryPrice,
        followerTotalEquity
      );

      expect(result.positionSize).toBeGreaterThan(resultWithoutMultiplier.positionSize);
    });
  });

  describe('calculateRiskAdjustedSize', () => {
    it('should reduce size for high risk', () => {
      const baseSize = 100;
      const riskLevel = 'HIGH';
      const adjusted = calculateRiskAdjustedSize(baseSize, riskLevel);
      expect(adjusted).toBeLessThan(baseSize);
    });

    it('should keep size for low risk', () => {
      const baseSize = 100;
      const riskLevel = 'LOW';
      const adjusted = calculateRiskAdjustedSize(baseSize, riskLevel);
      expect(adjusted).toBe(baseSize);
    });
  });
});

