/**
 * @deprecated This file is deprecated. 
 * Use @/core/config instead: import { defaultBotSettings } from '@/core/config';
 * 
 * This file is kept for backward compatibility only.
 * Will be removed in Phase 2.
 */

// Re-export from core/config for backward compatibility
export { defaultBotSettings } from '@/core/config';

import { BotSettingsForm } from '@/types/botSettings';

// Keep old export for backward compatibility (will be removed)
const _defaultBotSettings: BotSettingsForm = {
  is_active: false,
  bot_name: 'SmartTraderBot',
  default_platform: '',
  market_type: 'spot',
  strategy_type: 'basic_dca',
  total_capital: 1000,
  risk_percentage: 2.0,
  initial_order_percentage: 25.0,
  max_active_trades: 5,
  dca_levels: 5,
  take_profit_percentage: 3.0,
  stop_loss_percentage: 5.0,
  stop_loss_calculation_method: 'initial_entry',
  risk_reward_ratio: 2.0,
  leverage: 1,
  leverage_strategy: 'none',
  auto_leverage: false,
  max_leverage_increase: 3.0,
  profit_taking_strategy: 'fixed',
  order_type: 'market',
  default_trade_direction: 'long',
  allow_short_trades: true,
  allow_long_trades: true,
  // إعدادات جني الأرباح المتقدمة
  partial_tp_level_1: 2.0,
  partial_tp_level_2: 4.0,
  partial_tp_level_3: 6.0,
  partial_tp_level_4: 10.0,
  partial_tp_percentage_1: 25,
  partial_tp_percentage_2: 25,
  partial_tp_percentage_3: 25,
  partial_tp_percentage_4: 25,
  trailing_stop_distance: 2.0,
  trailing_stop_activation: 3.0,
  capital_protection_enabled: false,
  capital_protection_profit: 5.0,
  auto_reentry_enabled: false,
  dynamic_tp_enabled: false,
  min_profit_threshold: 1.0,
};

export const mapSettingsToFormData = (settings: any): BotSettingsForm => {
  return {
    is_active: settings.is_active || false,
    bot_name: settings.bot_name || 'SmartTraderBot',
    default_platform: settings.default_platform || '',
    market_type: (settings.market_type as 'spot' | 'futures') || 'spot',
    strategy_type: (settings.strategy_type as 'basic_dca' | 'dca_with_leverage_new' | 'dca_with_leverage_modify') || 'basic_dca',
    total_capital: Number(settings.total_capital) || 1000,
    risk_percentage: Number(settings.risk_percentage) || 2.0,
    initial_order_percentage: Number(settings.initial_order_percentage) || 25.0,
    max_active_trades: settings.max_active_trades || 5,
    dca_levels: settings.dca_levels || 5,
    take_profit_percentage: Number(settings.take_profit_percentage) || 3.0,
    stop_loss_percentage: Number(settings.stop_loss_percentage) || 5.0,
    stop_loss_calculation_method: ((settings as any).stop_loss_calculation_method as 'initial_entry' | 'average_position') || 'initial_entry',
    risk_reward_ratio: Number(settings.risk_reward_ratio) || 2.0,
    leverage: settings.leverage || 1,
    leverage_strategy: (settings.leverage_strategy as 'none' | 'auto' | 'manual') || 'none',
    auto_leverage: settings.auto_leverage || false,
    max_leverage_increase: Number(settings.max_leverage_increase) || 3.0,
    profit_taking_strategy: (settings.profit_taking_strategy as 'fixed' | 'trailing' | 'partial' | 'custom') || 'fixed',
    order_type: (settings.order_type as 'market' | 'limit') || 'market',
    default_trade_direction: (settings.default_trade_direction as 'long' | 'short' | 'both') || 'long',
    allow_short_trades: settings.allow_short_trades !== false,
    allow_long_trades: settings.allow_long_trades !== false,
    // إعدادات جني الأرباح المتقدمة with safe property access
    partial_tp_level_1: Number((settings as any).partial_tp_level_1) || 2.0,
    partial_tp_level_2: Number((settings as any).partial_tp_level_2) || 4.0,
    partial_tp_level_3: Number((settings as any).partial_tp_level_3) || 6.0,
    partial_tp_level_4: Number((settings as any).partial_tp_level_4) || 10.0,
    partial_tp_percentage_1: Number((settings as any).partial_tp_percentage_1) || 25,
    partial_tp_percentage_2: Number((settings as any).partial_tp_percentage_2) || 25,
    partial_tp_percentage_3: Number((settings as any).partial_tp_percentage_3) || 25,
    partial_tp_percentage_4: Number((settings as any).partial_tp_percentage_4) || 25,
    trailing_stop_distance: Number((settings as any).trailing_stop_distance) || 2.0,
    trailing_stop_activation: Number((settings as any).trailing_stop_activation) || 3.0,
    capital_protection_enabled: (settings as any).capital_protection_enabled || false,
    capital_protection_profit: Number((settings as any).capital_protection_profit) || 5.0,
    auto_reentry_enabled: (settings as any).auto_reentry_enabled || false,
    dynamic_tp_enabled: (settings as any).dynamic_tp_enabled || false,
    min_profit_threshold: Number((settings as any).min_profit_threshold) || 1.0,
    
    // Phase X: Auto Trading from Signals
    auto_trading_enabled: (settings as any).auto_trading_enabled || false,
    auto_trading_mode: ((settings as any).auto_trading_mode as 'off' | 'full_auto' | 'semi_auto') || 'off',
    allowed_signal_sources: Array.isArray((settings as any).allowed_signal_sources)
      ? (settings as any).allowed_signal_sources
      : [],
    min_signal_confidence: (settings as any).min_signal_confidence ? Number((settings as any).min_signal_confidence) : null,
    allowed_directions: Array.isArray((settings as any).allowed_directions)
      ? (settings as any).allowed_directions
      : ['long', 'short'],
    max_auto_trades_per_day: (settings as any).max_auto_trades_per_day ? Number((settings as any).max_auto_trades_per_day) : null,
    max_concurrent_auto_positions: (settings as any).max_concurrent_auto_positions ? Number((settings as any).max_concurrent_auto_positions) : null,
    auto_trading_notes: (settings as any).auto_trading_notes || undefined,
  };
};
