/**
 * Position Engine
 * 
 * Core engine for position management operations
 * Handles position creation, updates, and calculations
 * 
 * Phase 6: Position Manager
 */

import { Position, PositionStatus } from '../models/Position';
import { OrderRef } from '../models/OrderRef';
import { Trade } from '../models/Trade';

/**
 * Create Position from Trade
 */
export function createPositionFromTrade(
  trade: Trade,
  entryOrder: OrderRef
): Position {
  const positionId = trade.id;
  
  return {
    id: positionId,
    userId: trade.user_id,
    exchange: (trade.platform?.toLowerCase() as 'binance' | 'okx') || 'binance',
    marketType: trade.trade_type || 'spot',
    symbol: trade.symbol,
    side: trade.side,
    status: 'open' as PositionStatus,
    entryOrders: [entryOrder],
    dcaOrders: [],
    tpOrders: [],
    slOrders: [],
    avgEntryPrice: trade.entry_price,
    positionQty: trade.quantity,
    leverage: trade.leverage || undefined,
    realizedPnlUsd: 0,
    unrealizedPnlUsd: 0,
    riskState: {
      stopLossPrice: trade.stop_loss_price || 0,
      takeProfitPrice: trade.take_profit_price || null
    },
    meta: {
      strategyId: 'main', // Default strategy
      signalId: undefined
    },
    openedAt: trade.opened_at || new Date().toISOString(),
    createdAt: trade.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Update average entry price after DCA fill
 */
export function updateAvgEntryPriceAfterDCA(
  position: Position,
  dcaOrder: OrderRef
): number {
  if (!dcaOrder.avgPrice || dcaOrder.filledQuantity <= 0) {
    return position.avgEntryPrice;
  }
  
  const currentValue = position.avgEntryPrice * position.positionQty;
  const dcaValue = dcaOrder.avgPrice * dcaOrder.filledQuantity;
  const newTotalQty = position.positionQty + dcaOrder.filledQuantity;
  
  if (newTotalQty <= 0) {
    return position.avgEntryPrice;
  }
  
  const newAvgPrice = (currentValue + dcaValue) / newTotalQty;
  return newAvgPrice;
}

/**
 * Update position quantity after order fill
 */
export function updatePositionQuantity(
  position: Position,
  order: OrderRef,
  isEntry: boolean
): number {
  if (isEntry) {
    // Entry order increases position
    return position.positionQty + order.filledQuantity;
  } else {
    // Exit order (TP/SL) decreases position
    return Math.max(0, position.positionQty - order.filledQuantity);
  }
}

/**
 * Check if position should be closed
 */
export function shouldClosePosition(position: Position): boolean {
  // Close if quantity is zero or negative
  if (position.positionQty <= 0) {
    return true;
  }
  
  // Close if status is already closing or closed
  if (position.status === 'closed' || position.status === 'closing') {
    return true;
  }
  
  return false;
}

/**
 * Get active orders for position
 */
export function getActiveOrders(position: Position): OrderRef[] {
  const allOrders = [
    ...position.entryOrders,
    ...position.dcaOrders,
    ...position.tpOrders,
    ...position.slOrders
  ];
  
  return allOrders.filter(order => 
    order.status === 'NEW' || 
    order.status === 'PENDING' || 
    order.status === 'PARTIALLY_FILLED'
  );
}

/**
 * Get filled orders for position
 */
export function getFilledOrders(position: Position): OrderRef[] {
  const allOrders = [
    ...position.entryOrders,
    ...position.dcaOrders,
    ...position.tpOrders,
    ...position.slOrders
  ];
  
  return allOrders.filter(order => order.status === 'FILLED');
}

