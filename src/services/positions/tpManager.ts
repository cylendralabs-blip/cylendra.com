/**
 * Take Profit (TP) Manager
 * 
 * Manages take profit orders and execution
 * Supports: Fixed TP, Multi-TP levels, Partial TP, Trailing TP
 * 
 * Phase 6: Position Manager
 */

import { Position } from '@/core/models/Position';
import { OrderRef } from '@/core/models/OrderRef';
import { updatePositionQuantity } from '@/core/engines/positionEngine';
import { calculateRealizedPnlFromTpOrders } from '@/core/engines/pnlEngine';

/**
 * TP Level Configuration
 */
export interface TPLevel {
  /** TP level number (1, 2, 3, ...) */
  level: number;
  
  /** TP price */
  price: number;
  
  /** Percentage of position to close at this level (0-100) */
  percentage: number;
  
  /** Order ID (if order already placed) */
  orderId?: string;
  
  /** Order status */
  status?: 'pending' | 'filled' | 'cancelled';
  
  /** Filled quantity */
  filledQuantity?: number;
  
  /** Filled price */
  filledPrice?: number;
  
  /** Filled timestamp */
  filledAt?: string;
}

/**
 * TP Execution Result
 */
export interface TPExecutionResult {
  /** Whether TP was executed */
  executed: boolean;
  
  /** TP level that was executed */
  level?: number;
  
  /** Updated position */
  position?: Position;
  
  /** Quantity closed */
  closedQuantity?: number;
  
  /** Realized PnL from this TP */
  realizedPnl?: number;
  
  /** Message */
  message?: string;
  
  /** Error (if any) */
  error?: string;
}

/**
 * Check if TP level should be executed
 */
export function shouldExecuteTPLevel(
  level: TPLevel,
  currentPrice: number,
  side: 'buy' | 'sell'
): boolean {
  // Skip if already filled or cancelled
  if (level.status === 'filled' || level.status === 'cancelled') {
    return false;
  }
  
  // For buy positions: execute when price rises to target
  // For sell positions: execute when price drops to target
  if (side === 'buy') {
    return currentPrice >= level.price;
  } else {
    return currentPrice <= level.price;
  }
}

/**
 * Execute TP level
 */
export async function executeTPLevel(
  position: Position,
  tpLevel: TPLevel,
  currentPrice: number
): Promise<TPExecutionResult> {
  try {
    // Check if should execute
    if (!shouldExecuteTPLevel(tpLevel, currentPrice, position.side)) {
      return {
        executed: false,
        message: `TP level ${tpLevel.level} not reached yet (current: ${currentPrice}, target: ${tpLevel.price})`
      };
    }
    
    // Check if already executed
    if (tpLevel.status === 'filled') {
      return {
        executed: false,
        message: `TP level ${tpLevel.level} already executed`
      };
    }
    
    // Calculate quantity to close
    const quantityToClose = (position.positionQty * tpLevel.percentage) / 100;
    
    if (quantityToClose <= 0 || quantityToClose > position.positionQty) {
      return {
        executed: false,
        error: `Invalid quantity to close: ${quantityToClose}`
      };
    }
    
    // Create TP order reference
    const tpOrder: OrderRef = {
      id: `tp_${position.id}_${tpLevel.level}_${Date.now()}`,
      exchangeOrderId: `exchange_${Date.now()}`,
      exchange: position.exchange,
      marketType: position.marketType,
      symbol: position.symbol,
      side: position.side === 'buy' ? 'SELL' : 'BUY', // Opposite of position side
      type: 'TAKE_PROFIT_MARKET',
      status: 'FILLED',
      price: tpLevel.price,
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
        tpLevel: tpLevel.level,
        positionId: position.id
      }
    };
    
    // Update position
    const newPositionQty = updatePositionQuantity(position, tpOrder, false);
    
    // Calculate realized PnL from this TP
    const realizedPnl = calculateRealizedPnlFromTpOrders(position, [tpOrder]);
    const newRealizedPnl = position.realizedPnlUsd + realizedPnl;
    
    // Update TP orders array
    const updatedTpOrders = [...position.tpOrders, tpOrder];
    
    // Update risk state - mark this TP level as executed
    const updatedPartialTp = position.riskState.partialTp
      ? {
          ...position.riskState.partialTp,
          levels: position.riskState.partialTp.levels.map(level =>
            level.price === tpLevel.price
              ? { ...level, executed: true, executedAt: new Date().toISOString() }
              : level
          )
        }
      : undefined;
    
    // Create updated position
    const updatedPosition: Position = {
      ...position,
      tpOrders: updatedTpOrders,
      positionQty: newPositionQty,
      realizedPnlUsd: newRealizedPnl,
      riskState: {
        ...position.riskState,
        partialTp: updatedPartialTp
      },
      status: newPositionQty <= 0 ? 'closed' : position.status,
      closedAt: newPositionQty <= 0 ? new Date().toISOString() : position.closedAt,
      updatedAt: new Date().toISOString()
    };
    
    return {
      executed: true,
      level: tpLevel.level,
      position: updatedPosition,
      closedQuantity: quantityToClose,
      realizedPnl,
      message: `TP level ${tpLevel.level} executed: closed ${quantityToClose} at ${currentPrice}`
    };
    
  } catch (error: any) {
    return {
      executed: false,
      error: error.message || 'Failed to execute TP level'
    };
  }
}

/**
 * Monitor TP levels for position
 */
export async function monitorTPLevels(
  position: Position,
  currentPrice: number,
  tpLevels: TPLevel[]
): Promise<TPExecutionResult[]> {
  const results: TPExecutionResult[] = [];
  
  // Check each TP level
  for (const level of tpLevels) {
    if (level.status === 'pending' || !level.status) {
      const result = await executeTPLevel(position, level, currentPrice);
      
      if (result.executed) {
        results.push(result);
        // Update position for next iteration
        if (result.position) {
          Object.assign(position, result.position);
        }
      }
    }
  }
  
  return results;
}

/**
 * Get pending TP levels
 */
export function getPendingTPLevels(tpLevels: TPLevel[]): TPLevel[] {
  return tpLevels.filter(level => 
    level.status !== 'filled' && level.status !== 'cancelled'
  );
}

/**
 * Get filled TP levels
 */
export function getFilledTPLevels(tpLevels: TPLevel[]): TPLevel[] {
  return tpLevels.filter(level => level.status === 'filled');
}

/**
 * Update trailing TP
 */
export function updateTrailingTP(
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
  
  // Only move stop up (for buy positions) or down (for sell positions)
  const shouldUpdate = position.side === 'buy'
    ? newTrailingStopPrice > trailing.currentStopPrice
    : newTrailingStopPrice < trailing.currentStopPrice;
  
  if (shouldUpdate && newTrailingStopPrice !== trailing.currentStopPrice) {
    return {
      ...position,
      riskState: {
        ...position.riskState,
        trailing: {
          ...trailing,
          currentStopPrice: newTrailingStopPrice
        },
        stopLossPrice: newTrailingStopPrice // Update stop loss to trailing price
      },
      updatedAt: new Date().toISOString()
    };
  }
  
  return position;
}

