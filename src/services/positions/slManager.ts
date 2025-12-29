/**
 * Stop Loss (SL) Manager
 * 
 * Manages stop loss orders and execution
 * Supports: Fixed SL, Trailing SL, Break-even move
 * 
 * Phase 6: Position Manager
 */

import { Position } from '@/core/models/Position';
import { OrderRef } from '@/core/models/OrderRef';
import { shouldClosePosition } from '@/core/engines/positionEngine';

/**
 * SL Execution Result
 */
export interface SLExecutionResult {
  /** Whether SL was executed */
  executed: boolean;
  
  /** Updated position */
  position?: Position;
  
  /** Quantity closed */
  closedQuantity?: number;
  
  /** Realized PnL from SL */
  realizedPnl?: number;
  
  /** Message */
  message?: string;
  
  /** Error (if any) */
  error?: string;
}

/**
 * Check if stop loss should be triggered
 */
export function shouldTriggerStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  const slPrice = position.riskState.stopLossPrice;
  
  if (!slPrice || slPrice <= 0) {
    return false;
  }
  
  // For buy positions: trigger when price drops to SL
  // For sell positions: trigger when price rises to SL
  if (position.side === 'buy') {
    return currentPrice <= slPrice;
  } else {
    return currentPrice >= slPrice;
  }
}

/**
 * Execute stop loss
 */
export async function executeStopLoss(
  position: Position,
  currentPrice: number
): Promise<SLExecutionResult> {
  try {
    // Check if should trigger
    if (!shouldTriggerStopLoss(position, currentPrice)) {
      return {
        executed: false,
        message: `Stop loss not triggered (current: ${currentPrice}, SL: ${position.riskState.stopLossPrice})`
      };
    }
    
    // Check if position already closed
    if (shouldClosePosition(position)) {
      return {
        executed: false,
        message: 'Position already closed'
      };
    }
    
    // Calculate quantity to close (full position)
    const quantityToClose = position.positionQty;
    
    // Create SL order reference
    const slOrder: OrderRef = {
      id: `sl_${position.id}_${Date.now()}`,
      exchangeOrderId: `exchange_${Date.now()}`,
      exchange: position.exchange,
      marketType: position.marketType,
      symbol: position.symbol,
      side: position.side === 'buy' ? 'SELL' : 'BUY', // Opposite of position side
      type: 'STOP_MARKET',
      status: 'FILLED',
      price: position.riskState.stopLossPrice,
      quantity: quantityToClose,
      filledQuantity: quantityToClose,
      remainingQuantity: 0,
      avgPrice: currentPrice,
      commission: 0,
      commissionAsset: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filledAt: new Date().toISOString(),
      cancelledAt: null,
      metadata: {
        positionId: position.id,
        triggerType: 'STOP_LOSS'
      }
    };
    
    // Calculate realized PnL
    const exitPrice = currentPrice;
    const realizedPnl = calculateUnrealizedPnlAtExit(
      position,
      exitPrice
    );
    
    // Update position - close fully
    const updatedSlOrders = [...position.slOrders, slOrder];
    
    // Cancel all pending orders (TP, DCA)
    const cancelledTpOrders = position.tpOrders.map(order => ({
      ...order,
      status: 'CANCELED' as const,
      cancelledAt: new Date().toISOString()
    }));
    
    const cancelledDcaOrders = position.dcaOrders.map(order => ({
      ...order,
      status: 'CANCELED' as const,
      cancelledAt: new Date().toISOString()
    }));
    
    // Create updated position (closed)
    const updatedPosition: Position = {
      ...position,
      slOrders: updatedSlOrders,
      tpOrders: cancelledTpOrders,
      dcaOrders: cancelledDcaOrders,
      positionQty: 0,
      realizedPnlUsd: position.realizedPnlUsd + realizedPnl,
      unrealizedPnlUsd: 0,
      status: 'closed',
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      executed: true,
      position: updatedPosition,
      closedQuantity: quantityToClose,
      realizedPnl,
      message: `Stop loss triggered: closed ${quantityToClose} at ${currentPrice} (SL: ${position.riskState.stopLossPrice})`
    };
    
  } catch (error: any) {
    return {
      executed: false,
      error: error.message || 'Failed to execute stop loss'
    };
  }
}

/**
 * Calculate unrealized PnL when exiting at current price
 */
function calculateUnrealizedPnlAtExit(
  position: Position,
  exitPrice: number
): number {
  const leverage = position.leverage || 1;
  const priceDiff = exitPrice - position.avgEntryPrice;
  
  // Calculate base PnL
  const basePnL = position.side === 'buy'
    ? priceDiff * position.positionQty
    : -priceDiff * position.positionQty;
  
  // Apply leverage
  const pnl = leverage > 1 ? basePnL * leverage : basePnL;
  
  return pnl;
}

/**
 * Update trailing stop loss
 */
export function updateTrailingStopLoss(
  position: Position,
  currentPrice: number,
  highestPrice: number
): Position {
  const trailing = position.riskState.trailing;
  
  if (!trailing || !trailing.enabled) {
    return position;
  }
  
  // Check if activation price reached
  if (currentPrice < trailing.activationPrice) {
    return position;
  }
  
  // Calculate new trailing stop price
  const distanceAmount = (highestPrice * trailing.distance) / 100;
  const newTrailingStopPrice = highestPrice - distanceAmount;
  
  // Only move stop up (for buy positions)
  if (position.side === 'buy') {
    if (newTrailingStopPrice > trailing.currentStopPrice) {
      return {
        ...position,
        riskState: {
          ...position.riskState,
          trailing: {
            ...trailing,
            currentStopPrice: newTrailingStopPrice
          },
          stopLossPrice: newTrailingStopPrice
        },
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // For sell positions, move stop down
    if (newTrailingStopPrice < trailing.currentStopPrice) {
      return {
        ...position,
        riskState: {
          ...position.riskState,
          trailing: {
            ...trailing,
            currentStopPrice: newTrailingStopPrice
          },
          stopLossPrice: newTrailingStopPrice
        },
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  return position;
}

/**
 * Update break-even stop loss
 */
export function updateBreakEvenStopLoss(
  position: Position,
  currentPrice: number
): Position {
  const breakEven = position.riskState.breakEven;
  
  if (!breakEven || !breakEven.enabled || breakEven.activated) {
    return position;
  }
  
  // Check if trigger price reached
  const shouldActivate = position.side === 'buy'
    ? currentPrice >= breakEven.triggerPrice
    : currentPrice <= breakEven.triggerPrice;
  
  if (shouldActivate) {
    // Move stop loss to break-even (avg entry price)
    return {
      ...position,
      riskState: {
        ...position.riskState,
        breakEven: {
          ...breakEven,
          activated: true,
          activatedAt: new Date().toISOString()
        },
        stopLossPrice: position.avgEntryPrice // Move to break-even
      },
      updatedAt: new Date().toISOString()
    };
  }
  
  return position;
}

/**
 * Cancel all pending orders for position
 */
export function cancelAllPendingOrders(position: Position): Position {
  const cancelOrder = (order: OrderRef): OrderRef => ({
    ...order,
    status: 'CANCELED',
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return {
    ...position,
    entryOrders: position.entryOrders.map(cancelOrder),
    dcaOrders: position.dcaOrders.map(cancelOrder),
    tpOrders: position.tpOrders.map(cancelOrder),
    slOrders: position.slOrders.map(cancelOrder),
    updatedAt: new Date().toISOString()
  };
}

