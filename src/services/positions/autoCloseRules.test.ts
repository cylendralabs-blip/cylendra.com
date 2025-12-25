/**
 * Auto-Close Rules Tests
 * 
 * Unit tests for Auto-Close Rules
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkKillSwitch,
  checkDrawdownLimit,
  checkDailyLossLimit,
  checkLiquidationRisk,
  evaluateAutoCloseRules
} from './autoCloseRules';
import { Position } from '@/core/models/Position';

describe('Auto-Close Rules', () => {
  let mockPosition: Position;

  beforeEach(() => {
    mockPosition = {
      id: 'pos-123',
      userId: 'user-123',
      exchange: 'binance',
      marketType: 'spot',
      symbol: 'BTCUSDT',
      side: 'buy',
      status: 'open',
      entryOrders: [],
      dcaOrders: [],
      tpOrders: [],
      slOrders: [],
      avgEntryPrice: 50000,
      positionQty: 0.1,
      realizedPnlUsd: 0,
      unrealizedPnlUsd: 0,
      riskState: {
        stopLossPrice: 48000,
        takeProfitPrice: 52000
      },
      meta: {
        strategyId: 'main'
      },
      openedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  describe('checkKillSwitch', () => {
    it('should close position when kill switch is active', async () => {
      const result = await checkKillSwitch(mockPosition, true);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('KILL_SWITCH_ACTIVE');
      expect(result.position?.status).toBe('closing');
      expect(result.priority).toBe(10);
    });

    it('should not close when kill switch is inactive', async () => {
      const result = await checkKillSwitch(mockPosition, false);
      
      expect(result.shouldClose).toBe(false);
      expect(result.priority).toBe(0);
    });
  });

  describe('checkDrawdownLimit', () => {
    it('should close position when drawdown exceeds limit', async () => {
      const result = await checkDrawdownLimit(mockPosition, 25, 20);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('MAX_DRAWDOWN_HIT');
      expect(result.position?.status).toBe('closing');
      expect(result.priority).toBe(9);
    });

    it('should not close when drawdown below limit', async () => {
      const result = await checkDrawdownLimit(mockPosition, 10, 20);
      
      expect(result.shouldClose).toBe(false);
    });

    it('should warn when approaching limit', async () => {
      const result = await checkDrawdownLimit(mockPosition, 16, 20); // 80% of limit
      
      expect(result.shouldClose).toBe(false);
      expect(result.priority).toBe(5);
      expect(result.message).toContain('Approaching');
    });

    it('should not check if no limit set', async () => {
      const result = await checkDrawdownLimit(mockPosition, 25, 0);
      
      expect(result.shouldClose).toBe(false);
    });
  });

  describe('checkDailyLossLimit', () => {
    it('should close position when daily loss (USD) exceeds limit', async () => {
      const result = await checkDailyLossLimit(mockPosition, -110, 100, null, 1000);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('DAILY_LOSS_LIMIT_USD');
      expect(result.priority).toBe(8);
    });

    it('should close position when daily loss (%) exceeds limit', async () => {
      const result = await checkDailyLossLimit(mockPosition, -80, null, 5, 1000);
      
      // Daily loss % = 80/1000 * 100 = 8% > 5%
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('DAILY_LOSS_LIMIT_PCT');
    });

    it('should not close when loss below limit', async () => {
      const result = await checkDailyLossLimit(mockPosition, -50, 100, null, 1000);
      
      expect(result.shouldClose).toBe(false);
    });

    it('should not close when profit', async () => {
      const result = await checkDailyLossLimit(mockPosition, 50, 100, null, 1000);
      
      expect(result.shouldClose).toBe(false);
    });
  });

  describe('checkLiquidationRisk', () => {
    it('should close futures position when near liquidation', async () => {
      const futuresPosition: Position = {
        ...mockPosition,
        marketType: 'futures',
        leverage: 10
      };
      
      const liquidationPrice = 45000;
      const currentPrice = 45100; // Very close to liquidation
      
      const result = await checkLiquidationRisk(futuresPosition, liquidationPrice, currentPrice);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('LIQUIDATION_RISK');
      expect(result.priority).toBe(10);
    });

    it('should not check liquidation for spot', async () => {
      const result = await checkLiquidationRisk(mockPosition, 45000, 45100);
      
      expect(result.shouldClose).toBe(false);
    });

    it('should warn when approaching liquidation', async () => {
      const futuresPosition: Position = {
        ...mockPosition,
        marketType: 'futures',
        leverage: 10
      };
      
      const liquidationPrice = 45000;
      const currentPrice = 45400; // 4% away (warning threshold)
      
      const result = await checkLiquidationRisk(futuresPosition, liquidationPrice, currentPrice);
      
      expect(result.shouldClose).toBe(false);
      expect(result.priority).toBe(7);
      expect(result.message).toContain('Approaching');
    });

    it('should not close when far from liquidation', async () => {
      const futuresPosition: Position = {
        ...mockPosition,
        marketType: 'futures',
        leverage: 10
      };
      
      const liquidationPrice = 45000;
      const currentPrice = 49000; // Far from liquidation
      
      const result = await checkLiquidationRisk(futuresPosition, liquidationPrice, currentPrice);
      
      expect(result.shouldClose).toBe(false);
    });
  });

  describe('evaluateAutoCloseRules', () => {
    it('should prioritize kill switch over other rules', async () => {
      const context = {
        isKillSwitchActive: true,
        currentDrawdownPct: 30,
        maxDrawdownPct: 20,
        dailyPnL: -150,
        maxDailyLossUsd: 100,
        maxDailyLossPct: null,
        dailyCapital: 1000,
        liquidationPrice: null,
        currentPrice: 49000
      };
      
      const result = await evaluateAutoCloseRules(mockPosition, context);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('KILL_SWITCH_ACTIVE');
      expect(result.priority).toBe(10);
    });

    it('should check all rules and return highest priority', async () => {
      const context = {
        isKillSwitchActive: false,
        currentDrawdownPct: 25,
        maxDrawdownPct: 20,
        dailyPnL: -50,
        maxDailyLossUsd: 100,
        maxDailyLossPct: null,
        dailyCapital: 1000,
        liquidationPrice: null,
        currentPrice: 49000
      };
      
      const result = await evaluateAutoCloseRules(mockPosition, context);
      
      expect(result.shouldClose).toBe(true);
      expect(result.reason).toBe('MAX_DRAWDOWN_HIT');
    });

    it('should not close when all rules pass', async () => {
      const context = {
        isKillSwitchActive: false,
        currentDrawdownPct: 10,
        maxDrawdownPct: 20,
        dailyPnL: -20,
        maxDailyLossUsd: 100,
        maxDailyLossPct: null,
        dailyCapital: 1000,
        liquidationPrice: null,
        currentPrice: 51000
      };
      
      const result = await evaluateAutoCloseRules(mockPosition, context);
      
      expect(result.shouldClose).toBe(false);
    });
  });
});

