-- Phase 3: Backtest Optimization - Result Caching
-- Migration Date: 2025-02-13
-- Description: Create cache table for backtest results

-- ============================================
-- 1. CREATE BACKTEST_CACHE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Cache signature (hash of config)
  signature TEXT NOT NULL UNIQUE,
  
  -- Cached result
  result_json JSONB NOT NULL,
  
  -- Metadata
  pair TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_backtest_cache_signature 
  ON public.backtest_cache(signature);

CREATE INDEX IF NOT EXISTS idx_backtest_cache_expires_at 
  ON public.backtest_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_backtest_cache_pair_timeframe 
  ON public.backtest_cache(pair, timeframe);

-- ============================================
-- 3. FUNCTION TO CLEAN EXPIRED CACHE
-- ============================================

CREATE OR REPLACE FUNCTION clean_expired_backtest_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.backtest_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. COMMENTS
-- ============================================

COMMENT ON TABLE public.backtest_cache IS 'Cache for backtest results to avoid re-running identical tests';
COMMENT ON COLUMN public.backtest_cache.signature IS 'SHA256 hash of backtest configuration';
COMMENT ON COLUMN public.backtest_cache.result_json IS 'Cached backtest result';
COMMENT ON COLUMN public.backtest_cache.expires_at IS 'Cache expiration date (30 days default)';

