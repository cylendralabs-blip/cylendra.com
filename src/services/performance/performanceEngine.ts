/**
 * Performance Metrics Engine
 * 
 * Calculates comprehensive performance metrics for backtests
 * Win rate, profit factor, Sharpe ratio, max drawdown, etc.
 * 
 * Phase 9: Backtesting Engine - Task 7
 */

import { BacktestTrade } from '@/core/models/BacktestTrade';
import { EquityPoint } from '@/core/models/EquityPoint';
import { PerformanceMetrics } from '@/core/models/BacktestResult';

/**
 * Calculate performance metrics from trades and equity curve
 * 
 * @param trades - Array of closed trades
 * @param equityCurve - Equity curve points
 * @param initialCapital - Initial capital in USD
 * @param startDate - Start date timestamp
 * @param endDate - End date timestamp
 * @returns Performance metrics
 */
export function calculatePerformanceMetrics(
  trades: BacktestTrade[],
  equityCurve: EquityPoint[],
  initialCapital: number,
  startDate: number,
  endDate: number
): PerformanceMetrics {
  // Filter closed trades only
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  if (closedTrades.length === 0) {
    return getEmptyMetrics();
  }
  
  // Basic statistics
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => t.pnlUsd > 0);
  const losingTrades = closedTrades.filter(t => t.pnlUsd < 0);
  const winningTradesCount = winningTrades.length;
  const losingTradesCount = losingTrades.length;
  
  // Win rate
  const winRate = totalTrades > 0 ? (winningTradesCount / totalTrades) * 100 : 0;
  
  // Average win/loss
  const avgWin = winningTradesCount > 0
    ? winningTrades.reduce((sum, t) => sum + t.pnlUsd, 0) / winningTradesCount
    : 0;
  
  const avgLoss = losingTradesCount > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlUsd, 0) / losingTradesCount)
    : 0;
  
  // Profit factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnlUsd, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  // Total return
  const finalEquity = equityCurve.length > 0
    ? equityCurve[equityCurve.length - 1].equity
    : initialCapital;
  const totalReturnPct = ((finalEquity - initialCapital) / initialCapital) * 100;
  
  // Max drawdown
  const { maxDrawdownPct, maxDrawdownDurationDays } = calculateMaxDrawdown(
    equityCurve,
    initialCapital
  );
  
  // Expectancy
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
  
  // Win/Loss streaks
  const { maxWinStreak, maxLossStreak } = calculateStreaks(closedTrades);
  
  // Average trade duration
  const avgTradeDurationHours = calculateAvgTradeDuration(closedTrades);
  
  // CAGR (Compound Annual Growth Rate)
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const years = daysDiff / 365;
  const cagr = years > 0 && finalEquity > 0
    ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100
    : undefined;
  
  // Sharpe ratio
  const sharpeRatio = calculateSharpeRatio(equityCurve, totalReturnPct, years);
  
  // Volatility
  const volatility = calculateVolatility(equityCurve);
  
  // Calmar ratio (return / max drawdown)
  const calmarRatio = maxDrawdownPct > 0
    ? totalReturnPct / Math.abs(maxDrawdownPct)
    : undefined;
  
  return {
    totalReturnPct,
    cagr,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdownPct,
    maxDrawdownDurationDays,
    sharpeRatio,
    expectancy,
    maxWinStreak,
    maxLossStreak,
    totalTrades,
    winningTrades: winningTradesCount,
    losingTrades: losingTradesCount,
    avgTradeDurationHours,
    volatility,
    calmarRatio
  };
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(
  equityCurve: EquityPoint[],
  initialCapital: number
): { maxDrawdownPct: number; maxDrawdownDurationDays?: number } {
  if (equityCurve.length === 0) {
    return { maxDrawdownPct: 0 };
  }
  
  let maxEquity = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownStart = 0;
  let maxDrawdownEnd = 0;
  let currentDrawdownStart = 0;
  let inDrawdown = false;
  
  for (let i = 0; i < equityCurve.length; i++) {
    const equity = equityCurve[i].equity;
    
    // Update max equity
    if (equity > maxEquity) {
      maxEquity = equity;
      
      // End current drawdown
      if (inDrawdown) {
        const drawdownPct = ((maxEquity - equity) / maxEquity) * 100;
        if (drawdownPct > Math.abs(maxDrawdown)) {
          maxDrawdown = -drawdownPct;
          maxDrawdownStart = currentDrawdownStart;
          maxDrawdownEnd = equityCurve[i].time;
        }
        inDrawdown = false;
      }
    } else {
      // In drawdown
      if (!inDrawdown) {
        inDrawdown = true;
        currentDrawdownStart = equityCurve[i].time;
      }
      
      const drawdownPct = ((equity - maxEquity) / maxEquity) * 100;
      if (drawdownPct < maxDrawdown) {
        maxDrawdown = drawdownPct;
        maxDrawdownEnd = equityCurve[i].time;
      }
    }
  }
  
  const maxDrawdownDurationDays = maxDrawdownEnd > maxDrawdownStart
    ? (maxDrawdownEnd - maxDrawdownStart) / (1000 * 60 * 60 * 24)
    : undefined;
  
  return {
    maxDrawdownPct: maxDrawdown,
    maxDrawdownDurationDays
  };
}

