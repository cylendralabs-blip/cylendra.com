/**
 * TP Manager Tests
 * 
 * Unit tests for Take Profit Manager
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldExecuteTPLevel,
  executeTPLevel,
  updateTrailingTP,
  getPendingTPLevels,
  getFilledTPLevels
} from './tpManager';
import { Position } from '@/core/models/Position';
import { TPLevel } from './tpManager';

describe('TP Manager', () => {
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

  describe('shouldExecuteTPLevel', () => {
    it('should return true when price reaches TP for buy position', () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 50,
        status: 'pending'
      };
      
      expect(shouldExecuteTPLevel(tpLevel, 52000, 'buy')).toBe(true);
      expect(shouldExecuteTPLevel(tpLevel, 53000, 'buy')).toBe(true);
      expect(shouldExecuteTPLevel(tpLevel, 51000, 'buy')).toBe(false);
    });

    it('should return true when price reaches TP for sell position', () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 48000,
        percentage: 50,
        status: 'pending'
      };
      
      expect(shouldExecuteTPLevel(tpLevel, 48000, 'sell')).toBe(true);
      expect(shouldExecuteTPLevel(tpLevel, 47000, 'sell')).toBe(true);
      expect(shouldExecuteTPLevel(tpLevel, 49000, 'sell')).toBe(false);
    });

    it('should return false for already filled TP', () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 50,
        status: 'filled'
      };
      
      expect(shouldExecuteTPLevel(tpLevel, 53000, 'buy')).toBe(false);
    });

    it('should return false for cancelled TP', () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 50,
        status: 'cancelled'
      };
      
      expect(shouldExecuteTPLevel(tpLevel, 53000, 'buy')).toBe(false);
    });
  });

  describe('executeTPLevel', () => {
    it('should execute TP level and close partial position', async () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 50, // Close 50% of position
        status: 'pending'
      };
      
      const result = await executeTPLevel(mockPosition, tpLevel, 52000);
      
      expect(result.executed).toBe(true);
      expect(result.level).toBe(1);
      expect(result.closedQuantity).toBe(0.05); // 50% of 0.1
      expect(result.position?.positionQty).toBe(0.05); // Remaining 50%
      expect(result.position?.status).toBe('open'); // Still open
      expect(result.realizedPnl).toBeGreaterThan(0);
    });

    it('should close full position when TP closes 100%', async () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 100,
        status: 'pending'
      };
      
      const result = await executeTPLevel(mockPosition, tpLevel, 52000);
      
      expect(result.executed).toBe(true);
      expect(result.position?.positionQty).toBe(0);
      expect(result.position?.status).toBe('closed');
      expect(result.position?.closedAt).toBeTruthy();
    });

    it('should not execute if price not reached', async () => {
      const tpLevel: TPLevel = {
        level: 1,
        price: 52000,
        percentage: 50,
        status: 'pending'
      };
      
      const result = await executeTPLevel(mockPosition, tpLevel, 51000);
      
      expect(result.executed).toBe(false);
      expect(result.message).toContain('not reached');
    });
  });

  describe('updateTrailingTP', () => {
    it('should update trailing TP when price moves up', () => {
      const positionWithTrailing: Position = {
        ...mockPosition,
        riskState: {
          ...mockPosition.riskState,
          trailing: {
            enabled: true,
            activationPrice: 51000,
            distance: 2, // 2%
            currentStopPrice: 50500
          }
        }
      };
      
      const result = updateTrailingTP(positionWithTrailing, 51500, 51500);
      
      expect(result.riskState.trailing?.currentStopPrice).toBeGreaterThan(50500);
      expect(result.riskState.stopLossPrice).toBeGreaterThan(50500);
    });

    it('should not update trailing TP if activation price not reached', () => {
      const positionWithTrailing: Position = {
        ...mockPosition,
        riskState: {
          ...mockPosition.riskState,
          trailing: {
            enabled: true,
            activationPrice: 51000,
            distance: 2,
            currentStopPrice: 50500
          }
        }
      };
      
      const result = updateTrailingTP(positionWithTrailing, 50800, 50800);
      
      expect(result.riskState.trailing?.currentStopPrice).toBe(50500);
    });

    it('should not update if trailing disabled', () => {
      const result = updateTrailingTP(mockPosition, 53000, 53000);
      
      expect(result).toBe(mockPosition);
    });
  });

  describe('getPendingTPLevels', () => {
    it('should return only pending TP levels', () => {
      const tpLevels: TPLevel[] = [
        { level: 1, price: 51000, percentage: 25, status: 'pending' },
        { level: 2, price: 52000, percentage: 25, status: 'pending' },
        { level: 3, price: 53000, percentage: 25, status: 'filled' },
        { level: 4, price: 54000, percentage: 25, status: 'cancelled' }
      ];
      
      const pending = getPendingTPLevels(tpLevels);
      
      expect(pending).toHaveLength(2);
      expect(pending.map(l => l.level)).toEqual([1, 2]);
    });
  });

  describe('getFilledTPLevels', () => {
    it('should return only filled TP levels', () => {
      const tpLevels: TPLevel[] = [
        { level: 1, price: 51000, percentage: 25, status: 'pending' },
        { level: 2, price: 52000, percentage: 25, status: 'filled' },
        { level: 3, price: 53000, percentage: 25, status: 'filled' }
      ];
      
      const filled = getFilledTPLevels(tpLevels);
      
      expect(filled).toHaveLength(2);
      expect(filled.map(l => l.level)).toEqual([2, 3]);
    });
  });
});

