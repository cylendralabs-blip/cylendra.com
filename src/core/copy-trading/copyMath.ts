/**
 * Copy Trading - Position Size Calculation
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Handles all mathematical calculations for copy trading:
 * - Position size calculation based on allocation mode
 * - Leverage adjustments
 * - Risk multiplier application
 */

import type { FollowerConfig, CalculatedPosition, MarketType } from './types';

/**
 * Calculate allocation amount based on mode and value
 */
export function calculateAllocation(
  equity: number,
  allocationMode: 'PERCENT' | 'FIXED',
  allocationValue: number
): number {
  if (allocationMode === 'PERCENT') {
    // Percentage of total equity, capped at 100%
    const percentage = Math.min(100, allocationValue);
    return (equity * percentage) / 100;
  } else {
    // Fixed amount, capped at equity
    return Math.min(equity, allocationValue);
  }
}

/**
 * Calculate risk-adjusted position size based on risk level
 */
export function calculateRiskAdjustedSize(
  baseSize: number,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): number {
  const riskMultipliers = {
    LOW: 1.0,
    MEDIUM: 0.75,
    HIGH: 0.5,
  };

  return baseSize * riskMultipliers[riskLevel];
}

/**
 * Calculate position size for a follower based on their configuration
 */
export function calculateFollowerPositionSize(
  followerConfig: FollowerConfig,
  masterPositionSize: number,
  masterEntryPrice: number,
  followerTotalEquity: number,
  masterLeverage?: number
): CalculatedPosition {
  const { allocationMode, allocationValue, riskMultiplier, maxLeverage } = followerConfig;

  let basePositionSize: number;

  // Calculate base position size based on allocation mode
  if (allocationMode === 'PERCENT') {
    // Percentage of total equity
    basePositionSize = (followerTotalEquity * allocationValue) / 100;
  } else {
    // Fixed amount
    basePositionSize = allocationValue;
  }

  // Apply risk multiplier
  let adjustedPositionSize = basePositionSize * riskMultiplier;

  // For futures, adjust for leverage
  let finalLeverage = maxLeverage;
  if (masterLeverage && masterLeverage > 0) {
    // Use master's leverage, but cap at follower's max
    finalLeverage = Math.min(masterLeverage, maxLeverage);
  }

  // Calculate position size in base currency (e.g., USDT)
  // For spot: positionSize = amount / price
  // For futures: positionSize = (amount * leverage) / price
  let positionSizeInBaseCurrency: number;
  
  if (masterLeverage && masterLeverage > 1) {
    // Futures: account for leverage
    positionSizeInBaseCurrency = adjustedPositionSize;
    // The actual position size will be adjusted by the exchange based on leverage
  } else {
    // Spot: direct calculation
    positionSizeInBaseCurrency = adjustedPositionSize;
  }

  // Calculate allocation before and after
  const allocationBefore = (adjustedPositionSize / followerTotalEquity) * 100;
  const allocationAfter = allocationBefore; // Will be updated after trade execution

  return {
    positionSize: Math.max(0, positionSizeInBaseCurrency),
    leverage: finalLeverage,
    allocationBefore: Math.min(100, allocationBefore),
    allocationAfter: Math.min(100, allocationAfter),
  };
}

/**
 * Calculate position size ratio relative to master
 * Returns the ratio of follower position to master position
 */
export function calculatePositionRatio(
  followerPositionSize: number,
  masterPositionSize: number
): number {
  if (masterPositionSize === 0) return 0;
  return followerPositionSize / masterPositionSize;
}

/**
 * Calculate PnL percentage for a copied trade
 */
export function calculateCopyTradePnL(
  entryPrice: number,
  exitPrice: number,
  side: 'BUY' | 'SELL' | 'LONG' | 'SHORT',
  leverage?: number
): number {
  let pnlPercent: number;

  if (side === 'BUY' || side === 'LONG') {
    // Long position: profit when exit > entry
    pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
    // Short position: profit when exit < entry
    pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
  }

  // Apply leverage if applicable
  if (leverage && leverage > 1) {
    pnlPercent = pnlPercent * leverage;
  }

  return pnlPercent;
}

/**
 * Calculate PnL amount in base currency
 */
export function calculateCopyTradePnLAmount(
  positionSize: number,
  entryPrice: number,
  exitPrice: number,
  side: 'BUY' | 'SELL' | 'LONG' | 'SHORT',
  leverage?: number
): number {
  const pnlPercent = calculateCopyTradePnL(entryPrice, exitPrice, side, leverage);
  return (positionSize * pnlPercent) / 100;
}

/**
 * Calculate daily loss percentage for a follower
 */
export function calculateDailyLoss(
  followerUserId: string,
  trades: Array<{
    pnlAmount?: number;
    createdAt: string;
  }>
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.createdAt);
    tradeDate.setHours(0, 0, 0, 0);
    return tradeDate.getTime() === today.getTime();
  });

  const totalLoss = todayTrades.reduce((sum, trade) => {
    const pnl = trade.pnlAmount || 0;
    return sum + (pnl < 0 ? Math.abs(pnl) : 0);
  }, 0);

  return totalLoss;
}

/**
 * Calculate total loss percentage for a follower
 */
export function calculateTotalLossPercentage(
  initialEquity: number,
  currentEquity: number
): number {
  if (initialEquity === 0) return 0;
  return ((initialEquity - currentEquity) / initialEquity) * 100;
}

/**
 * Calculate win rate from trade logs
 */
export function calculateWinRate(
  trades: Array<{ pnlAmount?: number }>
): number {
  if (trades.length === 0) return 0;

  const winningTrades = trades.filter(trade => (trade.pnlAmount || 0) > 0).length;
  return (winningTrades / trades.length) * 100;
}

/**
 * Calculate average return from trade logs
 */
export function calculateAverageReturn(
  trades: Array<{ pnlPercentage?: number }>
): number {
  if (trades.length === 0) return 0;

  const totalReturn = trades.reduce((sum, trade) => sum + (trade.pnlPercentage || 0), 0);
  return totalReturn / trades.length;
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(
  equityCurve: number[]
): number {
  if (equityCurve.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = equityCurve[0];

  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
    } else {
      const drawdown = ((peak - equityCurve[i]) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return -maxDrawdown; // Return as negative value
}

