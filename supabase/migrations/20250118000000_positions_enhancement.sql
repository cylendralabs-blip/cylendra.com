-- Phase 6: Position Manager - Database Enhancements
-- Migration Date: 2025-01-18
-- Description: Add support for Position Manager with enhanced tracking

-- ============================================
-- 1. ENHANCE TRADES TABLE FOR POSITION MANAGER
-- ============================================

-- Add position tracking columns
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS position_id UUID,
ADD COLUMN IF NOT EXISTS average_entry_price NUMERIC,
ADD COLUMN IF NOT EXISTS position_quantity NUMERIC;

-- Add risk state for position management (TP/SL/DCA tracking)
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS risk_state JSONB DEFAULT '{}'::jsonb;

-- Add position metadata
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS position_meta JSONB DEFAULT '{}'::jsonb;

-- Add highest price tracking for trailing stop
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS highest_price NUMERIC,
ADD COLUMN IF NOT EXISTS lowest_price NUMERIC,
ADD COLUMN IF NOT EXISTS highest_price_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lowest_price_at TIMESTAMP WITH TIME ZONE;

-- Add partial TP tracking
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS partial_tp_levels JSONB DEFAULT '[]'::jsonb;

-- Add trailing stop state
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS trailing_stop_state JSONB DEFAULT '{}'::jsonb;

-- Add break-even state
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS break_even_state JSONB DEFAULT '{}'::jsonb;

-- Add position status (enhanced)
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS position_status TEXT DEFAULT 'open' 
  CHECK (position_status IN ('open', 'closing', 'closed', 'failed'));

-- ============================================
-- 2. ENHANCE ORDER_EVENTS FOR POSITION EVENTS
-- ============================================

-- Add position_id to order_events for position tracking
ALTER TABLE public.order_events
ADD COLUMN IF NOT EXISTS position_id UUID;

-- Add event_type for position events (POSITION_UPDATED, POSITION_CLOSED, etc.)
-- Note: event_type already exists, we'll use existing values plus new ones

-- Add position context to event_data
-- Note: event_data JSONB already exists, will be used for position context

-- ============================================
-- 3. CREATE PORTFOLIO_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.portfolio_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Portfolio snapshot
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Equity tracking
  total_equity NUMERIC NOT NULL DEFAULT 0,
  total_invested NUMERIC NOT NULL DEFAULT 0,
  total_realized_pnl NUMERIC NOT NULL DEFAULT 0,
  total_unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  
  -- Position counts
  active_positions_count INTEGER NOT NULL DEFAULT 0,
  closed_positions_count INTEGER NOT NULL DEFAULT 0,
  
  -- Exposure tracking
  total_exposure NUMERIC NOT NULL DEFAULT 0,
  spot_exposure NUMERIC NOT NULL DEFAULT 0,
  futures_exposure NUMERIC NOT NULL DEFAULT 0,
  
  -- Per-symbol exposure
  symbol_exposures JSONB DEFAULT '{}'::jsonb,
  
  -- Performance metrics
  daily_pnl NUMERIC DEFAULT 0,
  weekly_pnl NUMERIC DEFAULT 0,
  monthly_pnl NUMERIC DEFAULT 0,
  
  -- Drawdown tracking
  peak_equity NUMERIC,
  current_drawdown NUMERIC DEFAULT 0,
  current_drawdown_pct NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  max_drawdown_pct NUMERIC DEFAULT 0,
  
  -- Risk metrics
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  kill_switch_active BOOLEAN DEFAULT false,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 4. CREATE POSITION_SNAPSHOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.position_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Snapshot timestamp
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Position state
  position_quantity NUMERIC NOT NULL,
  average_entry_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  
  -- PnL snapshot
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  
  -- Risk state snapshot
  risk_state JSONB DEFAULT '{}'::jsonb,
  
  -- Position metadata
  position_meta JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  position_status TEXT DEFAULT 'open',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_position_id 
  ON public.trades(position_id) 
  WHERE position_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trades_position_status 
  ON public.trades(position_status) 
  WHERE position_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trades_user_status 
  ON public.trades(user_id, position_status) 
  WHERE position_status = 'open';