/**
 * Calculate win/loss streaks
 */
function calculateStreaks(
  trades: BacktestTrade[]
): { maxWinStreak: number; maxLossStreak: number } {
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  // Sort by exit time
  const sortedTrades = [...trades]
    .filter(t => t.exitTime)
    .sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));
  
  for (const trade of sortedTrades) {
    if (trade.pnlUsd > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (trade.pnlUsd < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  }
  
  return { maxWinStreak, maxLossStreak };
}

/**
 * Calculate average trade duration
 */
function calculateAvgTradeDuration(trades: BacktestTrade[]): number | undefined {
  const tradesWithDuration = trades.filter(t => t.exitTime && t.entryTime);
  
  if (tradesWithDuration.length === 0) {
    return undefined;
  }
  
  const totalDuration = tradesWithDuration.reduce((sum, t) => {
    const duration = (t.exitTime! - t.entryTime) / (1000 * 60 * 60); // Convert to hours
    return sum + duration;
  }, 0);
  
  return totalDuration / tradesWithDuration.length;
}

/**
 * Calculate Sharpe ratio
 */
function calculateSharpeRatio(
  equityCurve: EquityPoint[],
  totalReturnPct: number,
  years: number
): number | undefined {
  if (equityCurve.length < 2 || years <= 0) {
    return undefined;
  }
  
  // Calculate returns for each period
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prevEquity = equityCurve[i - 1].equity;
    const currEquity = equityCurve[i].equity;
    const periodReturn = ((currEquity - prevEquity) / prevEquity) * 100;
    returns.push(periodReturn);
  }
  
  if (returns.length === 0) {
    return undefined;
  }
  
  // Calculate mean return
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate standard deviation
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualized Sharpe ratio (assuming 252 trading days)
  // Sharpe = (Return - RiskFreeRate) / StdDev
  // For simplicity, assuming risk-free rate = 0
  const annualizedStdDev = stdDev * Math.sqrt(252 / (equityCurve.length / (years * 252)));
  
  return annualizedStdDev > 0 ? (totalReturnPct / years) / annualizedStdDev : undefined;
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(equityCurve: EquityPoint[]): number | undefined {
  if (equityCurve.length < 2) {
    return undefined;
  }
  
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prevEquity = equityCurve[i - 1].equity;
    const currEquity = equityCurve[i].equity;
    const periodReturn = ((currEquity - prevEquity) / prevEquity) * 100;
    returns.push(periodReturn);
  }
  
  if (returns.length === 0) {
    return undefined;
  }
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

/**
 * Get empty metrics (when no trades)
 */
function getEmptyMetrics(): PerformanceMetrics {
  return {
    totalReturnPct: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    maxDrawdownPct: 0,
    expectancy: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0
  };
}

