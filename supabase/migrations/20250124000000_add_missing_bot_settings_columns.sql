-- ============================================
-- Add Missing Bot Settings Columns
-- 
-- This migration adds columns that are used in the application
-- but might be missing from the database
-- ============================================

-- Add stop_loss_calculation_method if it doesn't exist
ALTER TABLE public.bot_settings 
ADD COLUMN IF NOT EXISTS stop_loss_calculation_method TEXT DEFAULT 'initial_entry';

-- Add constraint for stop_loss_calculation_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_stop_loss_calculation_method'
  ) THEN
    ALTER TABLE public.bot_settings 
    ADD CONSTRAINT check_stop_loss_calculation_method 
    CHECK (stop_loss_calculation_method IN ('initial_entry', 'average_position'));
  END IF;
END $$;

-- Note: The following columns are intentionally NOT added because they don't exist in the schema:
-- - auto_reentry_enabled
-- - capital_protection_enabled
-- - capital_protection_profit
-- - dynamic_tp_enabled
-- - min_profit_threshold
-- - partial_tp_level_1, partial_tp_level_2, etc.
-- - trailing_stop_distance, trailing_stop_activation
-- - max_daily_loss_usd, max_daily_loss_pct
-- - max_drawdown_pct
-- - max_exposure_pct_per_symbol, max_exposure_pct_total
-- - volatility_guard_enabled, volatility_guard_atr_multiplier
-- - kill_switch_enabled, kill_switch_cooldown_minutes
-- - sizing_mode
--
-- If these features are needed, they should be added via a separate migration
-- or stored in a JSONB settings column.

