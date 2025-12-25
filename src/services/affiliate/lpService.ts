/**
 * LP (Loyalty Points) Service
 * 
 * Handles LP earning, spending, and redemption
 * 
 * Phase 11A: Influence Economy
 */

import { LPSource, LPTransactionType } from './types';

/**
 * LP Earning Rates (per action)
 */
const LP_EARNING_RATES: Record<LPSource, number> = {
  referral: 100, // Per verified referral
  subscription: 500, // Per subscription
  bot_activity: 10, // Per day of bot activity
  volume: 0.1, // Per $1 of trading volume
  mission: 200, // Per mission completion
  leaderboard: 1000, // Top 10 leaderboard
  purchase: 50, // Per purchase
  redemption: 0, // Not earned, only spent
};

/**
 * Calculate LP to earn for an action
 */
export function calculateLPEarned(
  source: LPSource,
  amount?: number,
  multiplier: number = 1.0
): number {
  const baseRate = LP_EARNING_RATES[source] || 0;

  if (source === 'volume' && amount) {
    return Math.floor(baseRate * amount * multiplier);
  }

  return Math.floor(baseRate * multiplier);
}

/**
 * Calculate LP balance
 */
export async function getLPBalance(userId: string): Promise<number> {
  // This would query the database
  // For now, return 0
  return 0;
}

/**
 * Check if user has enough LP
 */
export function hasEnoughLP(currentBalance: number, requiredLP: number): boolean {
  return currentBalance >= requiredLP;
}

/**
 * LP Redemption Values (LP cost for items)
 */
export const LP_REDEMPTION_VALUES: Record<string, number> = {
  discount_10: 500,
  discount_20: 1000,
  discount_30: 2000,
  subscription_month: 5000,
  subscription_year: 50000,
  backtest_10: 1000,
  backtest_50: 4000,
  ai_tool_access: 2000,
  token_airdrop_boost: 10000,
  cpu_boost: 15000,
};

/**
 * Get LP cost for redemption
 */
export function getLPCost(redemptionType: string): number {
  return LP_REDEMPTION_VALUES[redemptionType] || 0;
}

/**
 * Calculate LP expiration
 */
export function calculateLPExpiration(
  earnedAt: Date,
  expirationDays: number = 365
): Date {
  const expiration = new Date(earnedAt);
  expiration.setDate(expiration.getDate() + expirationDays);
  return expiration;
}

/**
 * Check if LP is expired
 */
export function isLPExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return new Date() > expiration;
}

/**
 * Apply tier multiplier to LP earning
 */
export function applyTierMultiplier(
  baseLP: number,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
): number {
  const multipliers: Record<string, number> = {
    bronze: 1.0,
    silver: 1.2,
    gold: 1.5,
    platinum: 2.0,
    diamond: 2.5,
  };

  return Math.floor(baseLP * (multipliers[tier] || 1.0));
}

