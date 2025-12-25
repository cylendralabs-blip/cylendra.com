/**
 * Copy Trading - Utility Functions
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Helper functions for copy trading operations
 */

import type { CopyStrategy, CopyFollower, StrategyType, RiskLabel } from './types';

/**
 * Get risk label based on performance metrics
 */
export function calculateRiskLabel(
  winRate: number,
  maxDrawdown: number,
  avgReturn: number
): RiskLabel {
  // High risk: low win rate OR high drawdown OR negative average return
  if (winRate < 50 || maxDrawdown < -20 || avgReturn < 0) {
    return 'HIGH';
  }

  // Medium risk: moderate metrics
  if (winRate < 60 || maxDrawdown < -10 || avgReturn < 5) {
    return 'MEDIUM';
  }

  // Low risk: good metrics
  return 'LOW';
}

/**
 * Format strategy type for display
 */
export function formatStrategyType(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    AI_MASTER: 'AI Master',
    HUMAN_BOT: 'Human + Bot',
    INFLUENCER: 'Influencer',
  };
  return labels[type] || type;
}

/**
 * Format allocation mode for display
 */
export function formatAllocationMode(mode: 'PERCENT' | 'FIXED'): string {
  return mode === 'PERCENT' ? 'Percentage' : 'Fixed Amount';
}

/**
 * Format status for display
 */
export function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Check if strategy is available for following
 */
export function isStrategyAvailable(strategy: CopyStrategy): boolean {
  return (
    strategy.status === 'ACTIVE' &&
    strategy.isPublic === true
  );
}

/**
 * Check if user can follow a strategy
 */
export function canUserFollowStrategy(
  strategy: CopyStrategy,
  userEquity: number
): { allowed: boolean; reason?: string } {
  if (!isStrategyAvailable(strategy)) {
    return {
      allowed: false,
      reason: 'Strategy is not available for following.',
    };
  }

  if (strategy.minDeposit > 0 && userEquity < strategy.minDeposit) {
    return {
      allowed: false,
      reason: `Minimum deposit required: $${strategy.minDeposit.toFixed(2)}`,
    };
  }

  return { allowed: true };
}

/**
 * Get default follower configuration
 */
export function getDefaultFollowerConfig(
  followerUserId: string,
  strategyId: string
): Partial<CopyFollower> {
  return {
    followerUserId,
    strategyId,
    status: 'ACTIVE',
    allocationMode: 'PERCENT',
    allocationValue: 10, // 10% default
    maxDailyLoss: 5, // 5% default
    maxTotalLoss: 20, // 20% default
    maxOpenTrades: 10,
    maxLeverage: 3,
    riskMultiplier: 1,
  };
}

/**
 * Validate follower configuration
 */
export function validateFollowerConfig(
  config: Partial<CopyFollower>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.allocationValue !== undefined) {
    if (config.allocationValue <= 0) {
      errors.push('Allocation value must be greater than 0');
    }
    if (config.allocationMode === 'PERCENT' && config.allocationValue > 100) {
      errors.push('Allocation percentage cannot exceed 100%');
    }
  }

  if (config.maxDailyLoss !== undefined && (config.maxDailyLoss < 0 || config.maxDailyLoss > 100)) {
    errors.push('Max daily loss must be between 0 and 100');
  }

  if (config.maxTotalLoss !== undefined && (config.maxTotalLoss < 0 || config.maxTotalLoss > 100)) {
    errors.push('Max total loss must be between 0 and 100');
  }

  if (config.maxOpenTrades !== undefined && config.maxOpenTrades < 1) {
    errors.push('Max open trades must be at least 1');
  }

  if (config.maxLeverage !== undefined && config.maxLeverage < 1) {
    errors.push('Max leverage must be at least 1');
  }

  if (config.riskMultiplier !== undefined && config.riskMultiplier <= 0) {
    errors.push('Risk multiplier must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate profit share amount
 */
export function calculateProfitShare(
  grossProfit: number,
  profitSharePercent: number
): number {
  if (grossProfit <= 0) return 0;
  return (grossProfit * profitSharePercent) / 100;
}

/**
 * Generate period string (e.g., '2025-02')
 */
export function generatePeriodString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if a period is the current period
 */
export function isCurrentPeriod(period: string): boolean {
  return period === generatePeriodString();
}

/**
 * Get period start and end dates
 */
export function getPeriodDates(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

