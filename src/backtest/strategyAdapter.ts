/**
 * Backtest Strategy Adapter
 * 
 * Converts bot profile/settings to strategy parameters
 * Ensures strategy rules in Backtest === rules in real bot
 * 
 * Phase 1: Backtest Engine - Task 2
 */

import { BotSettingsForm } from '@/core/config';
import { BacktestEngineConfig } from './backtestEngine';
import { defaultBotSettings } from '@/core/config/defaults';
import { BINANCE_FEES, OKX_FEES } from './feeModel';
import { DEFAULT_SLIPPAGE } from './slippageModel';

/**
 * Bot Profile (simplified - can be extended)
 */
export interface BotProfile {
  /** Bot settings */
  botSettings: BotSettingsForm;
  
  /** Strategy ID */
  strategyId?: string;
  
  /** Exchange */
  exchange?: 'binance' | 'okx';
  
  /** Market type */
  marketType?: 'spot' | 'futures';
}

/**
 * Strategy Preset
 */
export interface StrategyPreset {
  /** Preset ID */
  id: string;
  
  /** Preset name */
  name: string;
  
  /** Bot settings for this preset */
  botSettings: Partial<BotSettingsForm>;
  
  /** Exchange */
  exchange?: 'binance' | 'okx';
  
  /** Market type */
  marketType?: 'spot' | 'futures';
}

/**
 * Convert bot profile to backtest engine config
 * 
 * @param profile - Bot profile
 * @param pair - Trading pair
 * @param timeframe - Timeframe
 * @param periodFrom - Start date
 * @param periodTo - End date
 * @param initialCapital - Initial capital
 * @returns Backtest engine configuration
 */
export function adaptBotProfileToBacktestConfig(
  profile: BotProfile,
  pair: string,
  timeframe: string,
  periodFrom: string | number,
  periodTo: string | number,
  initialCapital: number
): BacktestEngineConfig {
  // Merge bot settings with defaults
  const botSettings: BotSettingsForm = {
    ...defaultBotSettings,
    ...profile.botSettings
  };
  
  // Determine exchange
  const exchange = profile.exchange || 'binance';
  
  // Determine market type
  const marketType = profile.marketType || 'spot';
  
  // Get fees based on exchange
  const fees = exchange === 'okx' ? OKX_FEES : BINANCE_FEES;
  
  // Slippage configuration (can be customized)
  const slippage = DEFAULT_SLIPPAGE;
  
  return {
    pair,
    timeframe,
    periodFrom,
    periodTo,
    exchange,
    marketType,
    initialCapital,
    botSettings,
    fees,
    slippage,
    strategyId: profile.strategyId || 'main-strategy'
  };
}

/**
 * Convert strategy preset to backtest engine config
 * 
 * @param preset - Strategy preset
 * @param pair - Trading pair
 * @param timeframe - Timeframe
 * @param periodFrom - Start date
 * @param periodTo - End date
 * @param initialCapital - Initial capital
 * @returns Backtest engine configuration
 */
export function adaptStrategyPresetToBacktestConfig(
  preset: StrategyPreset,
  pair: string,
  timeframe: string,
  periodFrom: string | number,
  periodTo: string | number,
  initialCapital: number
): BacktestEngineConfig {
  // Merge preset settings with defaults
  const botSettings: BotSettingsForm = {
    ...defaultBotSettings,
    ...preset.botSettings
  };
  
  // Determine exchange
  const exchange = preset.exchange || 'binance';
  
  // Determine market type
  const marketType = preset.marketType || 'spot';
  
  // Get fees based on exchange
  const fees = exchange === 'okx' ? OKX_FEES : BINANCE_FEES;
  
  // Slippage configuration
  const slippage = DEFAULT_SLIPPAGE;
  
  return {
    pair,
    timeframe,
    periodFrom,
    periodTo,
    exchange,
    marketType,
    initialCapital,
    botSettings,
    fees,
    slippage,
    strategyId: preset.id
  };
}

/**
 * Validate bot settings for backtest
 * 
 * @param botSettings - Bot settings to validate
 * @returns Validation result
 */
export function validateBotSettingsForBacktest(
  botSettings: Partial<BotSettingsForm>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!botSettings.total_capital || botSettings.total_capital <= 0) {
    errors.push('total_capital must be greater than 0');
  }
  
  if (botSettings.risk_percentage !== undefined) {
    if (botSettings.risk_percentage < 0.1 || botSettings.risk_percentage > 100) {
      errors.push('risk_percentage must be between 0.1 and 100');
    }
  }
  
  if (botSettings.initial_order_percentage !== undefined) {
    if (botSettings.initial_order_percentage < 1 || botSettings.initial_order_percentage > 100) {
      errors.push('initial_order_percentage must be between 1 and 100');
    }
  }
  
  if (botSettings.dca_levels !== undefined) {
    if (botSettings.dca_levels < 0 || botSettings.dca_levels > 20) {
      errors.push('dca_levels must be between 0 and 20');
    }
  }
  
  if (botSettings.stop_loss_percentage !== undefined) {
    if (botSettings.stop_loss_percentage < 0.1) {
      errors.push('stop_loss_percentage must be at least 0.1');
    }
  }
  
  if (botSettings.take_profit_percentage !== undefined) {
    if (botSettings.take_profit_percentage < 0.1) {
      errors.push('take_profit_percentage must be at least 0.1');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default strategy presets
 * 
 * @returns Array of default strategy presets
 */
export function getDefaultStrategyPresets(): StrategyPreset[] {
  return [
    {
      id: 'conservative',
      name: 'Conservative Strategy',
      botSettings: {
        risk_percentage: 1,
        initial_order_percentage: 30,
        dca_levels: 3,
        stop_loss_percentage: 3,
        take_profit_percentage: 6,
        max_active_trades: 3
      },
      exchange: 'binance',
      marketType: 'spot'
    },
    {
      id: 'moderate',
      name: 'Moderate Strategy',
      botSettings: {
        risk_percentage: 2,
        initial_order_percentage: 25,
        dca_levels: 5,
        stop_loss_percentage: 5,
        take_profit_percentage: 10,
        max_active_trades: 5
      },
      exchange: 'binance',
      marketType: 'spot'
    },
    {
      id: 'aggressive',
      name: 'Aggressive Strategy',
      botSettings: {
        risk_percentage: 3,
        initial_order_percentage: 20,
        dca_levels: 7,
        stop_loss_percentage: 7,
        take_profit_percentage: 15,
        max_active_trades: 7
      },
      exchange: 'binance',
      marketType: 'spot'
    }
  ];
}

