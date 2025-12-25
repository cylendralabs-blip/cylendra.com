/**
 * Core Bot Settings Defaults
 * 
 * هذا الملف يحتوي على القيم الافتراضية لإعدادات البوت
 * 
 * Phase 1: توحيد الإعدادات
 */

import { BotSettingsForm } from './botSettings.schema';

/**
 * القيم الافتراضية لإعدادات البوت
 */
export const defaultBotSettings: BotSettingsForm = {
  // إعدادات أساسية
  is_active: false,
  bot_name: 'SmartTraderBot',
  default_platform: '',
  market_type: 'spot',

  // Phase 2: Strategy System Integration
  strategy_instance_id: undefined, // No strategy selected by default
  strategy_type: 'basic_dca', // DEPRECATED: For backward compatibility

  signal_source: 'ai',
  
  // إعدادات رأس المال والمخاطرة
  total_capital: 1000,
  risk_percentage: 2.0,
  initial_order_percentage: 25.0,
  max_active_trades: 5,
  
  // إعدادات DCA
  dca_levels: 5,
  
  // إعدادات Stop Loss & Take Profit
  take_profit_percentage: 3.0,
  stop_loss_percentage: 5.0,
  stop_loss_calculation_method: 'initial_entry',
  risk_reward_ratio: 2.0,
  
  // إعدادات الرافعة المالية
  leverage: 1,
  leverage_strategy: 'none',
  auto_leverage: false,
  max_leverage_increase: 3.0,
  
  // إعدادات جني الأرباح
  profit_taking_strategy: 'fixed',
  order_type: 'market',
  
  // إعدادات اتجاه التداول
  default_trade_direction: 'long',
  allow_short_trades: true,
  allow_long_trades: true,
  
  // إعدادات جني الأرباح المتقدمة (Partial TP)
  partial_tp_level_1: 2.0,
  partial_tp_level_2: 4.0,
  partial_tp_level_3: 6.0,
  partial_tp_level_4: 10.0,
  partial_tp_percentage_1: 25,
  partial_tp_percentage_2: 25,
  partial_tp_percentage_3: 25,
  partial_tp_percentage_4: 25,
  
  // إعدادات Trailing Stop
  trailing_stop_distance: 2.0,
  trailing_stop_activation: 3.0,
  
  // إعدادات حماية رأس المال
  capital_protection_enabled: false,
  capital_protection_profit: 5.0,
  
  // إعدادات إضافية
  auto_reentry_enabled: false,
  dynamic_tp_enabled: false,
  min_profit_threshold: 1.0,
  
  // Phase 5: Advanced Risk Management Settings (defaults)
  // Daily Loss Limits
  max_daily_loss_usd: undefined,
  max_daily_loss_pct: 5.0, // 5% default
  
  // Drawdown Limits
  max_drawdown_pct: 20.0, // 20% default
  
  // Exposure Limits
  max_exposure_pct_per_symbol: 30.0, // 30% per symbol default
  max_exposure_pct_total: 80.0, // 80% total exposure default
  
  // Volatility Guard
  volatility_guard_enabled: true, // Enabled by default
  volatility_guard_atr_multiplier: 3.0, // 3x ATR default
  
  // Kill Switch
  kill_switch_enabled: true, // Enabled by default
  kill_switch_cooldown_minutes: 60, // 1 hour default
  
  // Dynamic Sizing
  sizing_mode: 'risk_based' as 'fixed' | 'risk_based' | 'volatility_adjusted',
  
  // Phase X: Auto Trading from Signals (defaults - all disabled for safety)
  auto_trading_enabled: false,
  auto_trading_mode: 'off',
  allowed_signal_sources: [],
  min_signal_confidence: null,
  allowed_directions: ['long', 'short'],
  max_auto_trades_per_day: null,
  max_concurrent_auto_positions: null,
  auto_trading_notes: undefined,
};

/**
 * تحويل بيانات قاعدة البيانات إلى BotSettingsForm
 * 
 * @param settings - البيانات من قاعدة البيانات
 * @returns BotSettingsForm
 */
