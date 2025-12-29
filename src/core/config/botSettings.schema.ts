/**
 * Core Bot Settings Schema
 *
 * هذا الملف يحتوي على Schema موحدة لإعدادات البوت
 * يجمع بين botSettingsSchema.ts و botSettingsDefaults.ts
 *
 * Phase 1 Refactor: Strategy System Integration
 * - Added strategy_instance_id (new system)
 * - Kept strategy_type (backward compatibility - will be deprecated)
 */

import { z } from 'zod';

/**
 * Zod Schema لإعدادات البوت
 * يستخدم للتحقق من صحة البيانات قبل الحفظ
 */
export const botSettingsSchema = z.object({
  // إعدادات أساسية
  is_active: z.boolean(),
  bot_name: z.string().min(1, 'Bot name is required'),
  default_platform: z.string().optional().or(z.literal('')),
  market_type: z.enum(['spot', 'futures']),

  // Strategy System (Phase 2)
  strategy_instance_id: z.string().uuid().optional(), // NEW: Link to strategy_instances table (will be required in future)
  strategy_type: z.enum(['basic_dca', 'dca_with_leverage_new', 'dca_with_leverage_modify']).optional(), // DEPRECATED: For backward compatibility only

  // Bot Status (Phase 2)
  status: z.enum(['STOPPED', 'RUNNING', 'PAUSED', 'ERROR']).optional().default('STOPPED'),

  signal_source: z.enum(['ai', 'tradingview', 'legacy', 'realtime_ai']),
  
  // إعدادات رأس المال والمخاطرة
  total_capital: z.number().min(1, 'Capital must be greater than 0'),
  risk_percentage: z.number().min(0.1).max(100),
  initial_order_percentage: z.number().min(1).max(100),
  max_active_trades: z.number().min(1).max(50),
  
  // إعدادات DCA
  dca_levels: z.number().min(1).max(20),
  
  // إعدادات Stop Loss & Take Profit
  take_profit_percentage: z.number().min(0.1),
  stop_loss_percentage: z.number().min(0.1),
  stop_loss_calculation_method: z.enum(['initial_entry', 'average_position']),
  risk_reward_ratio: z.number().min(0.1),
  
  // إعدادات الرافعة المالية (Leverage)
  leverage: z.number().min(1).max(125),
  leverage_strategy: z.enum(['none', 'auto', 'manual']),
  auto_leverage: z.boolean(),
  max_leverage_increase: z.number().min(1).max(10),
  
  // إعدادات جني الأرباح
  profit_taking_strategy: z.enum(['fixed', 'trailing', 'partial', 'custom']),
  order_type: z.enum(['market', 'limit']),
  
  // إعدادات اتجاه التداول
  default_trade_direction: z.enum(['long', 'short', 'both']),
  allow_short_trades: z.boolean(),
  allow_long_trades: z.boolean(),
  
  // إعدادات جني الأرباح المتقدمة (Partial TP)
  partial_tp_level_1: z.number().min(0.1).max(100),
  partial_tp_level_2: z.number().min(0.1).max(100),
  partial_tp_level_3: z.number().min(0.1).max(100),
  partial_tp_level_4: z.number().min(0.1).max(100),
  partial_tp_percentage_1: z.number().min(10).max(100),
  partial_tp_percentage_2: z.number().min(10).max(100),
  partial_tp_percentage_3: z.number().min(10).max(100),
  partial_tp_percentage_4: z.number().min(10).max(100),
  
  // إعدادات Trailing Stop
  trailing_stop_distance: z.number().min(0.1).max(10),
  trailing_stop_activation: z.number().min(0.1).max(20),
  
  // إعدادات حماية رأس المال
  capital_protection_enabled: z.boolean(),
  capital_protection_profit: z.number().min(1).max(20),
  
  // إعدادات إضافية
  auto_reentry_enabled: z.boolean(),
  dynamic_tp_enabled: z.boolean(),
  min_profit_threshold: z.number().min(0.1).max(10),
  
  // Phase 5: Advanced Risk Management Settings
  // Daily Loss Limits
  max_daily_loss_usd: z.number().min(0).optional(),
  max_daily_loss_pct: z.number().min(0).max(100).optional(),
  
  // Drawdown Limits
  max_drawdown_pct: z.number().min(0).max(100).optional(),
  
  // Exposure Limits
  max_exposure_pct_per_symbol: z.number().min(0).max(100).optional(),
  max_exposure_pct_total: z.number().min(0).max(100).optional(),
  
  // Volatility Guard
  volatility_guard_enabled: z.boolean().optional(),
  volatility_guard_atr_multiplier: z.number().min(1).max(10).optional(),
  
  // Kill Switch
  kill_switch_enabled: z.boolean().optional(),
  kill_switch_cooldown_minutes: z.number().min(0).max(1440).optional(),
  
  // Dynamic Sizing
  sizing_mode: z.enum(['fixed', 'risk_based', 'volatility_adjusted']).optional(),
  
  // Phase X: Auto Trading from Signals
  auto_trading_enabled: z.boolean().default(false),
  auto_trading_mode: z.enum(['off', 'full_auto', 'semi_auto']).default('off'),
  allowed_signal_sources: z.array(z.enum(['ai_ultra', 'ai_realtime', 'tradingview', 'legacy'])).default([]),
  min_signal_confidence: z.number().min(0).max(100).nullable().optional(),
  allowed_directions: z.array(z.enum(['long', 'short'])).default(['long', 'short']),
  max_auto_trades_per_day: z.number().min(0).nullable().optional(),
  max_concurrent_auto_positions: z.number().min(0).nullable().optional(),
  auto_trading_notes: z.string().optional(),
});

/**
 * TypeScript Type من Zod Schema
 */
export type BotSettingsForm = z.infer<typeof botSettingsSchema>;

/**
 * Helper function للتحقق من صحة الإعدادات
 */
export function validateBotSettings(data: unknown): {
  success: boolean;
  data?: BotSettingsForm;
  error?: z.ZodError;
} {
  const result = botSettingsSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}


