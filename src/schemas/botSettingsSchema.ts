
/**
 * @deprecated This file is deprecated. 
 * Use @/core/config instead: import { botSettingsSchema } from '@/core/config';
 * 
 * This file is kept for backward compatibility only.
 * Will be removed in Phase 2.
 */

import { z } from 'zod';

// Re-export from core/config for backward compatibility
export { botSettingsSchema } from '@/core/config';

// Keep old export for backward compatibility
const _botSettingsSchema = z.object({
  is_active: z.boolean(),
  bot_name: z.string().min(1, 'Bot name is required'),
  default_platform: z.string().min(1, 'Default platform is required'),
  market_type: z.enum(['spot', 'futures']),
  strategy_type: z.enum(['basic_dca', 'dca_with_leverage_new', 'dca_with_leverage_modify']),
  total_capital: z.number().min(1, 'Capital must be greater than 0'),
  risk_percentage: z.number().min(0.1).max(100),
  initial_order_percentage: z.number().min(1).max(100),
  max_active_trades: z.number().min(1).max(50),
  dca_levels: z.number().min(1).max(20),
  take_profit_percentage: z.number().min(0.1),
  stop_loss_percentage: z.number().min(0.1),
  stop_loss_calculation_method: z.enum(['initial_entry', 'average_position']),
  risk_reward_ratio: z.number().min(0.1),
  leverage: z.number().min(1).max(125),
  leverage_strategy: z.enum(['none', 'auto', 'manual']),
  auto_leverage: z.boolean(),
  max_leverage_increase: z.number().min(1).max(10),
  profit_taking_strategy: z.enum(['fixed', 'trailing', 'partial', 'custom']),
  order_type: z.enum(['market', 'limit']),
  default_trade_direction: z.enum(['long', 'short', 'both']),
  allow_short_trades: z.boolean(),
  allow_long_trades: z.boolean(),
  // إعدادات جني الأرباح المتقدمة
  partial_tp_level_1: z.number().min(0.1).max(100),
  partial_tp_level_2: z.number().min(0.1).max(100),
  partial_tp_level_3: z.number().min(0.1).max(100),
  partial_tp_level_4: z.number().min(0.1).max(100),
  partial_tp_percentage_1: z.number().min(10).max(100),
  partial_tp_percentage_2: z.number().min(10).max(100),
  partial_tp_percentage_3: z.number().min(10).max(100),
  partial_tp_percentage_4: z.number().min(10).max(100),
  trailing_stop_distance: z.number().min(0.1).max(10),
  trailing_stop_activation: z.number().min(0.1).max(20),
  capital_protection_enabled: z.boolean(),
  capital_protection_profit: z.number().min(1).max(20),
  auto_reentry_enabled: z.boolean(),
  dynamic_tp_enabled: z.boolean(),
  min_profit_threshold: z.number().min(0.1).max(10),
});
