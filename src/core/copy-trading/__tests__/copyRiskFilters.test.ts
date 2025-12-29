/**
 * Copy Trading Risk Filters Tests
 * 
 * Phase X.17 - Testing
 */

import { describe, it, expect } from 'vitest';
import { performComprehensiveRiskCheck } from '../copyRiskFilters';
import type { FollowerConfig, MasterExecutionContext } from '../types';

describe('Copy Trading Risk Filters', () => {
  const baseContext: MasterExecutionContext = {
    strategyId: 'test-strategy',
    masterUserId: 'test-master',
    masterTradeId: 'test-trade',
    masterSignalExecutionId: 'test-signal',
    symbol: 'BTCUSDT',
    side: 'LONG',
    marketType: 'FUTURES',
    positionSize: 1000,
    entryPrice: 50000,
    direction: 'OPEN',
    timestamp: new Date().toISOString(),
  };

  const baseFollower: FollowerConfig = {
    id: 'test-follower',
    followerUserId: 'test-user',
    strategyId: 'test-strategy',
    status: 'ACTIVE',
    allocationMode: 'PERCENT',
    allocationValue: 10,
    maxDailyLoss: 5,
    maxTotalLoss: 20,
    maxOpenTrades: 10,
    maxLeverage: 3,
    riskMultiplier: 1,
  };

  describe('performComprehensiveRiskCheck', () => {
    it('should allow trade when all limits are within bounds', async () => {
      const result = performComprehensiveRiskCheck(
        baseFollower,
        baseContext.masterUserId,
        baseFollower.followerUserId,
        1000, // followerEquity
        1000, // followerInitialEquity
        2, // currentOpenTrades
        10, // dailyLossAmount (1% of 1000)
        0, // existingPositionsValue
        100, // newPositionSize
        baseContext.leverage, // requestedLeverage
        baseContext.timestamp // tradeTimestamp
      );

      expect(result.allowed).toBe(true);
    });

    it('should reject trade when daily loss limit exceeded', async () => {
      const follower = { ...baseFollower, maxDailyLoss: 5 };
      const result = performComprehensiveRiskCheck(
        follower,
        baseContext.masterUserId,
        follower.followerUserId,
        1000, // followerEquity
        1000, // followerInitialEquity
        2, // currentOpenTrades
        60, // dailyLossAmount (6% of 1000, exceeds 5%)
        0, // existingPositionsValue
        100, // newPositionSize
        baseContext.leverage,
        baseContext.timestamp
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily loss limit');
    });

    it('should reject trade when total loss limit exceeded', async () => {
      const follower = { ...baseFollower, maxTotalLoss: 20 };
      const result = performComprehensiveRiskCheck(
        follower,
        baseContext.masterUserId,
        follower.followerUserId,
        800, // followerEquity (20% loss from 1000)
        1000, // followerInitialEquity
        2, // currentOpenTrades
        10, // dailyLossAmount
        0, // existingPositionsValue
        100, // newPositionSize
        baseContext.leverage,
        baseContext.timestamp
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Total loss limit');
    });

    it('should reject trade when max open trades reached', async () => {
      const follower = { ...baseFollower, maxOpenTrades: 5 };
      const result = performComprehensiveRiskCheck(
        follower,
        baseContext.masterUserId,
        follower.followerUserId,
        1000, // followerEquity
        1000, // followerInitialEquity
        5, // currentOpenTrades (at limit)
        10, // dailyLossAmount
        0, // existingPositionsValue
        100, // newPositionSize
        baseContext.leverage,
        baseContext.timestamp
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Max open trades');
    });

    it('should reject trade when leverage exceeds limit', async () => {
      const follower = { ...baseFollower, maxLeverage: 3 };
      const context = {
        ...baseContext,
        leverage: 5, // Exceeds max of 3
      };
      const result = performComprehensiveRiskCheck(
        follower,
        context.masterUserId,
        follower.followerUserId,
        1000, // followerEquity
        1000, // followerInitialEquity
        2, // currentOpenTrades
        10, // dailyLossAmount
        0, // existingPositionsValue
        100, // newPositionSize
        context.leverage, // requestedLeverage (5, exceeds max of 3)
        context.timestamp
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Leverage');
    });
  });
});

