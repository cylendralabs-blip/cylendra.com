/**
 * Performance Engine
 * 
 * Calculates portfolio performance metrics
 * Winrate, Profit Factor, Sharpe Ratio, Daily/Weekly/Monthly PnL
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 6
 */

import { Trade } from '@/core/models/Trade';
import { PortfolioMetrics } from '@/core/models/PortfolioSnapshot';

/**
 * Calculate Win Rate
 */
export function calculateWinRate(trades: Trade[]): number {
  const closedTrades = trades.filter(t => 
    t.status === 'CLOSED' && t.realized_pnl !== null
  );
  
  if (closedTrades.length === 0) {
    return 0;
  }
  
  const winningTrades = closedTrades.filter(t => 
    (t.realized_pnl || 0) > 0
  );
  
  return (winningTrades.length / closedTrades.length) * 100;
}

/**
 * Calculate Average Win
 */
export function calculateAverageWin(trades: Trade[]): number {
  const winningTrades = trades.filter(t => 
    t.status === 'CLOSED' && (t.realized_pnl || 0) > 0
  );
  
  if (winningTrades.length === 0) {
    return 0;
  }
  
  const totalWin = winningTrades.reduce((sum, t) => 
    sum + (t.realized_pnl || 0), 0
  );
  
  return totalWin / winningTrades.length;
}

/**
 * Calculate Average Loss
 */
export function calculateAverageLoss(trades: Trade[]): number {
  const losingTrades = trades.filter(t => 
    t.status === 'CLOSED' && (t.realized_pnl || 0) < 0
  );
  
  if (losingTrades.length === 0) {
    return 0;
  }
  
  const totalLoss = losingTrades.reduce((sum, t) => 
    sum + Math.abs(t.realized_pnl || 0), 0
  );
  
  return totalLoss / losingTrades.length;
}

/**
 * Calculate Profit Factor
 */
export function calculateProfitFactor(trades: Trade[]): number {
  const closedTrades = trades.filter(t => 
    t.status === 'CLOSED' && t.realized_pnl !== null
  );
  
  if (closedTrades.length === 0) {
    return 0;
  }
  
  const totalProfit = closedTrades
    .filter(t => (t.realized_pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  
  const totalLoss = closedTrades
    .filter(t => (t.realized_pnl || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.realized_pnl || 0), 0);
  
  if (totalLoss === 0) {
    return totalProfit > 0 ? Infinity : 0;
  }
  
  return totalProfit / totalLoss;
}

/**
 * Calculate Sharpe Ratio
 * Simplified version - uses daily returns
 */
export function calculateSharpeRatio(
  dailyReturns: number[],
  riskFreeRate: number = 0
): number {
  if (dailyReturns.length === 0) {
    return 0;
  }
  
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const excessReturn = avgReturn - riskFreeRate;
  
  // Calculate standard deviation
  const variance = dailyReturns.reduce((sum, r) => {
    const diff = r - avgReturn;
    return sum + (diff * diff);
  }, 0) / dailyReturns.length;
  
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    return 0;
  }
  
  // Annualized Sharpe Ratio (assuming 365 trading days)
  return (excessReturn / stdDev) * Math.sqrt(365);
}

/**
 * Calculate Daily PnL
 */
export function calculateDailyPnL(
  trades: Trade[],
  date: Date = new Date()
): number {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const tradesToday = trades.filter(t => {
    if (!t.closed_at) {
      return false;
    }
    const closedAt = new Date(t.closed_at);
    return closedAt >= startOfDay && closedAt <= endOfDay;
  });
  
  return tradesToday.reduce((sum, t) => 
    sum + (t.realized_pnl || 0), 0
  );
}

/**
 * Calculate Weekly PnL
 */
export function calculateWeeklyPnL(
  trades: Trade[],
  date: Date = new Date()
): number {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const tradesThisWeek = trades.filter(t => {
    if (!t.closed_at) {
      return false;
    }
    const closedAt = new Date(t.closed_at);
    return closedAt >= startOfWeek && closedAt <= endOfWeek;
  });
  
  return tradesThisWeek.reduce((sum, t) => 
    sum + (t.realized_pnl || 0), 0
  );
}

/**
 * Calculate Monthly PnL
 */
export function calculateMonthlyPnL(
  trades: Trade[],
  date: Date = new Date()
): number {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  const tradesThisMonth = trades.filter(t => {
    if (!t.closed_at) {
      return false;
    }
    const closedAt = new Date(t.closed_at);
    return closedAt >= startOfMonth && closedAt <= endOfMonth;
  });
  
  return tradesThisMonth.reduce((sum, t) => 
    sum + (t.realized_pnl || 0), 0
  );
}

/**
 * Calculate Cumulative PnL
 */
export function calculateCumulativePnL(trades: Trade[]): number {
  const closedTrades = trades.filter(t => 
    t.status === 'CLOSED' && t.realized_pnl !== null
  );
  
  return closedTrades.reduce((sum, t) => 
    sum + (t.realized_pnl || 0), 0
  );
}

/**
 * Calculate Growth Percentage
 */
export function calculateGrowthPercentage(
  currentEquity: number,
  initialEquity: number
): number {
  if (initialEquity === 0) {
    return 0;
  }
  
  return ((currentEquity - initialEquity) / initialEquity) * 100;
}

/**
 * Calculate Portfolio Metrics
 */
export function calculatePortfolioMetrics(
  trades: Trade[],
  currentEquity: number,
  initialEquity: number,
  unrealizedPnl: number
): PortfolioMetrics {
  const closedTrades = trades.filter(t => 
    t.status === 'CLOSED' && t.realized_pnl !== null
  );
  
  const realizedPnl = calculateCumulativePnL(trades);
  const dailyPnl = calculateDailyPnL(trades);
  const weeklyPnl = calculateWeeklyPnL(trades);
  const monthlyPnl = calculateMonthlyPnL(trades);
  
  // Calculate percentages
  const dailyPnlPct = initialEquity > 0 
    ? (dailyPnl / initialEquity) * 100 
    : 0;
  
  const weeklyPnlPct = initialEquity > 0 
    ? (weeklyPnl / initialEquity) * 100 
    : 0;
  
  const monthlyPnlPct = initialEquity > 0 
    ? (monthlyPnl / initialEquity) * 100 
    : 0;
  
  // Calculate winrate, profit factor
  const winRate = calculateWinRate(trades);
  const profitFactor = calculateProfitFactor(trades);
  
  // Calculate Sharpe Ratio (simplified - requires daily returns)
  // For now, we'll leave it undefined or calculate from daily PnL if available
  const sharpeRatio = undefined; // Can be calculated if daily returns are available
  
  return {
    dailyPnl,
    dailyPnlPct,
    weeklyPnl,
    weeklyPnlPct,
    monthlyPnl,
    monthlyPnlPct,
    realizedPnl,
    unrealizedPnl,
    winRate,
    profitFactor,
    sharpeRatio
  };
}

/**
 * Calculate Daily Returns (for Sharpe Ratio calculation)
 */
export function calculateDailyReturns(
  equityHistory: Array<{ date: string; equity: number }>
): number[] {
  if (equityHistory.length < 2) {
    return [];
  }
  
  const returns: number[] = [];
  
  for (let i = 1; i < equityHistory.length; i++) {
    const prevEquity = equityHistory[i - 1].equity;
    const currentEquity = equityHistory[i].equity;
    
    if (prevEquity > 0) {
      const returnPct = ((currentEquity - prevEquity) / prevEquity) * 100;
      returns.push(returnPct);
    }
  }
  
  return returns;
}

