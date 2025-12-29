-- Phase 1.5: Add source_mode and managed_by_bot to trades table
-- This allows tracking where trades originated from (auto_bot, manual_execute, manual_smart_trade, signal_execution)

-- Add source_mode column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trades' 
    AND column_name = 'source_mode'
  ) THEN
    ALTER TABLE public.trades 
    ADD COLUMN source_mode TEXT CHECK (source_mode IN ('auto_bot', 'manual_execute', 'manual_smart_trade', 'signal_execution'));
    
    -- Set default for existing rows
    UPDATE public.trades 
    SET source_mode = 'manual_execute' 
    WHERE source_mode IS NULL;
  END IF;
END $$;

-- Add managed_by_bot column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trades' 
    AND column_name = 'managed_by_bot'
  ) THEN
    ALTER TABLE public.trades 
    ADD COLUMN managed_by_bot BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add management_profile_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trades' 
    AND column_name = 'management_profile_id'
  ) THEN
    ALTER TABLE public.trades 
    ADD COLUMN management_profile_id UUID;
  END IF;
END $$;

-- Create index on source_mode for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_source_mode ON public.trades(source_mode);
CREATE INDEX IF NOT EXISTS idx_trades_managed_by_bot ON public.trades(managed_by_bot) WHERE managed_by_bot = true;

-- Add comment
COMMENT ON COLUMN public.trades.source_mode IS 'Origin of the trade: auto_bot, manual_execute, manual_smart_trade, or signal_execution';
COMMENT ON COLUMN public.trades.managed_by_bot IS 'Whether this trade is managed by the bot after opening';
COMMENT ON COLUMN public.trades.management_profile_id IS 'Reference to bot settings/strategy used for management';

