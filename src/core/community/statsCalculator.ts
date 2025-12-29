/**
 * Community Stats Calculator
 * 
 * Phase X.12 - Calculates trader statistics, ranks, and LP points
 */

import type { RankLevel, InfluencerLevel } from './types';

/**
 * Calculate win rate from stats
 */
export function calculateWinRate(
  winCount: number,
  lossCount: number,
  breakevenCount: number
): number {
  const total = winCount + lossCount + breakevenCount;
  if (total === 0) return 0;
  return Math.round((winCount / total) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate average return
 */
export function calculateAvgReturn(
  totalReturn: number,
  closedSignals: number
): number {
  if (closedSignals === 0) return 0;
  return Math.round((totalReturn / closedSignals) * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate reputation score
 * Based on: win rate, avg return, total signals, votes received
 */
export function calculateReputation(
  winRate: number,
  avgReturn: number,
  totalSignals: number,
  totalVotes: number,
  upvotes: number
): number {
  let score = 0;

  // Win rate component (0-400 points)
  score += (winRate / 100) * 400;

  // Average return component (0-300 points)
  // Positive returns boost, negative reduce
  if (avgReturn > 0) {
    score += Math.min(300, avgReturn * 10);
  } else {
    score += Math.max(-100, avgReturn * 10);
  }

  // Total signals component (0-200 points)
  score += Math.min(200, totalSignals * 2);

  // Community engagement (votes) (0-100 points)
  const voteRatio = totalVotes > 0 ? upvotes / totalVotes : 0;
  score += voteRatio * 100;

  // Normalize to 0-1000
  return Math.max(0, Math.min(1000, Math.round(score)));
}

/**
 * Determine rank based on reputation and stats
 */
export function calculateRank(
  reputation: number,
  winRate: number,
  totalSignals: number,
  avgReturn: number
): RankLevel {
  // Legend: reputation >= 900, win rate >= 70%, min 50 signals, avg return > 2%
  if (reputation >= 900 && winRate >= 70 && totalSignals >= 50 && avgReturn > 2) {
    return 'Legend';
  }

  // Master: reputation >= 750, win rate >= 65%, min 30 signals
  if (reputation >= 750 && winRate >= 65 && totalSignals >= 30) {
    return 'Master';
  }

  // Elite: reputation >= 600, win rate >= 60%, min 20 signals
  if (reputation >= 600 && winRate >= 60 && totalSignals >= 20) {
    return 'Elite';
  }

  // Pro: reputation >= 400, win rate >= 55%, min 10 signals
  if (reputation >= 400 && winRate >= 55 && totalSignals >= 10) {
    return 'Pro';
  }

  // Skilled: reputation >= 200, min 5 signals
  if (reputation >= 200 && totalSignals >= 5) {
    return 'Skilled';
  }

  // Newbie: default
  return 'Newbie';
}

/**
 * Calculate weight for ranking
 * Weight affects how much a trader's signals are prioritized
 */
export function calculateWeight(
  reputation: number,
  winRate: number,
  rank: RankLevel,
  influencerLevel?: InfluencerLevel
): number {
  let weight = 0;

  // Base weight from reputation (0-50 points)
  weight += (reputation / 1000) * 50;

  // Win rate bonus (0-30 points)
  weight += (winRate / 100) * 30;

  // Rank bonus (0-20 points)
  const rankBonus: Record<RankLevel, number> = {
    Newbie: 0,
    Skilled: 5,
    Pro: 10,
    Elite: 15,
    Master: 18,
    Legend: 20,
  };
  weight += rankBonus[rank] || 0;

  // Influencer bonus (0-20 points)
  if (influencerLevel) {
    const influencerBonus: Record<InfluencerLevel, number> = {
      Bronze: 5,
      Silver: 10,
      Gold: 15,
      Elite: 20,
    };
    weight += influencerBonus[influencerLevel] || 0;
  }

  return Math.max(0, Math.min(100, Math.round(weight * 10) / 10));
}

/**
 * Calculate LP points for an action
 */
export function calculateLPPoints(
  action: 'publish_signal' | 'signal_win' | 'signal_loss' | 'upvote' | 'downvote' | 'influencer_bonus' | 'weekly_winner',
  basePoints?: number
): number {
  const points: Record<string, number> = {
    publish_signal: 2,
    signal_win: 10,
    signal_loss: -5,
    upvote: 1,
    downvote: 0, // No points for downvoting
    influencer_bonus: 50,
    weekly_winner: 100,
  };

  return basePoints !== undefined ? basePoints : (points[action] || 0);
}

/**
 * Update trader stats after signal close
 */
export function updateStatsAfterSignalClose(
  currentStats: {
    total_signals: number;
    closed_signals: number;
    win_count: number;
    loss_count: number;
    breakeven_count: number;
    total_return: number;
  },
  result: 'WIN' | 'LOSS' | 'BREAKEVEN',
  pnlPercentage: number
): {
  closed_signals: number;
  win_count: number;
  loss_count: number;
  breakeven_count: number;
  total_return: number;
  win_rate: number;
  avg_return: number;
} {
  const newStats = {
    ...currentStats,
    closed_signals: currentStats.closed_signals + 1,
    win_count: result === 'WIN' ? currentStats.win_count + 1 : currentStats.win_count,
    loss_count: result === 'LOSS' ? currentStats.loss_count + 1 : currentStats.loss_count,
    breakeven_count: result === 'BREAKEVEN' ? currentStats.breakeven_count + 1 : currentStats.breakeven_count,
    total_return: currentStats.total_return + pnlPercentage,
  };

  const winRate = calculateWinRate(
    newStats.win_count,
    newStats.loss_count,
    newStats.breakeven_count
  );

  const avgReturn = calculateAvgReturn(
    newStats.total_return,
    newStats.closed_signals
  );

  return {
    ...newStats,
    win_rate: winRate,
    avg_return: avgReturn,
  };
}

