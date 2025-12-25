/**
 * PnL Engine
 * 
 * Calculates unrealized and realized profit/loss for positions
 * Unified calculation for both Binance and OKX
 * Supports Spot and Futures (with leverage)
 * 
 * Phase 6: Position Manager
 */

import { Position } from '../models/Position';
import { Trade } from '../models/Trade';
import { OrderRef } from '../models/OrderRef';

/**
 * PnL Calculation Result
 */
export interface PnLResult {
  /** Unrealized PnL in USD */
  unrealizedPnl: number;
  
  /** Realized PnL in USD */
  realizedPnl: number;
  
  /** Total PnL (unrealized + realized) */
  totalPnl: number;
  
  /** PnL percentage */
  pnlPercentage: number;
  
  /** Entry cost */
  entryCost: number;
  
  /** Current value */
  currentValue: number;
}

/**
 * Calculate unrealized PnL for a position
 */
export function calculateUnrealizedPnl(
  position: Position,
  lastPrice: number
): number {
  if (!lastPrice || !position.avgEntryPrice || position.positionQty <= 0) {
    return 0;
  }

  const leverage = position.leverage || 1;
  const priceDiff = lastPrice - position.avgEntryPrice;
  
  // For buy positions: profit when price goes up
  // For sell positions: profit when price goes down
  const basePnL = position.side === 'buy' 
    ? priceDiff * position.positionQty
    : -priceDiff * position.positionQty;
  
  // Apply leverage for futures
  const unrealizedPnl = position.marketType === 'futures'
    ? basePnL * leverage
    : basePnL;
  
  return unrealizedPnl;
}

/**
 * Calculate realized PnL from filled orders
 */
export function calculateRealizedPnl(
  fills: Array<{
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    fees?: number;
    leverage?: number;
  }>,
  side: 'buy' | 'sell'
): number {
  let totalRealizedPnl = 0;
  
  for (const fill of fills) {
    const leverage = fill.leverage || 1;
    const priceDiff = fill.exitPrice - fill.entryPrice;
    
    // Calculate base PnL
    const basePnL = side === 'buy'
      ? priceDiff * fill.quantity
      : -priceDiff * fill.quantity;
    
    // Apply leverage
    const pnl = leverage > 1 ? basePnL * leverage : basePnL;
    
    // Subtract fees
    const fees = fill.fees || 0;
    totalRealizedPnl += pnl - fees;
  }
  
  return totalRealizedPnl;
}

/**
 * Calculate realized PnL from TP orders
 */
export function calculateRealizedPnlFromTpOrders(
  position: Position,
  filledTpOrders: OrderRef[]
): number {
  if (!filledTpOrders.length || !position.avgEntryPrice) {
    return 0;
  }
  
  const fills = filledTpOrders.map(order => ({
    entryPrice: position.avgEntryPrice,
    exitPrice: order.avgPrice || order.price || 0,
    quantity: order.filledQuantity,
    fees: order.commission,
    leverage: position.leverage
  }));
  
  return calculateRealizedPnl(fills, position.side);
}

/**
 * Calculate total PnL for a position
 */
export function calculatePositionPnL(
  position: Position,
  lastPrice: number
): PnLResult {
  const unrealizedPnl = calculateUnrealizedPnl(position, lastPrice);
  const realizedPnl = position.realizedPnlUsd || 0;
  const totalPnl = unrealizedPnl + realizedPnl;
  
  // Calculate entry cost
  const entryCost = position.avgEntryPrice * position.positionQty * (position.leverage || 1);
  
  // Calculate current value
  const currentValue = lastPrice * position.positionQty * (position.leverage || 1);
  
  // Calculate PnL percentage
  const pnlPercentage = entryCost > 0
    ? (totalPnl / entryCost) * 100
    : 0;
  
  return {
    unrealizedPnl,
    realizedPnl,
    totalPnl,
    pnlPercentage,
    entryCost,
    currentValue
  };
}

/**
 * Calculate realized PnL from a closed trade
 */
export function calculateRealizedPnlFromTrade(
  trade: Trade,
  exitPrice: number
): number {
  if (!trade.entry_price || !exitPrice || !trade.quantity) {
    return 0;
  }
  
  const leverage = trade.leverage || 1;
  const priceDiff = exitPrice - trade.entry_price;
  
  // Calculate base PnL
  const basePnL = trade.side === 'buy'
    ? priceDiff * trade.quantity
    : -priceDiff * trade.quantity;
  
  // Apply leverage
  const pnl = leverage > 1 ? basePnL * leverage : basePnL;
  
  // Subtract fees
  const fees = trade.fees || 0;
  const commission = trade.commission || 0;
  
  return pnl - fees - commission;
}

