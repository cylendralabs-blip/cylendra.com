/**
 * SL Manager Tests
 * 
 * Unit tests for Stop Loss Manager
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldTriggerStopLoss,
  executeStopLoss,
  updateTrailingStopLoss,
  updateBreakEvenStopLoss,
  cancelAllPendingOrders
} from './slManager';
import { Position } from '@/core/models/Position';
import { OrderRef } from '@/core/models/OrderRef';

describe('SL Manager', () => {
  let mockPosition: Position;
  let mockOrderRef: OrderRef;

  beforeEach(() => {
    mockOrderRef = {
      id: 'order-123',
      exchangeOrderId: '123456',
      exchange: 'binance',
      marketType: 'spot',
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      status: 'NEW',
      price: 50000,
      quantity: 0.1,
      filledQuantity: 0,
      remainingQuantity: 0.1,
      avgPrice: null,
      commission: 0,
      commissionAsset: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filledAt: null,
      cancelledAt: null
    };

    mockPosition = {
      id: 'pos-123',
      userId: 'user-123',
      exchange: 'binance',
      marketType: 'spot',
      symbol: 'BTCUSDT',
      side: 'buy',
      status: 'open',
      entryOrders: [mockOrderRef],
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

  describe('shouldTriggerStopLoss', () => {
    it('should return true when price hits SL for buy position', () => {
      expect(shouldTriggerStopLoss(mockPosition, 48000)).toBe(true);
      expect(shouldTriggerStopLoss(mockPosition, 47000)).toBe(true);
      expect(shouldTriggerStopLoss(mockPosition, 49000)).toBe(false);
    });

    it('should return true when price hits SL for sell position', () => {
      const sellPosition = { ...mockPosition, side: 'sell' as const, riskState: { ...mockPosition.riskState, stopLossPrice: 52000 } };
      expect(shouldTriggerStopLoss(sellPosition, 52000)).toBe(true);
      expect(shouldTriggerStopLoss(sellPosition, 53000)).toBe(true);
      expect(shouldTriggerStopLoss(sellPosition, 51000)).toBe(false);
    });

    it('should return false when SL not set', () => {
      const noSLPosition = { ...mockPosition, riskState: { ...mockPosition.riskState, stopLossPrice: 0 } };
      expect(shouldTriggerStopLoss(noSLPosition, 47000)).toBe(false);
    });
  });

  describe('executeStopLoss', () => {
    it('should close position when SL triggered', async () => {
      const result = await executeStopLoss(mockPosition, 48000);
      
      expect(result.executed).toBe(true);
      expect(result.position?.status).toBe('closed');
      expect(result.position?.positionQty).toBe(0);
      expect(result.position?.realizedPnlUsd).toBeLessThan(0); // Should be loss
      expect(result.position?.closedAt).toBeTruthy();
    });

    it('should cancel all pending orders on SL', async () => {
      const positionWithOrders = {
        ...mockPosition,
        tpOrders: [{ ...mockOrderRef, id: 'tp-1', status: 'NEW' as const }],
        dcaOrders: [{ ...mockOrderRef, id: 'dca-1', status: 'NEW' as const }]
      };
      
      const result = await executeStopLoss(positionWithOrders, 48000);
      
      expect(result.executed).toBe(true);
      expect(result.position?.tpOrders[0].status).toBe('CANCELED');
      expect(result.position?.dcaOrders[0].status).toBe('CANCELED');
    });

    it('should not execute if SL not triggered', async () => {
      const result = await executeStopLoss(mockPosition, 49000);
      
      expect(result.executed).toBe(false);
      expect(result.message).toContain('not triggered');
    });
  });

  describe('updateTrailingStopLoss', () => {
    it('should update trailing SL for buy position', () => {
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
      
      const result = updateTrailingStopLoss(positionWithTrailing, 51500, 51500);
      
      expect(result.riskState.trailing?.currentStopPrice).toBeGreaterThan(50500);
      expect(result.riskState.stopLossPrice).toBeGreaterThan(50500);
    });

    it('should not update if activation price not reached', () => {
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
      
      const result = updateTrailingStopLoss(positionWithTrailing, 50800, 50800);
      
      expect(result.riskState.trailing?.currentStopPrice).toBe(50500);
    });
  });

  describe('updateBreakEvenStopLoss', () => {
    it('should move SL to entry price when break-even triggered', () => {
      const positionWithBreakEven: Position = {
        ...mockPosition,
        riskState: {
          ...mockPosition.riskState,
          breakEven: {
            enabled: true,
            triggerPrice: 51000,
            activated: false
          }
        }
      };
      
      const result = updateBreakEvenStopLoss(positionWithBreakEven, 51000);
      
      expect(result.riskState.breakEven?.activated).toBe(true);
      expect(result.riskState.stopLossPrice).toBe(50000); // Entry price
    });

    it('should not activate if trigger price not reached', () => {
      const positionWithBreakEven: Position = {
        ...mockPosition,
        riskState: {
          ...mockPosition.riskState,
          breakEven: {
            enabled: true,
            triggerPrice: 51000,
            activated: false
          }
        }
      };
      
      const result = updateBreakEvenStopLoss(positionWithBreakEven, 50900);
      
      expect(result.riskState.breakEven?.activated).toBe(false);
    });

    it('should not update if already activated', () => {
      const positionWithBreakEven: Position = {
        ...mockPosition,
        riskState: {
          ...mockPosition.riskState,
          breakEven: {
            enabled: true,
            triggerPrice: 51000,
            activated: true
          },
          stopLossPrice: 50000
        }
      };
      
      const result = updateBreakEvenStopLoss(positionWithBreakEven, 52000);
      
      expect(result.riskState.stopLossPrice).toBe(50000);
    });
  });

  describe('cancelAllPendingOrders', () => {
    it('should cancel all pending orders', () => {
      const positionWithOrders: Position = {
        ...mockPosition,
        entryOrders: [{ ...mockOrderRef, status: 'NEW' as const }],
        tpOrders: [{ ...mockOrderRef, id: 'tp-1', status: 'NEW' as const }],
        dcaOrders: [{ ...mockOrderRef, id: 'dca-1', status: 'NEW' as const }],
        slOrders: [{ ...mockOrderRef, id: 'sl-1', status: 'NEW' as const }]
      };
      
      const result = cancelAllPendingOrders(positionWithOrders);
      
      expect(result.entryOrders[0].status).toBe('CANCELED');
      expect(result.tpOrders[0].status).toBe('CANCELED');
      expect(result.dcaOrders[0].status).toBe('CANCELED');
      expect(result.slOrders[0].status).toBe('CANCELED');
    });
  });
});

