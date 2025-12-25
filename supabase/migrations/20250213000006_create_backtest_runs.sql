-- Phase 1: Backtest Engine - Database Schema
-- Migration Date: 2025-02-13
-- Description: Create tables for backtest runs and trades

-- ============================================
-- 1. CREATE BACKTEST_RUNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Strategy information
  strategy_id TEXT NOT NULL DEFAULT 'main-strategy',
  
  -- Trading pair
  pair TEXT NOT NULL,
  
  -- Timeframe
  timeframe TEXT NOT NULL,
  
  -- Period
  period_from TIMESTAMP WITH TIME ZONE NOT NULL,
  period_to TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Summary (JSONB)
  summary JSONB DEFAULT '{}'::jsonb,
  
  -- Error message (if failed)
  error TEXT,
  
  -- Execution time in milliseconds
  execution_time_ms INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. CREATE BACKTEST_TRADES TABLE (Optional)
-- Note: This table already exists from previous migration (20250121000000_backtest_tables.sql)
-- We'll add a new column for backtest_run_id if needed, or use existing backtest_id
-- ============================================

-- Check if backtest_trades table exists and has backtest_id column
-- If it exists, we'll add backtest_run_id as an additional column
-- If not, create the table

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backtest_trades') THEN
    -- Table exists, add backtest_run_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'backtest_trades' AND column_name = 'backtest_run_id') THEN
      ALTER TABLE public.backtest_trades 
      ADD COLUMN backtest_run_id UUID REFERENCES public.backtest_runs(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE public.backtest_trades (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      backtest_run_id UUID NOT NULL REFERENCES public.backtest_runs(id) ON DELETE CASCADE,
      
      -- Trade information
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
      
      -- Entry
      entry_time BIGINT NOT NULL, -- Timestamp in milliseconds
      entry_price NUMERIC NOT NULL,
      entry_qty NUMERIC NOT NULL,
      entry_fee NUMERIC DEFAULT 0,
      
      -- Exit
      exit_time BIGINT,
      exit_price NUMERIC,
      exit_qty NUMERIC,
      exit_fee NUMERIC DEFAULT 0,
      
      -- PnL
      pnl_usd NUMERIC NOT NULL DEFAULT 0,
      pnl_pct NUMERIC NOT NULL DEFAULT 0,
      
      -- Exit reason
      exit_reason TEXT CHECK (exit_reason IN ('tp', 'sl', 'manual', 'timeout', 'risk')),
      
      -- Duration in milliseconds
      duration BIGINT,
      
      -- Metadata
      metadata JSONB DEFAULT '{}'::jsonb,
      
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

-- Backtest runs indexes
CREATE INDEX IF NOT EXISTS idx_backtest_runs_user_id 
  ON public.backtest_runs(user_id);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_status 
  ON public.backtest_runs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_created_at 
  ON public.backtest_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_user_status 
  ON public.backtest_runs(user_id, status);

-- Backtest trades indexes (only create if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'backtest_trades' AND column_name = 'backtest_run_id') THEN
    CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_run_id 
      ON public.backtest_trades(backtest_run_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_backtest_trades_symbol 
  ON public.backtest_trades(symbol);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_entry_time 
  ON public.backtest_trades(entry_time);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_trades ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Backtest runs policies
DROP POLICY IF EXISTS "Users can view their own backtest runs" 
  ON public.backtest_runs;
CREATE POLICY "Users can view their own backtest runs" 
  ON public.backtest_runs 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own backtest runs" 
  ON public.backtest_runs;
CREATE POLICY "Users can create their own backtest runs" 
  ON public.backtest_runs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backtest runs" 
  ON public.backtest_runs;
CREATE POLICY "Users can update their own backtest runs" 
  ON public.backtest_runs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own backtest runs" 
  ON public.backtest_runs;
CREATE POLICY "Users can delete their own backtest runs" 
  ON public.backtest_runs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Service role can manage all backtest runs
DROP POLICY IF EXISTS "Service can manage backtest runs" 
  ON public.backtest_runs;
CREATE POLICY "Service can manage backtest runs" 
  ON public.backtest_runs 
  FOR ALL 
  WITH CHECK (true);

-- Backtest trades policies (inherited from backtest run ownership)
-- Support both backtest_id (old table) and backtest_run_id (new table)
DROP POLICY IF EXISTS "Users can view their backtest trades" 
  ON public.backtest_trades;
CREATE POLICY "Users can view their backtest trades" 
  ON public.backtest_trades 
  FOR SELECT 
  USING (
    -- Check if backtest_run_id exists and use it
    (backtest_trades.backtest_run_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.backtest_runs 
      WHERE backtest_runs.id = backtest_trades.backtest_run_id 
      AND backtest_runs.user_id = auth.uid()
    ))
    OR
    -- Fallback to backtest_id (old table)
    (backtest_trades.backtest_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.backtests 
      WHERE backtests.id = backtest_trades.backtest_id 
      AND backtests.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Service can manage backtest trades" 
  ON public.backtest_trades;
CREATE POLICY "Service can manage backtest trades" 
  ON public.backtest_trades 
  FOR ALL 
  WITH CHECK (true);

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp for backtest_runs
CREATE OR REPLACE FUNCTION update_backtest_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for backtest_runs
DROP TRIGGER IF EXISTS update_backtest_runs_updated_at_trigger 
  ON public.backtest_runs;
CREATE TRIGGER update_backtest_runs_updated_at_trigger
  BEFORE UPDATE ON public.backtest_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_backtest_runs_updated_at();

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE public.backtest_runs IS 'Backtest runs and their configurations';
COMMENT ON TABLE public.backtest_trades IS 'Individual trades executed during backtest';

