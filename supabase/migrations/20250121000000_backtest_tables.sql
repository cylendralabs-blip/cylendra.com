-- Phase 9: Backtesting Engine
-- Migration Date: 2025-01-21
-- Description: Create tables for backtest results

-- ============================================
-- 1. CREATE BACKTESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Backtest configuration (stored as JSONB)
  config JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error information (if failed)
  error TEXT,
  
  -- Execution time in milliseconds
  execution_time_ms INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. CREATE BACKTEST_TRADES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backtest_id UUID NOT NULL REFERENCES public.backtests(id) ON DELETE CASCADE,
  
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
  
  -- DCA fills (JSONB array)
  dca_fills JSONB DEFAULT '[]'::jsonb,
  
  -- TP fills (JSONB array)
  tp_fills JSONB DEFAULT '[]'::jsonb,
  
  -- SL fill
  sl_fill JSONB,
  
  -- PnL
  pnl_usd NUMERIC NOT NULL DEFAULT 0,
  pnl_pct NUMERIC NOT NULL DEFAULT 0,
  
  -- Additional metrics
  max_adverse_move_pct NUMERIC DEFAULT 0,
  max_favorable_move_pct NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'partial')),
  
  -- Exit reason
  exit_reason TEXT CHECK (exit_reason IN ('tp', 'sl', 'manual', 'timeout', 'risk')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CREATE BACKTEST_EQUITY_CURVE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_equity_curve (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backtest_id UUID NOT NULL REFERENCES public.backtests(id) ON DELETE CASCADE,
  
  -- Equity point
  time BIGINT NOT NULL, -- Timestamp in milliseconds
  equity NUMERIC NOT NULL,
  
  -- Additional metrics (optional)
  unrealized_pnl NUMERIC,
  realized_pnl NUMERIC,
  open_positions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one point per time per backtest
  UNIQUE(backtest_id, time)
);

-- ============================================
-- 4. CREATE BACKTEST_METRICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.backtest_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backtest_id UUID NOT NULL REFERENCES public.backtests(id) ON DELETE CASCADE UNIQUE,
  
  -- Returns
  total_return_pct NUMERIC NOT NULL DEFAULT 0,
  cagr NUMERIC,
  
  -- Win rate
  win_rate NUMERIC NOT NULL DEFAULT 0,
  avg_win NUMERIC DEFAULT 0,
  avg_loss NUMERIC DEFAULT 0,
  profit_factor NUMERIC NOT NULL DEFAULT 0,
  
  -- Drawdown
  max_drawdown_pct NUMERIC NOT NULL DEFAULT 0,
  max_drawdown_duration_days NUMERIC,
  
  -- Risk metrics
  sharpe_ratio NUMERIC,
  volatility NUMERIC,
  calmar_ratio NUMERIC,
  
  -- Expectancy
  expectancy NUMERIC NOT NULL DEFAULT 0,
  
  -- Streaks
  max_win_streak INTEGER DEFAULT 0,
  max_loss_streak INTEGER DEFAULT 0,
  
  -- Trade statistics
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  avg_trade_duration_hours NUMERIC,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Backtests indexes
CREATE INDEX IF NOT EXISTS idx_backtests_user_id 
  ON public.backtests(user_id);

CREATE INDEX IF NOT EXISTS idx_backtests_status 
  ON public.backtests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backtests_created_at 
  ON public.backtests(created_at DESC);

-- Backtest trades indexes
CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_id 
  ON public.backtest_trades(backtest_id);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_symbol 
  ON public.backtest_trades(symbol);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_status 
  ON public.backtest_trades(status);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_entry_time 
  ON public.backtest_trades(entry_time);

-- Backtest equity curve indexes
CREATE INDEX IF NOT EXISTS idx_backtest_equity_curve_backtest_id 
  ON public.backtest_equity_curve(backtest_id);

CREATE INDEX IF NOT EXISTS idx_backtest_equity_curve_time 
  ON public.backtest_equity_curve(backtest_id, time);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_equity_curve ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Backtests Policies
DROP POLICY IF EXISTS "Users can view their own backtests" 
  ON public.backtests;
CREATE POLICY "Users can view their own backtests" 
  ON public.backtests 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own backtests" 
  ON public.backtests;
CREATE POLICY "Users can create their own backtests" 
  ON public.backtests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backtests" 
  ON public.backtests;
CREATE POLICY "Users can update their own backtests" 
  ON public.backtests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own backtests" 
  ON public.backtests;
CREATE POLICY "Users can delete their own backtests" 
  ON public.backtests 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Service role can manage all backtests
DROP POLICY IF EXISTS "Service can manage backtests" 
  ON public.backtests;
CREATE POLICY "Service can manage backtests" 
  ON public.backtests 
  FOR ALL 
  WITH CHECK (true);

-- Backtest trades policies (inherited from backtest ownership)
DROP POLICY IF EXISTS "Users can view their backtest trades" 
  ON public.backtest_trades;
CREATE POLICY "Users can view their backtest trades" 
  ON public.backtest_trades 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.backtests 
      WHERE backtests.id = backtest_trades.backtest_id 
      AND backtests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can manage backtest trades" 
  ON public.backtest_trades;
CREATE POLICY "Service can manage backtest trades" 
  ON public.backtest_trades 
  FOR ALL 
  WITH CHECK (true);

-- Backtest equity curve policies
DROP POLICY IF EXISTS "Users can view their backtest equity curves" 
  ON public.backtest_equity_curve;
CREATE POLICY "Users can view their backtest equity curves" 
  ON public.backtest_equity_curve 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.backtests 
      WHERE backtests.id = backtest_equity_curve.backtest_id 
      AND backtests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can manage backtest equity curves" 
  ON public.backtest_equity_curve;
CREATE POLICY "Service can manage backtest equity curves" 
  ON public.backtest_equity_curve 
  FOR ALL 
  WITH CHECK (true);

-- Backtest metrics policies
DROP POLICY IF EXISTS "Users can view their backtest metrics" 
  ON public.backtest_metrics;
CREATE POLICY "Users can view their backtest metrics" 
  ON public.backtest_metrics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.backtests 
      WHERE backtests.id = backtest_metrics.backtest_id 
      AND backtests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can manage backtest metrics" 
  ON public.backtest_metrics;
CREATE POLICY "Service can manage backtest metrics" 
  ON public.backtest_metrics 
  FOR ALL 
  WITH CHECK (true);

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp for backtests
CREATE OR REPLACE FUNCTION update_backtests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for backtests
DROP TRIGGER IF EXISTS update_backtests_updated_at_trigger 
  ON public.backtests;
CREATE TRIGGER update_backtests_updated_at_trigger
  BEFORE UPDATE ON public.backtests
  FOR EACH ROW
  EXECUTE FUNCTION update_backtests_updated_at();

-- Function to update updated_at timestamp for backtest_metrics
CREATE OR REPLACE FUNCTION update_backtest_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for backtest_metrics
DROP TRIGGER IF EXISTS update_backtest_metrics_updated_at_trigger 
  ON public.backtest_metrics;
CREATE TRIGGER update_backtest_metrics_updated_at_trigger
  BEFORE UPDATE ON public.backtest_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_backtest_metrics_updated_at();

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE public.backtests IS 'Backtest runs and their configurations';
COMMENT ON TABLE public.backtest_trades IS 'Individual trades executed during backtest';
COMMENT ON TABLE public.backtest_equity_curve IS 'Equity curve points over time';
COMMENT ON TABLE public.backtest_metrics IS 'Performance metrics calculated from backtest results';

