/**
 * Copy Trading System - Database Schema
 * 
 * Phase X.17 - Copy Trading System
 * 
 * This migration creates all tables required for the Copy Trading system:
 * - copy_strategies: Master strategies available for copying
 * - copy_followers: Followers subscribed to strategies
 * - copy_trades_log: Log of all copied trades
 * - copy_strategy_performance: Aggregated performance metrics
 * - copy_fee_settlements: Fee settlements for profit share/subscription models
 */

-- ============================================
-- 1. Copy Strategies Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.copy_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bot_settings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('AI_MASTER', 'HUMAN_BOT', 'INFLUENCER')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  min_deposit NUMERIC DEFAULT 0,
  performance_window TEXT DEFAULT '30d',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
  fee_model TEXT DEFAULT 'NONE' CHECK (fee_model IN ('NONE', 'PROFIT_SHARE', 'SUBSCRIPTION')),
  profit_share_percent NUMERIC CHECK (profit_share_percent IS NULL OR (profit_share_percent >= 0 AND profit_share_percent <= 100)),
  monthly_fee NUMERIC CHECK (monthly_fee IS NULL OR monthly_fee >= 0),
  risk_label TEXT CHECK (risk_label IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS copy_strategies_owner_user_id_idx 
  ON public.copy_strategies(owner_user_id);

CREATE INDEX IF NOT EXISTS copy_strategies_bot_id_idx 
  ON public.copy_strategies(bot_id);

CREATE INDEX IF NOT EXISTS copy_strategies_status_idx 
  ON public.copy_strategies(status);

CREATE INDEX IF NOT EXISTS copy_strategies_is_public_idx 
  ON public.copy_strategies(is_public) WHERE is_public = true;

-- ============================================
-- 2. Copy Followers Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.copy_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'STOPPED')),
  allocation_mode TEXT NOT NULL DEFAULT 'PERCENT' CHECK (allocation_mode IN ('PERCENT', 'FIXED')),
  allocation_value NUMERIC NOT NULL CHECK (allocation_value > 0),
  max_daily_loss NUMERIC CHECK (max_daily_loss IS NULL OR (max_daily_loss >= 0 AND max_daily_loss <= 100)),
  max_total_loss NUMERIC CHECK (max_total_loss IS NULL OR (max_total_loss >= 0 AND max_total_loss <= 100)),
  max_open_trades INTEGER DEFAULT 10 CHECK (max_open_trades > 0),
  max_leverage NUMERIC DEFAULT 3 CHECK (max_leverage >= 1),
  risk_multiplier NUMERIC DEFAULT 1 CHECK (risk_multiplier > 0),
  start_copy_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  stop_copy_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(follower_user_id, strategy_id)
);

CREATE INDEX IF NOT EXISTS copy_followers_follower_user_id_idx 
  ON public.copy_followers(follower_user_id);

CREATE INDEX IF NOT EXISTS copy_followers_strategy_id_idx 
  ON public.copy_followers(strategy_id);

CREATE INDEX IF NOT EXISTS copy_followers_status_idx 
  ON public.copy_followers(status);

-- ============================================
-- 3. Copy Trades Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.copy_trades_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  master_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  master_trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  master_signal_execution_id UUID REFERENCES public.bot_signal_executions(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
  market_type TEXT NOT NULL CHECK (market_type IN ('SPOT', 'FUTURES')),
  leverage NUMERIC CHECK (leverage IS NULL OR leverage >= 1),
  master_position_size NUMERIC NOT NULL CHECK (master_position_size > 0),
  follower_position_size NUMERIC NOT NULL CHECK (follower_position_size > 0),
  follower_allocation_before NUMERIC,
  follower_allocation_after NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('EXECUTED', 'FAILED', 'SKIPPED')),
  fail_reason TEXT,
  pnl_percentage NUMERIC,
  pnl_amount NUMERIC,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS copy_trades_log_strategy_id_idx 
  ON public.copy_trades_log(strategy_id);

CREATE INDEX IF NOT EXISTS copy_trades_log_master_user_id_idx 
  ON public.copy_trades_log(master_user_id);

CREATE INDEX IF NOT EXISTS copy_trades_log_follower_user_id_idx 
  ON public.copy_trades_log(follower_user_id);

CREATE INDEX IF NOT EXISTS copy_trades_log_master_trade_id_idx 
  ON public.copy_trades_log(master_trade_id);

CREATE INDEX IF NOT EXISTS copy_trades_log_status_idx 
  ON public.copy_trades_log(status);

CREATE INDEX IF NOT EXISTS copy_trades_log_created_at_idx 
  ON public.copy_trades_log(created_at DESC);

