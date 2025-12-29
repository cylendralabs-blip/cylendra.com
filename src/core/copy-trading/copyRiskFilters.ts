/**
 * Copy Trading - Risk Filters
 * 
 * Phase X.17 - Copy Trading System
 * 
 * Implements risk management filters to prevent unsafe copy trades:
 * - Daily loss limits
 * - Total loss limits
 * - Maximum open trades
 * - Leverage limits
 * - Portfolio risk checks
 */

import type { FollowerConfig, RiskCheckResult, MarketType } from './types';

/**
 * Check if a follower can execute a new copy trade
 */
export function checkFollowerRiskLimits(
  followerConfig: FollowerConfig,
  followerEquity: number,
  followerInitialEquity: number,
  currentOpenTrades: number,
  dailyLossAmount: number,
  requestedLeverage?: number
): RiskCheckResult {
  const warnings: string[] = [];
  let allowed = true;
  let reason: string | undefined;

  // Check 1: Follower status
  if (followerConfig.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `Follower status is ${followerConfig.status}. Copy trading is paused or stopped.`,
    };
  }

  // Check 2: Maximum open trades
  if (currentOpenTrades >= followerConfig.maxOpenTrades) {
    return {
      allowed: false,
      reason: `Maximum open trades limit reached (${currentOpenTrades}/${followerConfig.maxOpenTrades}).`,
    };
  }

  // Check 3: Maximum leverage
  if (requestedLeverage && requestedLeverage > followerConfig.maxLeverage) {
    return {
      allowed: false,
      reason: `Requested leverage (${requestedLeverage}x) exceeds maximum allowed (${followerConfig.maxLeverage}x).`,
    };
  }

  // Check 4: Daily loss limit
  if (followerConfig.maxDailyLoss !== undefined && followerConfig.maxDailyLoss > 0) {
    const dailyLossPercent = (dailyLossAmount / followerEquity) * 100;
    if (dailyLossPercent >= followerConfig.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached (${dailyLossPercent.toFixed(2)}% >= ${followerConfig.maxDailyLoss}%).`,
      };
    } else if (dailyLossPercent >= followerConfig.maxDailyLoss * 0.8) {
      warnings.push(`Daily loss is approaching limit (${dailyLossPercent.toFixed(2)}% of ${followerConfig.maxDailyLoss}%).`);
    }
  }

  // Check 5: Total loss limit
  if (followerConfig.maxTotalLoss !== undefined && followerConfig.maxTotalLoss > 0) {
    const totalLoss = followerInitialEquity - followerEquity;
    const totalLossPercent = (totalLoss / followerInitialEquity) * 100;
    if (totalLossPercent >= followerConfig.maxTotalLoss) {
      // Auto-pause follower
      return {
        allowed: false,
        reason: `Total loss limit reached (${totalLossPercent.toFixed(2)}% >= ${followerConfig.maxTotalLoss}%). Copy trading will be paused.`,
      };
    } else if (totalLossPercent >= followerConfig.maxTotalLoss * 0.8) {
      warnings.push(`Total loss is approaching limit (${totalLossPercent.toFixed(2)}% of ${followerConfig.maxTotalLoss}%).`);
    }
  }

  // Check 6: Minimum equity check
  const minEquity = 10; // Minimum $10 to continue trading
  if (followerEquity < minEquity) {
    return {
      allowed: false,
      reason: `Insufficient equity ($${followerEquity.toFixed(2)} < $${minEquity}).`,
    };
  }

  return {
    allowed,
    reason,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Check if follower can copy a specific trade based on portfolio risk
 */
export function checkPortfolioRisk(
  followerEquity: number,
  newPositionSize: number,
  existingPositionsValue: number,
  maxExposurePercent: number = 80
): RiskCheckResult {
  const totalExposure = existingPositionsValue + newPositionSize;
  const exposurePercent = (totalExposure / followerEquity) * 100;

  if (exposurePercent > maxExposurePercent) {
    return {
      allowed: false,
      reason: `Total exposure (${exposurePercent.toFixed(2)}%) would exceed maximum (${maxExposurePercent}%).`,
    };
  }

  if (exposurePercent > maxExposurePercent * 0.9) {
    return {
      allowed: true,
      warnings: [`Total exposure (${exposurePercent.toFixed(2)}%) is approaching maximum (${maxExposurePercent}%).`],
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Check if master and follower are the same user (prevent self-copying)
 */
export function checkSelfCopyPrevention(
  masterUserId: string,
  followerUserId: string
): RiskCheckResult {
  if (masterUserId === followerUserId) {
    return {
      allowed: false,
      reason: 'Cannot copy your own strategy. Master and follower cannot be the same user.',
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Check if trade is too old (only allow real-time trades)
 */
export function checkTradeRecency(
  tradeTimestamp: string,
  maxAgeSeconds: number = 60
): RiskCheckResult {
  const tradeTime = new Date(tradeTimestamp).getTime();
  const now = Date.now();
  const ageSeconds = (now - tradeTime) / 1000;

  if (ageSeconds > maxAgeSeconds) {
    return {
      allowed: false,
      reason: `Trade is too old (${Math.round(ageSeconds)}s > ${maxAgeSeconds}s). Only real-time trades can be copied.`,
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Comprehensive risk check combining all filters
 */
export function performComprehensiveRiskCheck(
  followerConfig: FollowerConfig,
  masterUserId: string,
  followerUserId: string,
  followerEquity: number,
  followerInitialEquity: number,
  currentOpenTrades: number,
  dailyLossAmount: number,
  existingPositionsValue: number,
  newPositionSize: number,
  requestedLeverage?: number,
  tradeTimestamp?: string
): RiskCheckResult {
  // Check 1: Self-copy prevention
  const selfCopyCheck = checkSelfCopyPrevention(masterUserId, followerUserId);
  if (!selfCopyCheck.allowed) {
    return selfCopyCheck;
  }

  // Check 2: Trade recency (if timestamp provided)
  if (tradeTimestamp) {
    const recencyCheck = checkTradeRecency(tradeTimestamp);
    if (!recencyCheck.allowed) {
      return recencyCheck;
    }
  }

  // Check 3: Follower risk limits
  const riskLimitsCheck = checkFollowerRiskLimits(
    followerConfig,
    followerEquity,
    followerInitialEquity,
    currentOpenTrades,
    dailyLossAmount,
    requestedLeverage
  );
  if (!riskLimitsCheck.allowed) {
    return riskLimitsCheck;
  }

  // Check 4: Portfolio risk
  const portfolioRiskCheck = checkPortfolioRisk(
    followerEquity,
    newPositionSize,
    existingPositionsValue
  );
  if (!portfolioRiskCheck.allowed) {
    return portfolioRiskCheck;
  }

  // Combine warnings
  const allWarnings = [
    ...(riskLimitsCheck.warnings || []),
    ...(portfolioRiskCheck.warnings || []),
  ];

  return {
    allowed: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