export function mapSettingsToFormData(settings: any): BotSettingsForm {
  return {
    is_active: settings.is_active || false,
    bot_name: settings.bot_name || 'SmartTraderBot',
    // Preserve default_platform: convert null/undefined to empty string for form, but keep actual value if exists
    default_platform: (settings.default_platform != null && settings.default_platform !== '')
      ? String(settings.default_platform)
      : '',
    market_type: (settings.market_type as 'spot' | 'futures') || 'spot',

    // Phase 2: Strategy System Integration
    strategy_instance_id: settings.strategy_instance_id || undefined, // Link to strategy_instances table
    strategy_type: (settings.strategy_type as 'basic_dca' | 'dca_with_leverage_new' | 'dca_with_leverage_modify') || 'basic_dca',

    signal_source: (settings.signal_source as 'ai' | 'tradingview' | 'legacy') || 'ai',
    total_capital: Number(settings.total_capital) || 1000,
    risk_percentage: Number(settings.risk_percentage) || 2.0,
    initial_order_percentage: Number(settings.initial_order_percentage) || 25.0,
    max_active_trades: settings.max_active_trades || 5,
    dca_levels: settings.dca_levels || 5,
    take_profit_percentage: Number(settings.take_profit_percentage) || 3.0,
    stop_loss_percentage: Number(settings.stop_loss_percentage) || 5.0,
    stop_loss_calculation_method: (settings.stop_loss_calculation_method as 'initial_entry' | 'average_position') || 'initial_entry',
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
    partial_tp_level_1: Number(settings.partial_tp_level_1) || 2.0,
    partial_tp_level_2: Number(settings.partial_tp_level_2) || 4.0,
    partial_tp_level_3: Number(settings.partial_tp_level_3) || 6.0,
    partial_tp_level_4: Number(settings.partial_tp_level_4) || 10.0,
    partial_tp_percentage_1: Number(settings.partial_tp_percentage_1) || 25,
    partial_tp_percentage_2: Number(settings.partial_tp_percentage_2) || 25,
    partial_tp_percentage_3: Number(settings.partial_tp_percentage_3) || 25,
    partial_tp_percentage_4: Number(settings.partial_tp_percentage_4) || 25,
    trailing_stop_distance: Number(settings.trailing_stop_distance) || 2.0,
    trailing_stop_activation: Number(settings.trailing_stop_activation) || 3.0,
    capital_protection_enabled: settings.capital_protection_enabled || false,
    capital_protection_profit: Number(settings.capital_protection_profit) || 5.0,
    auto_reentry_enabled: settings.auto_reentry_enabled || false,
    dynamic_tp_enabled: settings.dynamic_tp_enabled || false,
    min_profit_threshold: Number(settings.min_profit_threshold) || 1.0,
    
    // Phase 5: Advanced Risk Management Settings
    max_daily_loss_usd: settings.max_daily_loss_usd ? Number(settings.max_daily_loss_usd) : undefined,
    max_daily_loss_pct: settings.max_daily_loss_pct ? Number(settings.max_daily_loss_pct) : 5.0,
    max_drawdown_pct: settings.max_drawdown_pct ? Number(settings.max_drawdown_pct) : 20.0,
    max_exposure_pct_per_symbol: settings.max_exposure_pct_per_symbol ? Number(settings.max_exposure_pct_per_symbol) : 30.0,
    max_exposure_pct_total: settings.max_exposure_pct_total ? Number(settings.max_exposure_pct_total) : 80.0,
    volatility_guard_enabled: settings.volatility_guard_enabled !== false,
    volatility_guard_atr_multiplier: settings.volatility_guard_atr_multiplier ? Number(settings.volatility_guard_atr_multiplier) : 3.0,
    kill_switch_enabled: settings.kill_switch_enabled !== false,
    kill_switch_cooldown_minutes: settings.kill_switch_cooldown_minutes ? Number(settings.kill_switch_cooldown_minutes) : 60,
    sizing_mode: (settings.sizing_mode as 'fixed' | 'risk_based' | 'volatility_adjusted') || 'risk_based',
    
    // Phase X: Auto Trading from Signals
    auto_trading_enabled: settings.auto_trading_enabled || false,
    auto_trading_mode: (settings.auto_trading_mode as 'off' | 'full_auto' | 'semi_auto') || 'off',
    allowed_signal_sources: Array.isArray(settings.allowed_signal_sources) 
      ? (settings.allowed_signal_sources as ('ai_ultra' | 'ai_realtime' | 'tradingview' | 'legacy')[])
      : [],
    min_signal_confidence: settings.min_signal_confidence ? Number(settings.min_signal_confidence) : null,
    allowed_directions: Array.isArray(settings.allowed_directions) 
      ? (settings.allowed_directions as ('long' | 'short')[])
      : ['long', 'short'],
    max_auto_trades_per_day: settings.max_auto_trades_per_day ? Number(settings.max_auto_trades_per_day) : null,
    max_concurrent_auto_positions: settings.max_concurrent_auto_positions ? Number(settings.max_concurrent_auto_positions) : null,
    auto_trading_notes: settings.auto_trading_notes || undefined,
  };
}

/**
 * Export unified configuration
 */
export { botSettingsSchema } from './botSettings.schema';
export type { BotSettingsForm } from './botSettings.schema';