-- ============================================
-- 4. Copy Strategy Performance Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.copy_strategy_performance (
  strategy_id UUID PRIMARY KEY REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  total_copiers INTEGER DEFAULT 0 CHECK (total_copiers >= 0),
  total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
  win_rate NUMERIC DEFAULT 0 CHECK (win_rate >= 0 AND win_rate <= 100),
  avg_return NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0 CHECK (max_drawdown <= 0),
  last_30d_return NUMERIC DEFAULT 0,
  last_7d_return NUMERIC DEFAULT 0,
  total_volume NUMERIC DEFAULT 0 CHECK (total_volume >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================
-- 5. Copy Fee Settlements Table (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS public.copy_fee_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  master_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- Format: '2025-02'
  fee_model TEXT NOT NULL CHECK (fee_model IN ('PROFIT_SHARE', 'SUBSCRIPTION')),
  gross_profit NUMERIC DEFAULT 0,
  fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  settled_at TIMESTAMPTZ,
  UNIQUE(strategy_id, follower_user_id, period, fee_model)
);

CREATE INDEX IF NOT EXISTS copy_fee_settlements_strategy_id_idx 
  ON public.copy_fee_settlements(strategy_id);

CREATE INDEX IF NOT EXISTS copy_fee_settlements_master_user_id_idx 
  ON public.copy_fee_settlements(master_user_id);

CREATE INDEX IF NOT EXISTS copy_fee_settlements_follower_user_id_idx 
  ON public.copy_fee_settlements(follower_user_id);

CREATE INDEX IF NOT EXISTS copy_fee_settlements_status_idx 
  ON public.copy_fee_settlements(status);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_copy_strategies_updated_at
  BEFORE UPDATE ON public.copy_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copy_followers_updated_at
  BEFORE UPDATE ON public.copy_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.copy_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_trades_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_fee_settlements ENABLE ROW LEVEL SECURITY;

-- Copy Strategies Policies
CREATE POLICY "Users can view public strategies"
  ON public.copy_strategies
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_user_id);

CREATE POLICY "Users can view their own strategies"
  ON public.copy_strategies
  FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own strategies"
  ON public.copy_strategies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own strategies"
  ON public.copy_strategies
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own strategies"
  ON public.copy_strategies
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Copy Followers Policies
CREATE POLICY "Users can view their own follower records"
  ON public.copy_followers
  FOR SELECT
  USING (auth.uid() = follower_user_id OR auth.uid() = (SELECT owner_user_id FROM public.copy_strategies WHERE id = strategy_id));

CREATE POLICY "Users can create their own follower records"
  ON public.copy_followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can update their own follower records"
  ON public.copy_followers
  FOR UPDATE
  USING (auth.uid() = follower_user_id);

CREATE POLICY "Users can delete their own follower records"
  ON public.copy_followers
  FOR DELETE
  USING (auth.uid() = follower_user_id);

-- Copy Trades Log Policies
CREATE POLICY "Users can view their own copy trades"
  ON public.copy_trades_log
  FOR SELECT
  USING (auth.uid() = follower_user_id OR auth.uid() = master_user_id);

-- Copy Strategy Performance Policies
CREATE POLICY "Anyone can view public strategy performance"
  ON public.copy_strategy_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.copy_strategies 
      WHERE id = copy_strategy_performance.strategy_id 
      AND (is_public = true OR owner_user_id = auth.uid())
    )
  );

-- Copy Fee Settlements Policies
CREATE POLICY "Users can view their own fee settlements"
  ON public.copy_fee_settlements
  FOR SELECT
  USING (auth.uid() = master_user_id OR auth.uid() = follower_user_id);

-- Service Role Policies (for Edge Functions)
CREATE POLICY "Service role can manage all copy strategies"
  ON public.copy_strategies
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all copy followers"
  ON public.copy_followers
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all copy trades log"
  ON public.copy_trades_log
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all copy strategy performance"
  ON public.copy_strategy_performance
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage all copy fee settlements"
  ON public.copy_fee_settlements
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Helper Functions
-- ============================================

/**
 * Function to get active followers count for a strategy
 */
CREATE OR REPLACE FUNCTION public.get_strategy_followers_count(strategy_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.copy_followers
    WHERE strategy_id = strategy_uuid
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function to check if user is following a strategy
 */
CREATE OR REPLACE FUNCTION public.is_user_following_strategy(user_uuid UUID, strategy_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.copy_followers
    WHERE follower_user_id = user_uuid
    AND strategy_id = strategy_uuid
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function to get follower's total PnL for a strategy
 */
CREATE OR REPLACE FUNCTION public.get_follower_strategy_pnl(follower_uuid UUID, strategy_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(pnl_amount)
    FROM public.copy_trades_log
    WHERE follower_user_id = follower_uuid
    AND strategy_id = strategy_uuid
    AND status = 'EXECUTED'
    AND closed_at IS NOT NULL
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

