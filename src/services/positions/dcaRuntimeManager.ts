/**
 * DCA Runtime Manager
 * 
 * Manages DCA (Dollar Cost Averaging) order execution during position runtime
 * Monitors DCA price levels and executes when price is reached
 * Updates avgEntryPrice and positionQty after DCA fills
 * 
 * Phase 6: Position Manager
 */

import { Position } from '@/core/models/Position';
import { OrderRef } from '@/core/models/OrderRef';
import { updateAvgEntryPriceAfterDCA, updatePositionQuantity } from '@/core/engines/positionEngine';

/**
 * DCA Level Configuration
 */
export interface DCALevel {
  /** DCA level number (1, 2, 3, ...) */
  level: number;
  
  /** Target price to trigger DCA */
  targetPrice: number;
  
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
 * DCA Execution Result
 */
export interface DCAExecutionResult {
  /** Whether DCA was executed */
  executed: boolean;
  
  /** DCA level that was executed */
  level?: number;
  
  /** Updated position */
  position?: Position;
  
  /** New average entry price */
  newAvgEntryPrice?: number;
  
  /** New position quantity */
  newPositionQty?: number;
  
  /** Message */
  message?: string;
  
  /** Error (if any) */
  error?: string;
}

/**
 * Check if DCA level should be executed
 */
export function shouldExecuteDCALevel(
  level: DCALevel,
  currentPrice: number,
  side: 'buy' | 'sell'
): boolean {
  // Skip if already filled or cancelled
  if (level.status === 'filled' || level.status === 'cancelled') {
    return false;
  }
  
  // For buy positions: execute when price drops to target
  // For sell positions: execute when price rises to target
  if (side === 'buy') {
    return currentPrice <= level.targetPrice;
  } else {
    return currentPrice >= level.targetPrice;
  }
}

/**
 * Execute DCA level
 */
export async function executeDCALevel(
  position: Position,
  dcaLevel: DCALevel,
  currentPrice: number
): Promise<DCAExecutionResult> {
  try {
    // Check if should execute
    if (!shouldExecuteDCALevel(dcaLevel, currentPrice, position.side)) {
      return {
        executed: false,
        message: `DCA level ${dcaLevel.level} not reached yet (current: ${currentPrice}, target: ${dcaLevel.targetPrice})`
      };
    }
    
    // Check if already executed
    if (dcaLevel.status === 'filled') {
      return {
        executed: false,
        message: `DCA level ${dcaLevel.level} already executed`
      };
    }
    
    // Create order reference (in real implementation, this would place actual order)
    const dcaOrder: OrderRef = {
      id: `dca_${position.id}_${dcaLevel.level}_${Date.now()}`,
      exchangeOrderId: `exchange_${Date.now()}`,
      exchange: position.exchange,
      marketType: position.marketType,
      symbol: position.symbol,
      side: position.side === 'buy' ? 'BUY' : 'SELL',
      type: 'LIMIT',
      status: 'FILLED',
      price: dcaLevel.targetPrice,
      quantity: calculateDCAPositionSize(position, dcaLevel.level),
      filledQuantity: calculateDCAPositionSize(position, dcaLevel.level),
      remainingQuantity: 0,
      avgPrice: currentPrice,
      commission: 0,
      commissionAsset: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filledAt: new Date().toISOString(),
      cancelledAt: null,
      metadata: {
        dcaLevel: dcaLevel.level,
        positionId: position.id
      }
    };
    
    // Update position
    const newAvgEntryPrice = updateAvgEntryPriceAfterDCA(position, dcaOrder);
    const newPositionQty = updatePositionQuantity(position, dcaOrder, true);
    
    // Update DCA orders array
    const updatedDcaOrders = [...position.dcaOrders, dcaOrder];
    
    // Create updated position
    const updatedPosition: Position = {
      ...position,
      dcaOrders: updatedDcaOrders,
      avgEntryPrice: newAvgEntryPrice,
      positionQty: newPositionQty,
      updatedAt: new Date().toISOString()
    };
    
    return {
      executed: true,
      level: dcaLevel.level,
      position: updatedPosition,
      newAvgEntryPrice,
      newPositionQty,
      message: `DCA level ${dcaLevel.level} executed at ${currentPrice}`
    };
    
  } catch (error: any) {
    return {
      executed: false,
      error: error.message || 'Failed to execute DCA level'
    };
  }
}

/**
 * Calculate DCA position size based on level
 */
function calculateDCAPositionSize(position: Position, dcaLevel: number): number {
  // Default: use initial position size
  // In real implementation, this should be calculated from bot settings
  const baseSize = position.positionQty;
  
  // Apply DCA multiplier (e.g., 1x, 1.5x, 2x for each level)
  const multiplier = 1 + (dcaLevel - 1) * 0.5; // 1x, 1.5x, 2x, 2.5x...
  
  return baseSize * multiplier;
}

/**
 * Monitor DCA levels for position
 */
export async function monitorDCALevels(
  position: Position,
  currentPrice: number,
  dcaLevels: DCALevel[]
): Promise<DCAExecutionResult[]> {
  const results: DCAExecutionResult[] = [];
  
  // Check each DCA level
  for (const level of dcaLevels) {
    if (level.status === 'pending' || !level.status) {
      const result = await executeDCALevel(position, level, currentPrice);
      
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
 * Get pending DCA levels
 */
export function getPendingDCALevels(dcaLevels: DCALevel[]): DCALevel[] {
  return dcaLevels.filter(level => 
    level.status !== 'filled' && level.status !== 'cancelled'
  );
}

/**
 * Get filled DCA levels
 */
export function getFilledDCALevels(dcaLevels: DCALevel[]): DCALevel[] {
  return dcaLevels.filter(level => level.status === 'filled');
}