CREATE INDEX IF NOT EXISTS idx_trades_highest_price 
  ON public.trades(highest_price) 
  WHERE highest_price IS NOT NULL;

-- Order events indexes
CREATE INDEX IF NOT EXISTS idx_order_events_position_id 
  ON public.order_events(position_id) 
  WHERE position_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_events_position_events 
  ON public.order_events(event_type, position_id) 
  WHERE event_type IN ('POSITION_UPDATED', 'POSITION_CLOSED', 'POSITION_ERROR');

-- Portfolio history indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_timestamp 
  ON public.portfolio_history(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_timestamp 
  ON public.portfolio_history(timestamp DESC);

-- Note: DATE() function is not IMMUTABLE, so we cannot use it in indexes
-- Instead, we use timestamp DESC directly for efficient date-based queries
-- For date-based queries, use: WHERE DATE(timestamp) = '2025-01-18'
-- PostgreSQL will still use this index efficiently
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
  ON public.portfolio_history(user_id, timestamp DESC);

-- Position snapshots indexes
CREATE INDEX IF NOT EXISTS idx_position_snapshots_trade_id 
  ON public.position_snapshots(trade_id, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_position_snapshots_user_timestamp 
  ON public.position_snapshots(user_id, snapshot_at DESC);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Portfolio History Policies
DROP POLICY IF EXISTS "Users can view their own portfolio history" 
  ON public.portfolio_history;
CREATE POLICY "Users can view their own portfolio history" 
  ON public.portfolio_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert portfolio history" 
  ON public.portfolio_history;
CREATE POLICY "Service can insert portfolio history" 
  ON public.portfolio_history 
  FOR INSERT 
  WITH CHECK (true);

-- Position Snapshots Policies
DROP POLICY IF EXISTS "Users can view their own position snapshots" 
  ON public.position_snapshots;
CREATE POLICY "Users can view their own position snapshots" 
  ON public.position_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert position snapshots" 
  ON public.position_snapshots;
CREATE POLICY "Service can insert position snapshots" 
  ON public.position_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Function to update highest/lowest price automatically
CREATE OR REPLACE FUNCTION update_trade_price_extremes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update highest price
  IF NEW.current_price IS NOT NULL THEN
    IF NEW.highest_price IS NULL OR NEW.current_price > NEW.highest_price THEN
      NEW.highest_price = NEW.current_price;
      NEW.highest_price_at = now();
    END IF;
    
    -- Update lowest price
    IF NEW.lowest_price IS NULL OR NEW.current_price < NEW.lowest_price THEN
      NEW.lowest_price = NEW.current_price;
      NEW.lowest_price_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update price extremes
DROP TRIGGER IF EXISTS update_trade_price_extremes_trigger ON public.trades;
CREATE TRIGGER update_trade_price_extremes_trigger
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
  EXECUTE FUNCTION update_trade_price_extremes();

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE public.portfolio_history IS 'Historical snapshots of portfolio state for analysis and reporting';
COMMENT ON TABLE public.position_snapshots IS 'Snapshots of position state at specific points in time';
COMMENT ON COLUMN public.trades.risk_state IS 'Risk management state: TP/SL/DCA configuration and tracking';
COMMENT ON COLUMN public.trades.position_meta IS 'Position metadata: strategy ID, signal ID, etc.';
COMMENT ON COLUMN public.trades.position_status IS 'Position status: open, closing, closed, failed';
COMMENT ON COLUMN public.trades.highest_price IS 'Highest price reached during position lifetime (for trailing stop)';
COMMENT ON COLUMN public.trades.lowest_price IS 'Lowest price reached during position lifetime';
COMMENT ON COLUMN public.order_events.position_id IS 'Position ID for position-related events';

