-- ========================================
-- Fix IMMUTABLE Index Error
-- ========================================
-- This file fixes the error: "functions in index expression must be marked IMMUTABLE"
-- Problem: Using DATE() function in index creation
-- Solution: Remove DATE() function from index or use alternative approach

-- Check if the problematic index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_portfolio_history_user_date'
  AND schemaname = 'public';

-- Drop the problematic index if it exists (with error handling)
DROP INDEX IF EXISTS public.idx_portfolio_history_user_date;

-- Recreate the index without DATE() function
-- We'll use timestamp directly, which is IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
  ON public.portfolio_history(user_id, timestamp DESC);

-- Verify the index was created successfully
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_portfolio_history_user_date'
  AND schemaname = 'public';

-- Note: For date-based queries, you can still use:
-- WHERE DATE(timestamp) = '2025-01-18'
-- PostgreSQL will still use the timestamp index efficiently

