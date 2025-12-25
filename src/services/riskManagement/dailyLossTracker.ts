/**
 * Daily Loss Tracker
 * 
 * Tracks and enforces daily loss limits
 * Phase 5: Risk Management Engine (Advanced)
 */

import { Trade } from '@/core/models/Trade';

/**
 * Daily Loss Snapshot
 */
export interface DailyLossSnapshot {
  user_id: string;
  date: string; // YYYY-MM-DD format
  daily_pnl: number;
  daily_pnl_percentage: number;
  realized_pnl: number;
  unrealized_pnl: number;
  trades_count: number;
  closed_trades_count: number;
  active_trades_count: number;
  peak_equity: number;
  current_equity: number;
  max_daily_loss: number;
  max_daily_loss_percentage: number;
}

/**
 * Calculate daily PnL from trades
 */
export function calculateDailyPnL(
  trades: Trade[],
  currentEquity: number,
  startingEquity: number
): {
  dailyPnL: number;
  dailyPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  closedTradesCount: number;
  activeTradesCount: number;
} {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get trades closed today
  const closedToday = trades.filter(trade => {
    if (!trade.closed_at) return false;
    const closedDate = trade.closed_at.split('T')[0];
    return closedDate === today && trade.status === 'CLOSED';
  });

  // Calculate realized PnL from closed trades today
  const realizedPnL = closedToday.reduce((sum, trade) => {
    return sum + (trade.realized_pnl || 0);
  }, 0);

  // Get active trades
  const activeTrades = trades.filter(trade => 
    trade.status === 'ACTIVE' || trade.status === 'PENDING'
  );

  // Calculate unrealized PnL from active trades
  const unrealizedPnL = activeTrades.reduce((sum, trade) => {
    return sum + (trade.unrealized_pnl || 0);
  }, 0);

  // Daily PnL = realized + unrealized
  const dailyPnL = realizedPnL + unrealizedPnL;
  
  // Daily PnL percentage
  const dailyPnLPercentage = startingEquity > 0 
    ? (dailyPnL / startingEquity) * 100 
    : 0;

  return {
    dailyPnL,
    dailyPnLPercentage,
    realizedPnL,
    unrealizedPnL,
    closedTradesCount: closedToday.length,
    activeTradesCount: activeTrades.length
  };
}

/**
 * Check if daily loss limit is exceeded
 */
export function checkDailyLossLimit(
  dailyPnL: number,
  dailyPnLPercentage: number,
  maxDailyLossUsd?: number,
  maxDailyLossPct?: number,
  currentEquity?: number
): {
  exceeded: boolean;
  reason?: string;
  flag?: string;
} {
  // Check USD limit
  if (maxDailyLossUsd && dailyPnL < -maxDailyLossUsd) {
    return {
      exceeded: true,
      reason: `Daily loss limit (USD) exceeded: $${Math.abs(dailyPnL).toFixed(2)} >= $${maxDailyLossUsd.toFixed(2)}`,
      flag: 'DAILY_LOSS_LIMIT_HIT'
    };
  }

  // Check percentage limit
  if (maxDailyLossPct && Math.abs(dailyPnLPercentage) >= maxDailyLossPct) {
    return {
      exceeded: true,
      reason: `Daily loss percentage exceeded: ${Math.abs(dailyPnLPercentage).toFixed(2)}% >= ${maxDailyLossPct}%`,
      flag: 'DAILY_LOSS_LIMIT_HIT'
    };
  }

  return { exceeded: false };
}

/**
 * Create daily loss snapshot
 */
export function createDailyLossSnapshot(
  userId: string,
  trades: Trade[],
  currentEquity: number,
  startingEquity: number,
  maxDailyLossUsd?: number,
  maxDailyLossPct?: number
): DailyLossSnapshot {
  const today = new Date().toISOString().split('T')[0];
  const dailyPnLData = calculateDailyPnL(trades, currentEquity, startingEquity);

  // Get peak equity for today (start with starting equity)
  const peakEquity = Math.max(
    startingEquity,
    currentEquity,
    startingEquity + Math.max(0, dailyPnLData.dailyPnL)
  );

  return {
    user_id: userId,
    date: today,
    daily_pnl: dailyPnLData.dailyPnL,
    daily_pnl_percentage: dailyPnLData.dailyPnLPercentage,
    realized_pnl: dailyPnLData.realizedPnL,
    unrealized_pnl: dailyPnLData.unrealizedPnL,
    trades_count: trades.length,
    closed_trades_count: dailyPnLData.closedTradesCount,
    active_trades_count: dailyPnLData.activeTradesCount,
    peak_equity: peakEquity,
    current_equity: currentEquity,
    max_daily_loss: maxDailyLossUsd || 0,
    max_daily_loss_percentage: maxDailyLossPct || 0
  };
}

/**
 * Get starting equity for today
 * 
 * This should be the equity at the start of the day (midnight UTC)
 * For now, we'll use total_capital as a placeholder
 */
export function getStartingEquityForToday(
  totalCapital: number,
  previousDayEquity?: number
): number {
  // If we have previous day equity, use it
  // Otherwise, use total capital
  return previousDayEquity || totalCapital;
}

