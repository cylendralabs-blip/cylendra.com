/**
 * Signal Execution Status Enhancement
 * 
 * Adds execution tracking fields to tradingview_signals table
 * for Phase 3: Auto-Trading Trigger
 * 
 * IMPORTANT: This migration requires the tradingview_signals table to exist first.
 * Please ensure migration 20250626122717 has been applied.
 * 
 * If the table doesn't exist, this migration will skip gracefully.
 */

-- Check if table exists before modifying
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tradingview_signals'
  ) THEN
    RAISE EXCEPTION 'Table public.tradingview_signals does not exist. Please run migration 20250626122717 first to create the table.';
  END IF;
END $$;

-- Add execution status fields to tradingview_signals
-- (IF NOT EXISTS will prevent errors if columns already exist)
ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_status TEXT DEFAULT 'PENDING';

-- Add CHECK constraint separately (after column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'public' 
    AND table_name = 'tradingview_signals' 
    AND constraint_name LIKE '%execution_status%'
  ) THEN
    ALTER TABLE public.tradingview_signals
    ADD CONSTRAINT check_execution_status 
    CHECK (execution_status IN ('PENDING', 'FILTERED', 'EXECUTING', 'EXECUTED', 'FAILED', 'IGNORED'));
  END IF;
END $$;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_reason TEXT;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS executed_trade_id UUID 
  REFERENCES public.trades(id) ON DELETE SET NULL;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_attempts INTEGER DEFAULT 0;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_scheduled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tradingview_signals
ADD COLUMN IF NOT EXISTS execution_error TEXT;

-- Create index for faster queries on pending signals
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_execution_status 
  ON public.tradingview_signals(execution_status);

CREATE INDEX IF NOT EXISTS idx_tradingview_signals_execution_scheduled 
  ON public.tradingview_signals(execution_scheduled_at) 
  WHERE execution_status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_tradingview_signals_user_execution 
  ON public.tradingview_signals(user_id, execution_status) 
  WHERE execution_status IN ('PENDING', 'EXECUTING');

-- Function to update execution status
CREATE OR REPLACE FUNCTION update_signal_execution_status(
  signal_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL,
  trade_id UUID DEFAULT NULL,
  error_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tradingview_signals
  SET 
    execution_status = new_status,
    execution_reason = reason,
    executed_trade_id = trade_id,
    execution_error = error_text,
    execution_started_at = CASE 
      WHEN new_status = 'EXECUTING' AND execution_started_at IS NULL 
      THEN now() 
      ELSE execution_started_at 
    END,
    execution_completed_at = CASE 
      WHEN new_status IN ('EXECUTED', 'FAILED', 'FILTERED', 'IGNORED')
      THEN now()
      ELSE execution_completed_at
    END,
    execution_attempts = CASE
      WHEN new_status = 'EXECUTING'
      THEN execution_attempts + 1
      ELSE execution_attempts
    END,
    updated_at = now()
  WHERE id = signal_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset signal for retry
CREATE OR REPLACE FUNCTION reset_signal_for_retry(
  signal_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tradingview_signals
  SET 
    execution_status = 'PENDING',
    execution_reason = NULL,
    execution_error = NULL,
    execution_scheduled_at = COALESCE(scheduled_at, now() + interval '1 minute'),
    execution_started_at = NULL,
    execution_completed_at = NULL,
    updated_at = now()
  WHERE id = signal_id
    AND execution_status IN ('FAILED', 'FILTERED');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default execution_status for existing signals
UPDATE public.tradingview_signals
SET execution_status = CASE
  WHEN status = 'ACTIVE' THEN 'PENDING'
  WHEN status = 'TRIGGERED' THEN 'EXECUTED'
  WHEN status = 'EXPIRED' THEN 'IGNORED'
  WHEN status = 'CANCELLED' THEN 'IGNORED'
  ELSE 'PENDING'
END
WHERE execution_status IS NULL;
