/**
 * Backtest Configuration Model
 * 
 * Configuration for running a backtest
 * 
 * Phase 9: Backtesting Engine - Task 2
 */

import { BotSettingsForm } from '@/core/config';
import { RiskSettings } from '@/services/admin/RiskSettingsService';

/**
 * Backtest Configuration
 */
export interface BacktestConfig {
  /** User ID */
  userId: string;
  
  /** Strategy ID (e.g., 'main-strategy') */
  strategyId: string;
  
  /** Exchange name */
  exchange: 'binance' | 'okx';
  
  /** Market type */
  marketType: 'spot' | 'futures';
  
  /** Trading symbols */
  symbols: string[];
  
  /** Timeframe (e.g., '1h', '4h', '1d') */
  timeframe: string;
  
  /** Start date (ISO string) */
  startDate: string;
  
  /** End date (ISO string) */
  endDate: string;
  
  /** Initial capital in USD */
  initialCapitalUsd: number;
  
  /** Fee configuration */
  fees: {
    /** Maker fee percentage (e.g., 0.1 for 0.1%) */
    makerPct: number;
    /** Taker fee percentage (e.g., 0.1 for 0.1%) */
    takerPct: number;
  };
  
  /** Slippage configuration */
  slippage: {
    /** Enable slippage simulation */
    enabled: boolean;
    /** Maximum slippage percentage (e.g., 0.1 for 0.1%) */
    maxPct: number;
  };
  
  /** Risk settings override (optional) */
  riskSettingsOverride?: Partial<RiskSettings>;
  
  /** Bot settings override (optional) */
  botSettingsOverride?: Partial<BotSettingsForm>;
  
  /** Metadata */
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/**
 * Default backtest configuration
 */
export function getDefaultBacktestConfig(userId: string): Partial<BacktestConfig> {
  return {
    userId,
    strategyId: 'main-strategy',
    exchange: 'binance',
    marketType: 'spot',
    symbols: ['BTCUSDT'],
    timeframe: '1h',
    initialCapitalUsd: 10000,
    fees: {
      makerPct: 0.1, // 0.1% maker fee
      takerPct: 0.1  // 0.1% taker fee
    },
    slippage: {
      enabled: false,
      maxPct: 0.1 // 0.1% max slippage
    }
  };
}

/**
 * Validate backtest configuration
 */
export function validateBacktestConfig(config: Partial<BacktestConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.userId) {
    errors.push('userId is required');
  }
  
  if (!config.strategyId) {
    errors.push('strategyId is required');
  }
  
  if (!config.exchange || !['binance', 'okx'].includes(config.exchange)) {
    errors.push('exchange must be "binance" or "okx"');
  }
  
  if (!config.marketType || !['spot', 'futures'].includes(config.marketType)) {
    errors.push('marketType must be "spot" or "futures"');
  }
  
  if (!config.symbols || config.symbols.length === 0) {
    errors.push('At least one symbol is required');
  }
  
  if (!config.timeframe) {
    errors.push('timeframe is required');
  }
  
  if (!config.startDate) {
    errors.push('startDate is required');
  }
  
  if (!config.endDate) {
    errors.push('endDate is required');
  }
  
  if (config.startDate && config.endDate) {
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    
    if (isNaN(start.getTime())) {
      errors.push('startDate is invalid');
    }
    
    if (isNaN(end.getTime())) {
      errors.push('endDate is invalid');
    }
    
    if (start >= end) {
      errors.push('startDate must be before endDate');
    }
    
    // Check time range (max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRange) {
      errors.push('Time range cannot exceed 1 year');
    }
  }
  
  if (config.initialCapitalUsd !== undefined && config.initialCapitalUsd <= 0) {
    errors.push('initialCapitalUsd must be greater than 0');
  }
  
  if (config.fees) {
    if (config.fees.makerPct < 0 || config.fees.makerPct > 100) {
      errors.push('makerPct must be between 0 and 100');
    }
    
    if (config.fees.takerPct < 0 || config.fees.takerPct > 100) {
      errors.push('takerPct must be between 0 and 100');
    }
  }
  
  if (config.slippage) {
    if (config.slippage.enabled && (config.slippage.maxPct < 0 || config.slippage.maxPct > 100)) {
      errors.push('maxPct must be between 0 and 100');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

