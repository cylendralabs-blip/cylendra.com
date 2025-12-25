
/**
 * BotSettingsForm Type
 * 
 * @deprecated This interface is kept for backward compatibility only.
 * Use @/core/config instead: import type { BotSettingsForm } from '@/core/config';
 * 
 * Phase 1: توحيد الإعدادات - سيتم إزالة هذا الملف في Phase 2
 */

// Re-export from core/config for backward compatibility
export type { BotSettingsForm } from '@/core/config';

// Keep old interface for backward compatibility (will be removed in Phase 2)
interface _BotSettingsForm {
  is_active: boolean;
  bot_name: string;
  default_platform: string;
  market_type: 'spot' | 'futures';
  strategy_type: 'basic_dca' | 'dca_with_leverage_new' | 'dca_with_leverage_modify';
  total_capital: number;
  risk_percentage: number;
  initial_order_percentage: number;
  max_active_trades: number;
  dca_levels: number;
  take_profit_percentage: number;
  stop_loss_percentage: number;
  stop_loss_calculation_method: 'initial_entry' | 'average_position';
  risk_reward_ratio: number;
  leverage: number;
  leverage_strategy: 'none' | 'auto' | 'manual';
  auto_leverage: boolean;
  max_leverage_increase: number;
  profit_taking_strategy: 'fixed' | 'trailing' | 'partial' | 'custom';
  order_type: 'market' | 'limit';
  default_trade_direction: 'long' | 'short' | 'both';
  allow_short_trades: boolean;
  allow_long_trades: boolean;
  // إعدادات جني الأرباح المتقدمة
  partial_tp_level_1: number;
  partial_tp_level_2: number;
  partial_tp_level_3: number;
  partial_tp_level_4: number;
  partial_tp_percentage_1: number;
  partial_tp_percentage_2: number;
  partial_tp_percentage_3: number;
  partial_tp_percentage_4: number;
  trailing_stop_distance: number;
  trailing_stop_activation: number;
  capital_protection_enabled: boolean;
  capital_protection_profit: number;
  auto_reentry_enabled: boolean;
  dynamic_tp_enabled: boolean;
  min_profit_threshold: number;
}
