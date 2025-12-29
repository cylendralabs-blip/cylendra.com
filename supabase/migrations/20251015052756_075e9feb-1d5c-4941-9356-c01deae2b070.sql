-- Add missing market_type column to portfolio_balances
ALTER TABLE public.portfolio_balances ADD COLUMN IF NOT EXISTS market_type text DEFAULT 'spot';