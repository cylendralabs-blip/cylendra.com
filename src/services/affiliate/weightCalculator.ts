/**
 * Influence Weight Calculator
 * 
 * Calculates affiliate influence weight based on multiple factors
 * 
 * Phase 11A: Influence Economy
 */

import { WeightFactors } from './types';

/**
 * Default weight calculation factors
 */
const DEFAULT_FACTORS: WeightFactors = {
  activeUsersMultiplier: 3,
  registeredUsersMultiplier: 1,
  botActiveUsersMultiplier: 5,
  volumeMultiplier: 0.001, // $1 volume = 0.001 weight
  backtestUsersMultiplier: 2,
};

/**
 * Calculate Influence Weight
 * 
 * Formula:
 * W = (Users_active × 3) +
 *     (Users_registered × 1) +
 *     (Bot_active_users × 5) +
 *     (Volume_generated × 0.001) +
 *     (Backtest_users × 2)
 */
export function calculateInfluenceWeight(
  stats: {
    activeUsers: number;
    registeredUsers: number;
    botActiveUsers: number;
    totalVolumeUsd: number;
    backtestUsers: number;
  },
  factors?: Partial<WeightFactors>
): number {
  const f = { ...DEFAULT_FACTORS, ...factors };

  const weight =
    stats.activeUsers * f.activeUsersMultiplier +
    stats.registeredUsers * f.registeredUsersMultiplier +
    stats.botActiveUsers * f.botActiveUsersMultiplier +
    stats.totalVolumeUsd * f.volumeMultiplier +
    stats.backtestUsers * f.backtestUsersMultiplier;

  // Round to 2 decimal places
  return Math.round(weight * 100) / 100;
}

/**
 * Calculate weight change
 */
export function calculateWeightChange(
  oldWeight: number,
  newWeight: number
): number {
  return Math.round((newWeight - oldWeight) * 100) / 100;
}

/**
 * Get tier based on weight
 */
export function getTierFromWeight(weight: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (weight >= 10000) return 'diamond';
  if (weight >= 5000) return 'platinum';
  if (weight >= 2000) return 'gold';
  if (weight >= 500) return 'silver';
  return 'bronze';
}

/**
 * Get tier benefits
 */
export function getTierBenefits(tier: string): {
  cpaRate: number;
  revenueSharePct: number;
  lpMultiplier: number;
  tokenMultiplier: number;
  cpuBonus: number;
} {
  const benefits: Record<string, any> = {
    bronze: {
      cpaRate: 3.00,
      revenueSharePct: 10.00,
      lpMultiplier: 1.0,
      tokenMultiplier: 1.0,
      cpuBonus: 0,
    },
    silver: {
      cpaRate: 5.00,
      revenueSharePct: 15.00,
      lpMultiplier: 1.2,
      tokenMultiplier: 1.1,
      cpuBonus: 0.05,
    },
    gold: {
      cpaRate: 7.00,
      revenueSharePct: 20.00,
      lpMultiplier: 1.5,
      tokenMultiplier: 1.3,
      cpuBonus: 0.10,
    },
    platinum: {
      cpaRate: 9.00,
      revenueSharePct: 25.00,
      lpMultiplier: 2.0,
      tokenMultiplier: 1.5,
      cpuBonus: 0.15,
    },
    diamond: {
      cpaRate: 10.00,
      revenueSharePct: 30.00,
      lpMultiplier: 2.5,
      tokenMultiplier: 2.0,
      cpuBonus: 0.20,
    },
  };

  return benefits[tier] || benefits.bronze;
}

/**
 * Calculate weight decay (if user is inactive)
 */
export function calculateWeightDecay(
  currentWeight: number,
  daysInactive: number,
  decayRate: number = 0.01 // 1% per day
): number {
  if (daysInactive <= 30) return currentWeight; // No decay for first 30 days

  const daysOverLimit = daysInactive - 30;
  const decayFactor = 1 - (decayRate * daysOverLimit);
  const newWeight = currentWeight * Math.max(decayFactor, 0.5); // Max 50% decay

  return Math.round(newWeight * 100) / 100;
}

