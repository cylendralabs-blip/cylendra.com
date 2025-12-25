/**
 * Copy Trading Performance Indexes
 * 
 * Phase X.17 - Performance Improvements
 * 
 * Adds indexes to improve query performance for copy trading system
 */

-- Index for active followers lookup (most common query)
CREATE INDEX IF NOT EXISTS copy_followers_active_strategy_idx 
  ON public.copy_followers(strategy_id, status) 
  WHERE status = 'ACTIVE';

-- Index for follower's strategies lookup
CREATE INDEX IF NOT EXISTS copy_followers_follower_active_idx 
  ON public.copy_followers(follower_user_id, status) 
  WHERE status = 'ACTIVE';

-- Index for copy trades log queries (by follower and strategy)
CREATE INDEX IF NOT EXISTS copy_trades_log_follower_strategy_idx 
  ON public.copy_trades_log(follower_user_id, strategy_id, status);

-- Index for copy trades log queries (by master trade)
CREATE INDEX IF NOT EXISTS copy_trades_log_master_trade_closed_idx 
  ON public.copy_trades_log(master_trade_id, status, closed_at) 
  WHERE closed_at IS NULL;

-- Index for performance queries (by date range)
CREATE INDEX IF NOT EXISTS copy_trades_log_created_at_status_idx 
  ON public.copy_trades_log(created_at DESC, status) 
  WHERE status = 'EXECUTED';

-- Index for daily loss calculations
CREATE INDEX IF NOT EXISTS copy_trades_log_follower_date_pnl_idx 
  ON public.copy_trades_log(follower_user_id, created_at, pnl_amount) 
  WHERE pnl_amount IS NOT NULL;

-- Index for strategy performance aggregation
CREATE INDEX IF NOT EXISTS copy_trades_log_strategy_closed_pnl_idx 
  ON public.copy_trades_log(strategy_id, closed_at, pnl_percentage) 
  WHERE closed_at IS NOT NULL AND pnl_percentage IS NOT NULL;

-- Index for open trades count
CREATE INDEX IF NOT EXISTS copy_trades_log_open_trades_idx 
  ON public.copy_trades_log(follower_user_id, strategy_id, status) 
  WHERE status = 'EXECUTED' AND closed_at IS NULL;

-- Composite index for strategy lookup with public filter
CREATE INDEX IF NOT EXISTS copy_strategies_public_active_idx 
  ON public.copy_strategies(is_public, status, created_at DESC) 
  WHERE is_public = true AND status = 'ACTIVE';

-- Index for owner's strategies
CREATE INDEX IF NOT EXISTS copy_strategies_owner_status_idx 
  ON public.copy_strategies(owner_user_id, status);

-- Index for fee settlements queries
CREATE INDEX IF NOT EXISTS copy_fee_settlements_period_status_idx 
  ON public.copy_fee_settlements(period, status, created_at DESC);

-- Index for master's fee settlements
CREATE INDEX IF NOT EXISTS copy_fee_settlements_master_period_idx 
  ON public.copy_fee_settlements(master_user_id, period, status);

