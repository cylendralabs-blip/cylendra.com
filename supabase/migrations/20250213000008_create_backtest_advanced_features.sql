-- Phase 4: Advanced Backtest Features
-- Migration Date: 2025-02-13
-- Description: Create tables for advanced backtest features

-- ============================================
-- 1. CREATE BACKTEST_OPTIMIZATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Base configuration
  base_config JSONB NOT NULL,
  
  -- Parameters to optimize
  parameters JSONB NOT NULL,
  
  -- Optimization goal
  optimization_goal TEXT NOT NULL DEFAULT 'max_return'
    CHECK (optimization_goal IN ('max_return', 'max_winrate', 'min_drawdown', 'max_sharpe')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Progress
  total_combinations INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  
  -- Results
  results JSONB DEFAULT '[]'::jsonb,
  
  -- Error message
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ADD TAGS AND NOTES TO BACKTEST_RUNS
-- ============================================

ALTER TABLE public.backtest_runs
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_backtest_optimizations_user_id 
  ON public.backtest_optimizations(user_id);

CREATE INDEX IF NOT EXISTS idx_backtest_optimizations_status 
  ON public.backtest_optimizations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_tags 
  ON public.backtest_runs USING GIN(tags);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE public.backtest_optimizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own optimizations
DROP POLICY IF EXISTS "Users can view their own optimizations" 
  ON public.backtest_optimizations;
CREATE POLICY "Users can view their own optimizations" 
  ON public.backtest_optimizations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own optimizations
DROP POLICY IF EXISTS "Users can create their own optimizations" 
  ON public.backtest_optimizations;
CREATE POLICY "Users can create their own optimizations" 
  ON public.backtest_optimizations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all optimizations
DROP POLICY IF EXISTS "Service can manage optimizations" 
  ON public.backtest_optimizations;
CREATE POLICY "Service can manage optimizations" 
  ON public.backtest_optimizations 
  FOR ALL 
  WITH CHECK (true);

-- ============================================
-- 5. UPDATE TRIGGER FOR BACKTEST_OPTIMIZATIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_backtest_optimizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_backtest_optimizations_updated_at_trigger 
  ON public.backtest_optimizations;
CREATE TRIGGER update_backtest_optimizations_updated_at_trigger
  BEFORE UPDATE ON public.backtest_optimizations
  FOR EACH ROW
  EXECUTE FUNCTION update_backtest_optimizations_updated_at();

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE public.backtest_optimizations IS 'Backtest parameter optimization runs';
COMMENT ON COLUMN public.backtest_optimizations.optimization_goal IS 'Goal for optimization: max_return, max_winrate, min_drawdown, or max_sharpe';
COMMENT ON COLUMN public.backtest_runs.tags IS 'User-defined tags for organizing backtests';
COMMENT ON COLUMN public.backtest_runs.notes IS 'User notes and comments about the backtest';

