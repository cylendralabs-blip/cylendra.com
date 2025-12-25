-- Phase 7: Portfolio & Wallet Integration - Database Tables
-- Migration Date: 2025-01-19
-- Description: Create tables for portfolio snapshots and portfolio state

-- ============================================
-- 1. CREATE PORTFOLIO_SNAPSHOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Snapshot timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Equity tracking
  total_equity NUMERIC NOT NULL DEFAULT 0,
  spot_equity NUMERIC NOT NULL DEFAULT 0,
  futures_equity NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  
  -- Asset allocation (JSONB)
  allocation JSONB DEFAULT '{}'::jsonb,
  
  -- Exposure (JSONB)
  exposure JSONB DEFAULT '{}'::jsonb,
  
  -- Metrics (JSONB)
  metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. CREATE USERS_PORTFOLIO_STATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users_portfolio_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  
  -- Last sync timestamp
  last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Current equity
  total_equity NUMERIC NOT NULL DEFAULT 0,
  spot_equity NUMERIC NOT NULL DEFAULT 0,
  futures_equity NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  
  -- Position counts
  open_positions_count INTEGER NOT NULL DEFAULT 0,
  
  -- Sync status
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('syncing', 'synced', 'error')),
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one state per user per API key
  UNIQUE(user_id, api_key_id)
);

-- ============================================
-- 3. CREATE PORTFOLIO_ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('sync_failure', 'api_error', 'exposure_warning', 'equity_drop', 'balance_mismatch')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Acknowledgment
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 4. CREATE PERFORMANCE_HISTORY TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.performance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Equity at start/end of day
  start_equity NUMERIC NOT NULL DEFAULT 0,
  end_equity NUMERIC NOT NULL DEFAULT 0,
  
  -- Daily PnL
  daily_pnl NUMERIC NOT NULL DEFAULT 0,
  daily_pnl_pct NUMERIC DEFAULT 0,
  
  -- Trade statistics
  trades_count INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  
  -- Performance metrics
  profit_factor NUMERIC,
  sharpe_ratio NUMERIC,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one record per user per day
  UNIQUE(user_id, date)
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

-- Portfolio snapshots indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_timestamp 
  ON public.portfolio_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_timestamp 
  ON public.portfolio_snapshots(timestamp DESC);

-- Users portfolio state indexes
CREATE INDEX IF NOT EXISTS idx_users_portfolio_state_user_id 
  ON public.users_portfolio_state(user_id);

CREATE INDEX IF NOT EXISTS idx_users_portfolio_state_last_sync 
  ON public.users_portfolio_state(last_sync_at DESC);

-- Portfolio alerts indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_user_id 
  ON public.portfolio_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_acknowledged 
  ON public.portfolio_alerts(acknowledged, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_severity 
  ON public.portfolio_alerts(severity, created_at DESC);

-- Performance history indexes
CREATE INDEX IF NOT EXISTS idx_performance_history_user_date 
  ON public.performance_history(user_id, date DESC);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_portfolio_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Portfolio Snapshots Policies
DROP POLICY IF EXISTS "Users can view their own portfolio snapshots" 
  ON public.portfolio_snapshots;
CREATE POLICY "Users can view their own portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert portfolio snapshots" 
  ON public.portfolio_snapshots;
CREATE POLICY "Service can insert portfolio snapshots" 
  ON public.portfolio_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- Users Portfolio State Policies
DROP POLICY IF EXISTS "Users can view their own portfolio state" 
  ON public.users_portfolio_state;
CREATE POLICY "Users can view their own portfolio state" 
  ON public.users_portfolio_state 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can update portfolio state" 
  ON public.users_portfolio_state;
CREATE POLICY "Service can update portfolio state" 
  ON public.users_portfolio_state 
  FOR ALL 
  WITH CHECK (true);

-- Portfolio Alerts Policies
DROP POLICY IF EXISTS "Users can view their own portfolio alerts" 
  ON public.portfolio_alerts;
CREATE POLICY "Users can view their own portfolio alerts" 
  ON public.portfolio_alerts 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own portfolio alerts" 
  ON public.portfolio_alerts;
CREATE POLICY "Users can update their own portfolio alerts" 
  ON public.portfolio_alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert portfolio alerts" 
  ON public.portfolio_alerts;
CREATE POLICY "Service can insert portfolio alerts" 
  ON public.portfolio_alerts 
  FOR INSERT 
  WITH CHECK (true);

-- Performance History Policies
DROP POLICY IF EXISTS "Users can view their own performance history" 
  ON public.performance_history;
CREATE POLICY "Users can view their own performance history" 
  ON public.performance_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert performance history" 
  ON public.performance_history;
CREATE POLICY "Service can insert performance history" 
  ON public.performance_history 
  FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolio_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_portfolio_state_updated_at_trigger 
  ON public.users_portfolio_state;
CREATE TRIGGER update_portfolio_state_updated_at_trigger
  BEFORE UPDATE ON public.users_portfolio_state
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_state_updated_at();

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE public.portfolio_snapshots IS 'Historical snapshots of portfolio state for analysis and reporting';
COMMENT ON TABLE public.users_portfolio_state IS 'Current portfolio state (last known state, no history)';
COMMENT ON TABLE public.portfolio_alerts IS 'Alerts and notifications for portfolio sync failures and warnings';
COMMENT ON TABLE public.performance_history IS 'Daily performance metrics for portfolio analysis';
COMMENT ON COLUMN public.portfolio_snapshots.allocation IS 'Asset allocation: {symbol: {balance, valueUsd, percentage, marketType}}';
COMMENT ON COLUMN public.portfolio_snapshots.exposure IS 'Exposure breakdown: {totalUsd, totalPct, perSymbol, byMarket}';
COMMENT ON COLUMN public.portfolio_snapshots.metrics IS 'Performance metrics: {dailyPnl, weeklyPnl, monthlyPnl, winRate, profitFactor, sharpeRatio}';

