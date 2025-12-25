/**
 * Equity Point Model
 * 
 * Represents a single point in the equity curve
 * 
 * Phase 9: Backtesting Engine - Task 6
 */

/**
 * Equity Point
 */
export interface EquityPoint {
  /** Timestamp (milliseconds) */
  time: number;
  /** Equity value in USD */
  equity: number;
  /** Unrealized PnL in USD */
  unrealizedPnl?: number;
  /** Realized PnL in USD */
  realizedPnl?: number;
  /** Number of open positions */
  openPositions?: number;
}

/**
 * Generate equity curve from trades
 * 
 * @param initialEquity - Initial equity
 * @param trades - Array of trades with timestamps
 * @returns Array of equity points
 */
export function generateEquityCurve(
  initialEquity: number,
  trades: Array<{ entryTime: number; exitTime?: number; pnlUsd: number }>
): EquityPoint[] {
  const points: EquityPoint[] = [];
  let currentEquity = initialEquity;
  let realizedPnl = 0;
  
  // Sort trades by entry time
  const sortedTrades = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  
  // Track open positions
  const openPositions: Array<{ entryTime: number; pnlUsd: number }> = [];
  
  for (const trade of sortedTrades) {
    // Add entry point
    openPositions.push({ entryTime: trade.entryTime, pnlUsd: 0 });
    
    points.push({
      time: trade.entryTime,
      equity: currentEquity,
      openPositions: openPositions.length
    });
    
    // If trade is closed, add exit point
    if (trade.exitTime) {
      // Update realized PnL
      realizedPnl += trade.pnlUsd;
      currentEquity += trade.pnlUsd;
      
      // Remove from open positions
      const index = openPositions.findIndex(p => p.entryTime === trade.entryTime);
      if (index >= 0) {
        openPositions.splice(index, 1);
      }
      
      points.push({
        time: trade.exitTime,
        equity: currentEquity,
        realizedPnl: trade.pnlUsd,
        openPositions: openPositions.length
      });
    }
  }
  
  // Sort by time
  return points.sort((a, b) => a.time - b.time);
}

/**
 * Get equity at specific time
 * 
 * @param equityCurve - Array of equity points
 * @param time - Timestamp
 * @returns Equity value at time (interpolated if needed)
 */
export function getEquityAtTime(
  equityCurve: EquityPoint[],
  time: number
): number {
  if (equityCurve.length === 0) {
    return 0;
  }
  
  // Find closest point
  let closest = equityCurve[0];
  let minDiff = Math.abs(time - closest.time);
  
  for (const point of equityCurve) {
    const diff = Math.abs(time - point.time);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  
  return closest.equity;
}

