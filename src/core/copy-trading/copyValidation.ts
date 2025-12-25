/**
 * Copy Trading Validation
 * 
 * Phase X.17 - Security Improvements
 * 
 * Enhanced validation for copy trading operations
 */

import type { FollowerConfig, CopyStrategy } from './types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate follower configuration
 */
export function validateFollowerConfig(config: Partial<FollowerConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Allocation value validation
  if (config.allocationValue !== undefined) {
    if (config.allocationValue <= 0) {
      errors.push('Allocation value must be greater than 0');
    }
    if (config.allocationMode === 'PERCENT' && config.allocationValue > 100) {
      errors.push('Allocation percentage cannot exceed 100%');
    }
    if (config.allocationMode === 'PERCENT' && config.allocationValue > 50) {
      warnings.push('Allocation percentage above 50% is considered high risk');
    }
    if (config.allocationMode === 'FIXED' && config.allocationValue < 10) {
      warnings.push('Fixed allocation below $10 may result in very small positions');
    }
  }

  // Max daily loss validation
  if (config.maxDailyLoss !== undefined) {
    if (config.maxDailyLoss < 0 || config.maxDailyLoss > 100) {
      errors.push('Max daily loss must be between 0 and 100');
    }
    if (config.maxDailyLoss > 20) {
      warnings.push('Max daily loss above 20% is considered very high risk');
    }
    if (config.maxDailyLoss === 0) {
      warnings.push('Max daily loss of 0% will stop all trading after any loss');
    }
  }

  // Max total loss validation
  if (config.maxTotalLoss !== undefined) {
    if (config.maxTotalLoss < 0 || config.maxTotalLoss > 100) {
      errors.push('Max total loss must be between 0 and 100');
    }
    if (config.maxTotalLoss > 50) {
      warnings.push('Max total loss above 50% is considered very high risk');
    }
    if (config.maxTotalLoss < config.maxDailyLoss!) {
      warnings.push('Max total loss is lower than max daily loss - this may cause premature stopping');
    }
  }

  // Max open trades validation
  if (config.maxOpenTrades !== undefined) {
    if (config.maxOpenTrades < 1) {
      errors.push('Max open trades must be at least 1');
    }
    if (config.maxOpenTrades > 50) {
      warnings.push('Max open trades above 50 may result in over-exposure');
    }
  }

  // Max leverage validation
  if (config.maxLeverage !== undefined) {
    if (config.maxLeverage < 1) {
      errors.push('Max leverage must be at least 1');
    }
    if (config.maxLeverage > 125) {
      errors.push('Max leverage cannot exceed 125 (exchange limit)');
    }
    if (config.maxLeverage > 10) {
      warnings.push('Max leverage above 10x is considered very high risk');
    }
  }

  // Risk multiplier validation
  if (config.riskMultiplier !== undefined) {
    if (config.riskMultiplier <= 0) {
      errors.push('Risk multiplier must be greater than 0');
    }
    if (config.riskMultiplier > 5) {
      warnings.push('Risk multiplier above 5x will significantly increase position sizes');
    }
    if (config.riskMultiplier < 0.1) {
      warnings.push('Risk multiplier below 0.1x will result in very small positions');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate strategy creation/update
 */
export function validateStrategy(strategy: Partial<CopyStrategy>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (strategy.name !== undefined) {
    if (!strategy.name || strategy.name.trim().length === 0) {
      errors.push('Strategy name is required');
    }
    if (strategy.name && strategy.name.length > 100) {
      errors.push('Strategy name cannot exceed 100 characters');
    }
    if (strategy.name && strategy.name.length < 3) {
      warnings.push('Strategy name is very short');
    }
  }

  // Strategy type validation
  if (strategy.strategyType !== undefined) {
    if (!['AI_MASTER', 'HUMAN_BOT', 'INFLUENCER'].includes(strategy.strategyType)) {
      errors.push('Invalid strategy type');
    }
  }

  // Min deposit validation
  if (strategy.minDeposit !== undefined) {
    if (strategy.minDeposit < 0) {
      errors.push('Min deposit cannot be negative');
    }
    if (strategy.minDeposit > 0 && strategy.minDeposit < 10) {
      warnings.push('Min deposit below $10 may not be meaningful');
    }
  }

  // Fee model validation
  if (strategy.feeModel !== undefined) {
    if (!['NONE', 'PROFIT_SHARE', 'SUBSCRIPTION'].includes(strategy.feeModel)) {
      errors.push('Invalid fee model');
    }

    if (strategy.feeModel === 'PROFIT_SHARE') {
      if (strategy.profitSharePercent === undefined || strategy.profitSharePercent <= 0) {
        errors.push('Profit share percent is required when fee model is PROFIT_SHARE');
      }
      if (strategy.profitSharePercent && (strategy.profitSharePercent < 0 || strategy.profitSharePercent > 100)) {
        errors.push('Profit share percent must be between 0 and 100');
      }
      if (strategy.profitSharePercent && strategy.profitSharePercent > 50) {
        warnings.push('Profit share above 50% is considered high');
      }
    }

    if (strategy.feeModel === 'SUBSCRIPTION') {
      if (strategy.monthlyFee === undefined || strategy.monthlyFee <= 0) {
        errors.push('Monthly fee is required when fee model is SUBSCRIPTION');
      }
      if (strategy.monthlyFee && strategy.monthlyFee < 1) {
        warnings.push('Monthly fee below $1 may not be sustainable');
      }
    }
  }

  // Risk label validation
  if (strategy.riskLabel !== undefined) {
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(strategy.riskLabel)) {
      errors.push('Invalid risk label');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sanitize allocation value
 */
export function sanitizeAllocationValue(
  value: number,
  mode: 'PERCENT' | 'FIXED'
): number {
  if (mode === 'PERCENT') {
    return Math.max(0.1, Math.min(100, value));
  } else {
    return Math.max(1, value);
  }
}

/**
 * Sanitize leverage
 */
export function sanitizeLeverage(leverage: number): number {
  return Math.max(1, Math.min(125, leverage));
}

/**
 * Sanitize risk multiplier
 */
export function sanitizeRiskMultiplier(multiplier: number): number {
  return Math.max(0.1, Math.min(5, multiplier));
}

