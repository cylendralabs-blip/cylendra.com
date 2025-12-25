/**
 * Binance Order Sync Tests
 * 
 * Unit tests for Binance order sync functionality
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect } from 'vitest';
import {
  mapBinanceOrderStatus,
  normalizeBinanceOrder,
  syncBinanceOrder,
  hasOrderStatusChanged
} from './orderSync';
import { OrderRef } from '@/core/models/OrderRef';

describe('Binance Order Sync', () => {
  describe('mapBinanceOrderStatus', () => {
    it('should map NEW status correctly', () => {
      expect(mapBinanceOrderStatus('NEW')).toBe('NEW');
    });

    it('should map FILLED status correctly', () => {
      expect(mapBinanceOrderStatus('FILLED')).toBe('FILLED');
    });

    it('should map PARTIALLY_FILLED status correctly', () => {
      expect(mapBinanceOrderStatus('PARTIALLY_FILLED')).toBe('PARTIALLY_FILLED');
    });

    it('should map CANCELED status correctly', () => {
      expect(mapBinanceOrderStatus('CANCELED')).toBe('CANCELED');
    });

    it('should map PENDING_CANCEL to PENDING', () => {
      expect(mapBinanceOrderStatus('PENDING_CANCEL')).toBe('PENDING');
    });

    it('should map REJECTED status correctly', () => {
      expect(mapBinanceOrderStatus('REJECTED')).toBe('REJECTED');
    });

    it('should map EXPIRED status correctly', () => {
      expect(mapBinanceOrderStatus('EXPIRED')).toBe('EXPIRED');
    });
  });

  describe('normalizeBinanceOrder', () => {
    const mockBinanceOrder = {
      symbol: 'BTCUSDT',
      orderId: 123456,
      orderListId: -1,
      clientOrderId: 'test-order-123',
      price: '50000',
      origQty: '0.1',
      executedQty: '0.1',
      cummulativeQuoteQty: '5000',
      status: 'FILLED' as const,
      timeInForce: 'GTC',
      type: 'LIMIT',
      side: 'BUY' as const,
      stopPrice: '0',
      time: Date.now(),
      updateTime: Date.now(),
      isWorking: false
    };

    it('should normalize a filled order correctly', () => {
      const result = normalizeBinanceOrder(mockBinanceOrder);
      
      expect(result.exchangeOrderId).toBe('123456');
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.side).toBe('BUY');
      expect(result.status).toBe('FILLED');
      expect(result.filledQuantity).toBe(0.1);
      expect(result.remainingQuantity).toBe(0);
      expect(result.avgPrice).toBe(50000);
    });

    it('should normalize a partially filled order correctly', () => {
      const partialOrder = {
        ...mockBinanceOrder,
        executedQty: '0.05',
        status: 'PARTIALLY_FILLED' as const
      };
      
      const result = normalizeBinanceOrder(partialOrder);
      
      expect(result.status).toBe('PARTIALLY_FILLED');
      expect(result.filledQuantity).toBe(0.05);
      expect(result.remainingQuantity).toBe(0.05);
    });

    it('should calculate average price from fills', () => {
      const orderWithFills = {
        ...mockBinanceOrder,
        fills: [
          { price: '49000', qty: '0.05', commission: '0.00005', commissionAsset: 'BTC', tradeId: 1 },
          { price: '51000', qty: '0.05', commission: '0.00005', commissionAsset: 'BTC', tradeId: 2 }
        ]
      };
      
      const result = normalizeBinanceOrder(orderWithFills);
      
      // Average should be weighted average: (49000*0.05 + 51000*0.05) / 0.1 = 50000
      expect(result.avgPrice).toBe(50000);
    });

    it('should calculate commission from fills', () => {
      const orderWithFills = {
        ...mockBinanceOrder,
        fills: [
          { price: '50000', qty: '0.05', commission: '0.00005', commissionAsset: 'BTC', tradeId: 1 },
          { price: '50000', qty: '0.05', commission: '0.00005', commissionAsset: 'BTC', tradeId: 2 }
        ]
      };
      
      const result = normalizeBinanceOrder(orderWithFills);
      
      expect(result.commission).toBe(0.0001);
      expect(result.commissionAsset).toBe('BTC');
    });
  });

  describe('syncBinanceOrder', () => {
    const mockOrderRef: OrderRef = {
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

    it('should sync a filled order correctly', async () => {
      const binanceOrder = {
        symbol: 'BTCUSDT',
        orderId: 123456,
        orderListId: -1,
        clientOrderId: 'test-order-123',
        price: '50000',
        origQty: '0.1',
        executedQty: '0.1',
        cummulativeQuoteQty: '5000',
        status: 'FILLED' as const,
        timeInForce: 'GTC',
        type: 'LIMIT',
        side: 'BUY' as const,
        time: Date.now(),
        updateTime: Date.now(),
        isWorking: false
      };
      
      const result = await syncBinanceOrder(mockOrderRef, binanceOrder);
      
      expect(result.status).toBe('FILLED');
      expect(result.filledQuantity).toBe(0.1);
      expect(result.remainingQuantity).toBe(0);
      expect(result.avgPrice).toBe(50000);
      expect(result.filledAt).toBeTruthy();
    });

    it('should sync a partially filled order correctly', async () => {
      const binanceOrder = {
        ...mockOrderRef,
        orderId: 123456,
        executedQty: '0.05',
        status: 'PARTIALLY_FILLED' as const
      } as any;
      
      const result = await syncBinanceOrder(mockOrderRef, binanceOrder);
      
      expect(result.status).toBe('PARTIALLY_FILLED');
      expect(result.filledQuantity).toBe(0.05);
      expect(result.remainingQuantity).toBe(0.05);
    });
  });

  describe('hasOrderStatusChanged', () => {
    const oldOrder: OrderRef = {
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

    it('should detect status change', () => {
      const newOrder = { ...oldOrder, status: 'FILLED' as const };
      expect(hasOrderStatusChanged(oldOrder, newOrder)).toBe(true);
    });

    it('should detect filled quantity change', () => {
      const newOrder = { ...oldOrder, filledQuantity: 0.05 };
      expect(hasOrderStatusChanged(oldOrder, newOrder)).toBe(true);
    });

    it('should detect average price change', () => {
      const newOrder = { ...oldOrder, avgPrice: 51000 };
      expect(hasOrderStatusChanged(oldOrder, newOrder)).toBe(true);
    });

    it('should return false when nothing changed', () => {
      expect(hasOrderStatusChanged(oldOrder, oldOrder)).toBe(false);
    });
  });
});

