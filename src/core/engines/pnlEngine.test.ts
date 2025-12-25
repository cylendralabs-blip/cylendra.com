/**
 * PnL Engine Tests
 * 
 * Unit tests for PnL calculation engine
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateUnrealizedPnl,
  calculateRealizedPnl,
  calculatePositionPnL,
  calculateRealizedPnlFromTrade
} from './pnlEngine';
import { Position } from '@/core/models/Position';
import { Trade } from '@/core/models/Trade';

describe('PnL Engine', () => {
  let mockPosition: Position;
  let mockTrade: Trade;

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

    mockTrade = {
      id: 'trade-123',
      symbol: 'BTCUSDT',
      side: 'buy',
      entry_price: 50000,
      current_price: 51000,
      quantity: 0.1,
      total_invested: 5000,
      status: 'ACTIVE',
      trade_type: 'spot',
      leverage: null,
      dca_level: null,
      max_dca_level: null,
      stop_loss_price: 48000,
      take_profit_price: 52000,
      realized_pnl: null,
      unrealized_pnl: null,
      platform: 'binance',
      opened_at: new Date().toISOString(),
      closed_at: null,
      created_at: new Date().toISOString(),
      user_id: 'user-123',
      fees: null,
      commission: null,
      platform_trade_id: null,
      last_sync_at: null,
      sync_status: null,
      notes: null
    };
  });

  describe('calculateUnrealizedPnl', () => {
    it('should calculate positive PnL for buy position when price rises', () => {
      const pnl = calculateUnrealizedPnl(mockPosition, 51000);
      expect(pnl).toBe(100); // (51000 - 50000) * 0.1
    });

    it('should calculate negative PnL for buy position when price drops', () => {
      const pnl = calculateUnrealizedPnl(mockPosition, 49000);
      expect(pnl).toBe(-100); // (49000 - 50000) * 0.1
    });

    it('should calculate PnL for sell position', () => {
      const sellPosition = { ...mockPosition, side: 'sell' as const };
      const pnl = calculateUnrealizedPnl(sellPosition, 49000);
      expect(pnl).toBe(100); // (50000 - 49000) * 0.1
    });

    it('should apply leverage for futures', () => {
      const futuresPosition = { ...mockPosition, marketType: 'futures' as const, leverage: 10 };
      const pnl = calculateUnrealizedPnl(futuresPosition, 51000);
      expect(pnl).toBe(1000); // (51000 - 50000) * 0.1 * 10
    });

    it('should return 0 when position quantity is 0', () => {
      const emptyPosition = { ...mockPosition, positionQty: 0 };
      const pnl = calculateUnrealizedPnl(emptyPosition, 51000);
      expect(pnl).toBe(0);
    });

    it('should return 0 when no entry price', () => {
      const noEntryPosition = { ...mockPosition, avgEntryPrice: 0 };
      const pnl = calculateUnrealizedPnl(noEntryPosition, 51000);
      expect(pnl).toBe(0);
    });
  });

  describe('calculateRealizedPnl', () => {
    it('should calculate realized PnL from fills', () => {
      const fills = [
        {
          entryPrice: 50000,
          exitPrice: 51000,
          quantity: 0.05,
          fees: 0.5
        },
        {
          entryPrice: 50000,
          exitPrice: 52000,
          quantity: 0.05,
          fees: 0.5
        }
      ];
      
      const pnl = calculateRealizedPnl(fills, 'buy');
      
      // PnL = (51000-50000)*0.05 + (52000-50000)*0.05 - 0.5 - 0.5 = 100 + 100 - 1 = 199
      expect(pnl).toBe(199);
    });

    it('should apply leverage for futures', () => {
      const fills = [
        {
          entryPrice: 50000,
          exitPrice: 51000,
          quantity: 0.05,
          fees: 0.5,
          leverage: 10
        }
      ];
      
      const pnl = calculateRealizedPnl(fills, 'buy');
      
      // PnL = (51000-50000)*0.05*10 - 0.5 = 500 - 0.5 = 499.5
      expect(pnl).toBe(499.5);
    });
  });

  describe('calculatePositionPnL', () => {
    it('should calculate total PnL correctly', () => {
      const positionWithRealized: Position = {
        ...mockPosition,
        realizedPnlUsd: 50
      };
      
      const result = calculatePositionPnL(positionWithRealized, 51000);
      
      expect(result.unrealizedPnl).toBe(100); // (51000 - 50000) * 0.1
      expect(result.realizedPnl).toBe(50);
      expect(result.totalPnl).toBe(150);
      expect(result.pnlPercentage).toBeGreaterThan(0);
    });

    it('should calculate PnL percentage correctly', () => {
      const result = calculatePositionPnL(mockPosition, 51000);
      
      // Entry cost = 50000 * 0.1 = 5000
      // PnL = 100
      // PnL % = 100 / 5000 * 100 = 2%
      expect(result.pnlPercentage).toBeCloseTo(2, 1);
    });
  });

  describe('calculateRealizedPnlFromTrade', () => {
    it('should calculate PnL from closed trade', () => {
      const pnl = calculateRealizedPnlFromTrade(mockTrade, 51000);
      
      // PnL = (51000 - 50000) * 0.1 - fees - commission
      // Since fees/commission are null, PnL = 100
      expect(pnl).toBe(100);
    });

    it('should subtract fees and commission', () => {
      const tradeWithFees = {
        ...mockTrade,
        fees: 5,
        commission: 2
      };
      
      const pnl = calculateRealizedPnlFromTrade(tradeWithFees, 51000);
      
      // PnL = 100 - 5 - 2 = 93
      expect(pnl).toBe(93);
    });

    it('should apply leverage for futures', () => {
      const futuresTrade = {
        ...mockTrade,
        trade_type: 'futures' as const,
        leverage: 10
      };
      
      const pnl = calculateRealizedPnlFromTrade(futuresTrade, 51000);
      
      // PnL = (51000 - 50000) * 0.1 * 10 = 1000
      expect(pnl).toBe(1000);
    });
  });
});

