-- Phase Y: Auto Trading Logging System
-- Create tables for comprehensive auto trading logging and history

-- ============================================
-- Table: auto_trades
-- Permanent historical record of every auto-trade decision
-- ============================================
CREATE TABLE IF NOT EXISTS public.auto_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_id UUID,
  signal_id TEXT,
  signal_source TEXT NOT NULL,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected', 'error', 'pending')),
  reason_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE,
  position_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'auto_trades_user_id_fkey'
  ) THEN
    ALTER TABLE public.auto_trades
    ADD CONSTRAINT auto_trades_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for auto_trades
CREATE INDEX IF NOT EXISTS idx_auto_trades_user_created 
  ON public.auto_trades(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_trades_signal_id 
  ON public.auto_trades(signal_id) WHERE signal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auto_trades_status 
  ON public.auto_trades(status);

CREATE INDEX IF NOT EXISTS idx_auto_trades_pair 
  ON public.auto_trades(pair);

CREATE INDEX IF NOT EXISTS idx_auto_trades_signal_source 
  ON public.auto_trades(signal_source);

CREATE INDEX IF NOT EXISTS idx_auto_trades_created_at 
  ON public.auto_trades(created_at DESC);

-- ============================================
-- Table: auto_trade_logs
-- Detailed timeline logs for every auto trade
-- ============================================
CREATE TABLE IF NOT EXISTS public.auto_trade_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_trade_id UUID NOT NULL,
  step TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'auto_trade_logs_auto_trade_id_fkey'
  ) THEN
    ALTER TABLE public.auto_trade_logs
    ADD CONSTRAINT auto_trade_logs_auto_trade_id_fkey 
    FOREIGN KEY (auto_trade_id) REFERENCES public.auto_trades(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for auto_trade_logs
CREATE INDEX IF NOT EXISTS idx_auto_trade_logs_auto_trade_id 
  ON public.auto_trade_logs(auto_trade_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_auto_trade_logs_step 
  ON public.auto_trade_logs(step);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.auto_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_trade_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own auto trades
DROP POLICY IF EXISTS "Users can view their own auto trades" ON public.auto_trades;
CREATE POLICY "Users can view their own auto trades"
  ON public.auto_trades
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own auto trades (via service role in worker)
DROP POLICY IF EXISTS "Users can insert their own auto trades" ON public.auto_trades;
CREATE POLICY "Users can insert their own auto trades"
  ON public.auto_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own auto trades
DROP POLICY IF EXISTS "Users can update their own auto trades" ON public.auto_trades;
CREATE POLICY "Users can update their own auto trades"
  ON public.auto_trades
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can view logs for their own auto trades
DROP POLICY IF EXISTS "Users can view their own auto trade logs" ON public.auto_trade_logs;
CREATE POLICY "Users can view their own auto trade logs"
  ON public.auto_trade_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auto_trades 
      WHERE auto_trades.id = auto_trade_logs.auto_trade_id 
      AND auto_trades.user_id = auth.uid()
    )
  );

-- Policy: Service role can insert logs (via worker)
DROP POLICY IF EXISTS "Service role can insert auto trade logs" ON public.auto_trade_logs;
CREATE POLICY "Service role can insert auto trade logs"
  ON public.auto_trade_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Functions
-- ============================================

-- Function: Get auto trades count for today
CREATE OR REPLACE FUNCTION public.get_auto_trades_count_today(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.auto_trades
  WHERE user_id = p_user_id
    AND status = 'accepted'
    AND created_at >= CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function: Get concurrent auto positions count
CREATE OR REPLACE FUNCTION public.get_concurrent_auto_positions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.auto_trades
  WHERE user_id = p_user_id
    AND status = 'accepted'
    AND executed_at IS NOT NULL
    AND position_id IS NOT NULL;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.auto_trades IS 'Permanent historical record of every auto-trade decision';
COMMENT ON TABLE public.auto_trade_logs IS 'Detailed timeline logs for every auto trade decision';
COMMENT ON COLUMN public.auto_trades.signal_source IS 'Source of the signal: ai_ultra, ai_realtime, tradingview, legacy';
COMMENT ON COLUMN public.auto_trades.reason_code IS 'Reason code for rejection/error: SOURCE_NOT_ALLOWED, DIRECTION_NOT_ALLOWED, LOW_CONFIDENCE, MAX_AUTO_TRADES_PER_DAY, MAX_CONCURRENT_AUTO_POSITIONS, etc.';
COMMENT ON COLUMN public.auto_trades.metadata IS 'Additional metadata: confidence_score, entry_price, stop_loss, take_profit, etc.';
COMMENT ON COLUMN public.auto_trade_logs.step IS 'Step in the process: signal_received, filters_applied, limits_checked, accepted, rejected, execute_called, exchange_response, error';

