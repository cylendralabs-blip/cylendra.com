-- ============================================
-- Phase X.17 - Multi-Exchange Portfolio Insights & Scope Selector
-- Migration: Add scope support to portfolio_snapshots
-- Created: 2025-02-12
-- ============================================

-- ===================================
-- PART 1: ADD COLUMNS TO PORTFOLIO_SNAPSHOTS
-- ===================================

-- Add scope_type column (GLOBAL or EXCHANGE)
ALTER TABLE public.portfolio_snapshots
  ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'GLOBAL';

-- Add api_key_id column (FK to api_keys)
ALTER TABLE public.portfolio_snapshots
  ADD COLUMN IF NOT EXISTS api_key_id UUID NULL REFERENCES public.api_keys(id) ON DELETE CASCADE;

-- Add platform column (copy from api_keys.platform for convenience)
ALTER TABLE public.portfolio_snapshots
  ADD COLUMN IF NOT EXISTS platform TEXT NULL;

-- Add constraint to ensure scope_type is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'portfolio_snapshots_scope_type_check'
  ) THEN
    ALTER TABLE public.portfolio_snapshots
      ADD CONSTRAINT portfolio_snapshots_scope_type_check
      CHECK (scope_type IN ('GLOBAL', 'EXCHANGE'));
  END IF;
END $$;

-- Add constraint: if scope_type is EXCHANGE, api_key_id must be set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'portfolio_snapshots_exchange_scope_check'
  ) THEN
    ALTER TABLE public.portfolio_snapshots
      ADD CONSTRAINT portfolio_snapshots_exchange_scope_check
      CHECK (
        (scope_type = 'GLOBAL' AND api_key_id IS NULL) OR
        (scope_type = 'EXCHANGE' AND api_key_id IS NOT NULL)
      );
  END IF;
END $$;

-- ===================================
-- PART 2: CREATE INDEXES
-- ===================================

-- Index for fast filtering by user, scope, and api_key
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_scope
  ON public.portfolio_snapshots (user_id, scope_type, api_key_id);

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_platform
  ON public.portfolio_snapshots (platform) WHERE platform IS NOT NULL;

-- Index for timestamp ordering per scope
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_scope_timestamp
  ON public.portfolio_snapshots (user_id, scope_type, timestamp DESC);

-- ===================================
-- PART 3: UPDATE EXISTING ROWS
-- ===================================

-- Mark all existing rows as GLOBAL scope (default)
UPDATE public.portfolio_snapshots
SET scope_type = 'GLOBAL'
WHERE scope_type IS NULL OR scope_type = '';

-- ===================================
-- PART 4: ADD COMMENTS
-- ===================================

COMMENT ON COLUMN public.portfolio_snapshots.scope_type IS 
  'Scope type: GLOBAL (all exchanges combined) or EXCHANGE (specific API key)';

COMMENT ON COLUMN public.portfolio_snapshots.api_key_id IS 
  'Foreign key to api_keys table. Required when scope_type is EXCHANGE.';

COMMENT ON COLUMN public.portfolio_snapshots.platform IS 
  'Platform name (e.g., binance, okx, bybit). Copied from api_keys for convenience.';

-- ===================================
-- PART 5: VERIFICATION
-- ===================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Portfolio Snapshots Scope Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Columns Added:';
  RAISE NOTICE '  - scope_type (GLOBAL | EXCHANGE)';
  RAISE NOTICE '  - api_key_id (UUID, FK to api_keys)';
  RAISE NOTICE '  - platform (TEXT, copied from api_keys)';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes Created:';
  RAISE NOTICE '  - idx_portfolio_snapshots_user_scope';
  RAISE NOTICE '  - idx_portfolio_snapshots_platform';
  RAISE NOTICE '  - idx_portfolio_snapshots_scope_timestamp';
  RAISE NOTICE '';
  RAISE NOTICE 'Existing rows marked as GLOBAL scope';
  RAISE NOTICE '========================================';
END $$;

