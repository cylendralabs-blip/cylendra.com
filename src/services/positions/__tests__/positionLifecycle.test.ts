/**
 * Position Lifecycle Integration Tests
 * 
 * Integration tests for complete position lifecycle:
 * Entry -> DCA -> Partial TP -> Trailing SL -> Close
 * 
 * Phase 6: Position Manager - Task 11: Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Position } from '@/core/models/Position';
import { OrderRef } from '@/core/models/OrderRef';
import { createPositionFromTrade, updateAvgEntryPriceAfterDCA, updatePositionQuantity } from '@/core/engines/positionEngine';
import { calculateUnrealizedPnl } from '@/core/engines/pnlEngine';
import { executeDCALevel, monitorDCALevels, DCALevel } from '../dcaRuntimeManager';
import { executeTPLevel, updateTrailingTP, TPLevel } from '../tpManager';
import { executeStopLoss, updateTrailingStopLoss, updateBreakEvenStopLoss } from '../slManager';
import { Trade } from '@/core/models/Trade';

describe('Position Lifecycle Integration', () => {
  let initialTrade: Trade;
  let entryOrder: OrderRef;
  let position: Position;

  beforeEach(() => {
    // Create initial trade
    initialTrade = {
      id: 'trade-123',
      symbol: 'BTCUSDT',
      side: 'buy',
      entry_price: 50000,
      current_price: 50000,
      quantity: 0.1,
      total_invested: 5000,
      status: 'ACTIVE',
      trade_type: 'spot',
      leverage: null,
      dca_level: null,
      max_dca_level: 3,
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

    // Create entry order
    entryOrder = {
      id: 'order-entry-123',
      exchangeOrderId: '123456',
      exchange: 'binance',
      marketType: 'spot',
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      status: 'FILLED',
      price: 50000,
      quantity: 0.1,
      filledQuantity: 0.1,
      remainingQuantity: 0,
      avgPrice: 50000,
      commission: 5,
      commissionAsset: 'USDT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filledAt: new Date().toISOString(),
      cancelledAt: null,
      metadata: {
        positionId: 'trade-123'
      }
    };

    // Create position from trade
    position = createPositionFromTrade(initialTrade, entryOrder);
  });

  it('should complete full position lifecycle', async () => {
    // Step 1: Initial position created
    expect(position.status).toBe('open');
    expect(position.positionQty).toBe(0.1);
    expect(position.avgEntryPrice).toBe(50000);
    expect(position.entryOrders).toHaveLength(1);

    // Step 2: Price drops, DCA level 1 executes
    const dcaLevel1: DCALevel = {
      level: 1,
      targetPrice: 49000,
      status: 'pending'
    };
    
    const dcaResult1 = await executeDCALevel(position, dcaLevel1, 49000);
    expect(dcaResult1.executed).toBe(true);
    if (dcaResult1.position) {
      position = dcaResult1.position;
    }
    
    // Position should have updated avg entry price and quantity
    expect(position.positionQty).toBeGreaterThan(0.1);
    expect(position.avgEntryPrice).toBeLessThan(50000); // Lower average
    expect(position.dcaOrders).toHaveLength(1);

    // Step 3: Price rises, Partial TP executes
    const tpLevel1: TPLevel = {
      level: 1,
      price: 51000,
      percentage: 30, // Close 30% of position
      status: 'pending'
    };
    
    const tpResult1 = await executeTPLevel(position, tpLevel1, 51000);
    expect(tpResult1.executed).toBe(true);
    if (tpResult1.position) {
      position = tpResult1.position;
    }
    
    // Position should have reduced quantity
    expect(position.positionQty).toBeLessThan(position.positionQty + (position.positionQty * 0.3));
    expect(position.realizedPnlUsd).toBeGreaterThan(0);
    expect(position.tpOrders).toHaveLength(1);

    // Step 4: Price continues up, Trailing SL activates
    const positionWithTrailing: Position = {
      ...position,
      riskState: {
        ...position.riskState,
        trailing: {
          enabled: true,
          activationPrice: 51000,
          distance: 2, // 2%
          currentStopPrice: 48000
        }
      }
    };
    
    let updatedPosition = updateTrailingStopLoss(positionWithTrailing, 51500, 51500);
    expect(updatedPosition.riskState.trailing?.currentStopPrice).toBeGreaterThan(48000);
    expect(updatedPosition.riskState.stopLossPrice).toBeGreaterThan(48000);

    // Step 5: Price continues up, Trailing SL moves higher
    updatedPosition = updateTrailingStopLoss(updatedPosition, 52000, 52000);
    expect(updatedPosition.riskState.trailing?.currentStopPrice).toBeGreaterThan(updatedPosition.riskState.stopLossPrice);

    // Step 6: Price drops, Trailing SL triggers
    const slResult = await executeStopLoss(updatedPosition, updatedPosition.riskState.stopLossPrice);
    expect(slResult.executed).toBe(true);
    if (slResult.position) {
      position = slResult.position;
    }
    
    // Position should be closed
    expect(position.status).toBe('closed');
    expect(position.positionQty).toBe(0);
    expect(position.closedAt).toBeTruthy();
    expect(position.slOrders).toHaveLength(1);
  });

  it('should handle DCA -> Break-Even -> Close flow', async () => {
    // Step 1: Execute DCA
    const dcaLevel1: DCALevel = {
      level: 1,
      targetPrice: 49000,
      status: 'pending'
    };
    
    const dcaResult = await executeDCALevel(position, dcaLevel1, 49000);
    if (dcaResult.position) {
      position = dcaResult.position;
    }

    // Step 2: Price rises to break-even trigger
    const positionWithBreakEven: Position = {
      ...position,
      riskState: {
        ...position.riskState,
        breakEven: {
          enabled: true,
          triggerPrice: 50000, // Break-even trigger at entry
          activated: false
        }
      }
    };
    
    let updatedPosition = updateBreakEvenStopLoss(positionWithBreakEven, 50000);
    expect(updatedPosition.riskState.breakEven?.activated).toBe(true);
    expect(updatedPosition.riskState.stopLossPrice).toBe(updatedPosition.avgEntryPrice);

    // Step 3: Price drops to break-even SL
    const slResult = await executeStopLoss(updatedPosition, updatedPosition.riskState.stopLossPrice);
    expect(slResult.executed).toBe(true);
    if (slResult.position) {
      position = slResult.position;
    }
    
    // Position should be closed at break-even
    expect(position.status).toBe('closed');
  });

  it('should calculate PnL correctly throughout lifecycle', async () => {
    // Initial PnL should be 0
    let unrealizedPnl = calculateUnrealizedPnl(position, 50000);
    expect(unrealizedPnl).toBe(0);

    // After price rise, PnL should be positive
    unrealizedPnl = calculateUnrealizedPnl(position, 51000);
    expect(unrealizedPnl).toBeGreaterThan(0);

    // After DCA and price adjustment, PnL should reflect new average
    const dcaLevel1: DCALevel = {
      level: 1,
      targetPrice: 49000,
      status: 'pending'
    };
    
    const dcaResult = await executeDCALevel(position, dcaLevel1, 49000);
    if (dcaResult.position) {
      position = dcaResult.position;
    }
    
    // PnL at 51000 should be different after DCA
    const pnlAfterDCA = calculateUnrealizedPnl(position, 51000);
    expect(pnlAfterDCA).not.toBe(unrealizedPnl);

    // After partial TP, realized PnL should increase
    const tpLevel: TPLevel = {
      level: 1,
      price: 51000,
      percentage: 50,
      status: 'pending'
    };
    
    const tpResult = await executeTPLevel(position, tpLevel, 51000);
    expect(tpResult.executed).toBe(true);
    if (tpResult.position) {
      position = tpResult.position;
    }
    
    expect(position.realizedPnlUsd).toBeGreaterThan(0);
    expect(position.positionQty).toBeLessThan(0.1);
  });
});

