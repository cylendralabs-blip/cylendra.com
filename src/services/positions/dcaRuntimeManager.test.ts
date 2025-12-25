/**
 * DCA Runtime Manager Tests
 * 
 * Unit tests for DCA Runtime Manager
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldExecuteDCALevel,
  executeDCALevel,
  monitorDCALevels,
  getPendingDCALevels,
  getFilledDCALevels,
  DCALevel
} from './dcaRuntimeManager';
import { Position } from '@/core/models/Position';

describe('DCA Runtime Manager', () => {
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

  describe('shouldExecuteDCALevel', () => {
    it('should return true when price drops to DCA target for buy position', () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 49000,
        status: 'pending'
      };
      
      expect(shouldExecuteDCALevel(dcaLevel, 49000, 'buy')).toBe(true);
      expect(shouldExecuteDCALevel(dcaLevel, 48500, 'buy')).toBe(true);
      expect(shouldExecuteDCALevel(dcaLevel, 49500, 'buy')).toBe(false);
    });

    it('should return true when price rises to DCA target for sell position', () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 51000,
        status: 'pending'
      };
      
      expect(shouldExecuteDCALevel(dcaLevel, 51000, 'sell')).toBe(true);
      expect(shouldExecuteDCALevel(dcaLevel, 51500, 'sell')).toBe(true);
      expect(shouldExecuteDCALevel(dcaLevel, 50500, 'sell')).toBe(false);
    });

    it('should return false for already filled DCA', () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 49000,
        status: 'filled'
      };
      
      expect(shouldExecuteDCALevel(dcaLevel, 48500, 'buy')).toBe(false);
    });
  });

  describe('executeDCALevel', () => {
    it('should execute DCA and update average entry price', async () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 49000,
        status: 'pending'
      };
      
      const result = await executeDCALevel(mockPosition, dcaLevel, 49000);
      
      expect(result.executed).toBe(true);
      expect(result.level).toBe(1);
      expect(result.newPositionQty).toBeGreaterThan(mockPosition.positionQty);
      expect(result.newAvgEntryPrice).toBeLessThan(mockPosition.avgEntryPrice);
      expect(result.position?.dcaOrders.length).toBeGreaterThan(0);
    });

    it('should not execute if price not reached', async () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 49000,
        status: 'pending'
      };
      
      const result = await executeDCALevel(mockPosition, dcaLevel, 49500);
      
      expect(result.executed).toBe(false);
      expect(result.message).toContain('not reached');
    });

    it('should not execute if already filled', async () => {
      const dcaLevel: DCALevel = {
        level: 1,
        targetPrice: 49000,
        status: 'filled'
      };
      
      const result = await executeDCALevel(mockPosition, dcaLevel, 49000);
      
      expect(result.executed).toBe(false);
      expect(result.message).toContain('already executed');
    });
  });

  describe('monitorDCALevels', () => {
    it('should execute multiple DCA levels', async () => {
      const dcaLevels: DCALevel[] = [
        { level: 1, targetPrice: 49000, status: 'pending' },
        { level: 2, targetPrice: 48000, status: 'pending' }
      ];
      
      const results = await monitorDCALevels(mockPosition, 48000, dcaLevels);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.executed)).toBe(true);
    });

    it('should skip already filled levels', async () => {
      const dcaLevels: DCALevel[] = [
        { level: 1, targetPrice: 49000, status: 'filled' },
        { level: 2, targetPrice: 48000, status: 'pending' }
      ];
      
      const results = await monitorDCALevels(mockPosition, 48000, dcaLevels);
      
      // Should only execute level 2
      expect(results.length).toBe(1);
      expect(results[0].level).toBe(2);
    });
  });

  describe('getPendingDCALevels', () => {
    it('should return only pending levels', () => {
      const dcaLevels: DCALevel[] = [
        { level: 1, targetPrice: 49000, status: 'pending' },
        { level: 2, targetPrice: 48000, status: 'pending' },
        { level: 3, targetPrice: 47000, status: 'filled' }
      ];
      
      const pending = getPendingDCALevels(dcaLevels);
      
      expect(pending).toHaveLength(2);
      expect(pending.map(l => l.level)).toEqual([1, 2]);
    });
  });

  describe('getFilledDCALevels', () => {
    it('should return only filled levels', () => {
      const dcaLevels: DCALevel[] = [
        { level: 1, targetPrice: 49000, status: 'pending' },
        { level: 2, targetPrice: 48000, status: 'filled' },
        { level: 3, targetPrice: 47000, status: 'filled' }
      ];
      
      const filled = getFilledDCALevels(dcaLevels);
      
      expect(filled).toHaveLength(2);
      expect(filled.map(l => l.level)).toEqual([2, 3]);
    });
  });
});

