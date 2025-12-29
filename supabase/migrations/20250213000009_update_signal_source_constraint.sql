-- Update signal_source constraint to include 'realtime_ai'
-- This allows the frontend to use 'realtime_ai' as a signal source option

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bot_settings_signal_source_check'
  ) THEN
    ALTER TABLE public.bot_settings
    DROP CONSTRAINT bot_settings_signal_source_check;
  END IF;
  
  -- Add new constraint with 'realtime_ai' included
  ALTER TABLE public.bot_settings
  ADD CONSTRAINT bot_settings_signal_source_check
  CHECK (signal_source IN ('ai', 'realtime_ai', 'tradingview', 'legacy'));
END $$;

