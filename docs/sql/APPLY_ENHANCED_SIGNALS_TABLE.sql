-- ============================================
-- Apply Enhanced Trading Signals Table
-- 
-- Run this SQL in Supabase Dashboard > SQL Editor
-- ============================================

-- Create enhanced_trading_signals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.enhanced_trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1h',
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
  signal_strength TEXT NOT NULL DEFAULT 'MODERATE' CHECK (signal_strength IN ('WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG', 'EXCEPTIONAL')),
  confidence_score NUMERIC NOT NULL DEFAULT 70.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Realized and accurate prices
  entry_price NUMERIC NOT NULL,
  stop_loss_price NUMERIC,
  take_profit_price NUMERIC,
  risk_reward_ratio NUMERIC DEFAULT 2.0,
  
  -- Price sources and verification
  price_source TEXT NOT NULL DEFAULT 'binance_live',
  price_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  price_verified BOOLEAN DEFAULT true,
  
  -- Comprehensive analysis
  technical_analysis JSONB DEFAULT '{}',
  volume_analysis JSONB DEFAULT '{}',
  market_sentiment JSONB DEFAULT '{}',
  confirmations TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Signal status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIGGERED', 'EXPIRED', 'CANCELLED')),
  result TEXT CHECK (result IN ('PROFIT', 'LOSS', 'BREAKEVEN')),
  profit_loss_percentage NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  triggered_at TIMESTAMP WITH TIME ZONE
);

-- Create unique index for active signals to prevent conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_enhanced_signals_active_unique 
ON public.enhanced_trading_signals(user_id, symbol) 
WHERE status = 'ACTIVE';

-- Enable Row Level Security
ALTER TABLE public.enhanced_trading_signals ENABLE ROW LEVEL SECURITY;

-- Security policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_trading_signals' 
    AND policyname = 'Users can view their own enhanced signals'
  ) THEN
    CREATE POLICY "Users can view their own enhanced signals" 
      ON public.enhanced_trading_signals 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_trading_signals' 
    AND policyname = 'Users can create their own enhanced signals'
  ) THEN
    CREATE POLICY "Users can create their own enhanced signals" 
      ON public.enhanced_trading_signals 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_trading_signals' 
    AND policyname = 'Users can update their own enhanced signals'
  ) THEN
    CREATE POLICY "Users can update their own enhanced signals" 
      ON public.enhanced_trading_signals 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_trading_signals' 
    AND policyname = 'Users can delete their own enhanced signals'
  ) THEN
    CREATE POLICY "Users can delete their own enhanced signals" 
      ON public.enhanced_trading_signals 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create or replace function to update updated_at
CREATE OR REPLACE FUNCTION update_enhanced_signals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS enhanced_signals_updated_at ON public.enhanced_trading_signals;
CREATE TRIGGER enhanced_signals_updated_at
  BEFORE UPDATE ON public.enhanced_trading_signals
  FOR EACH ROW 
  EXECUTE FUNCTION update_enhanced_signals_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_signals_user_status 
  ON public.enhanced_trading_signals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enhanced_signals_symbol_time 
  ON public.enhanced_trading_signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_signals_expires 
  ON public.enhanced_trading_signals(expires_at) 
  WHERE status = 'ACTIVE';

-- Create enhanced_signal_performance table
CREATE TABLE IF NOT EXISTS public.enhanced_signal_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Basic statistics
  total_signals INTEGER DEFAULT 0,
  successful_signals INTEGER DEFAULT 0,
  failed_signals INTEGER DEFAULT 0,
  pending_signals INTEGER DEFAULT 0,
  
  -- Performance indicators
  win_rate NUMERIC DEFAULT 0,
  average_profit NUMERIC DEFAULT 0,
  average_loss NUMERIC DEFAULT 0,
  total_profit_loss NUMERIC DEFAULT 0,
  best_signal_profit NUMERIC DEFAULT 0,
  worst_signal_loss NUMERIC DEFAULT 0,
  
  -- Analysis by symbol, timeframe, and strength
  by_symbol JSONB DEFAULT '{}',
  by_timeframe JSONB DEFAULT '{}',
  by_strength JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS for performance table
ALTER TABLE public.enhanced_signal_performance ENABLE ROW LEVEL SECURITY;

-- Security policy for performance table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'enhanced_signal_performance' 
    AND policyname = 'Users can view their own enhanced performance'
  ) THEN
    CREATE POLICY "Users can view their own enhanced performance" 
      ON public.enhanced_signal_performance 
      FOR ALL 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create or replace function to calculate enhanced signal performance
CREATE OR REPLACE FUNCTION calculate_enhanced_signal_performance(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_count INTEGER;
  success_count INTEGER;
  failed_count INTEGER;
  pending_count INTEGER;
  win_rate_calc NUMERIC;
  avg_profit_calc NUMERIC;
  avg_loss_calc NUMERIC;
  total_pnl_calc NUMERIC;
  best_profit_calc NUMERIC;
  worst_loss_calc NUMERIC;
BEGIN
  -- Calculate basic statistics
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN result = 'PROFIT' THEN 1 END),
    COUNT(CASE WHEN result = 'LOSS' THEN 1 END),
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)
  INTO 
    total_count, success_count, failed_count, pending_count
  FROM public.enhanced_trading_signals 
  WHERE user_id = user_uuid;

  -- Calculate derived indicators
  win_rate_calc := CASE WHEN (success_count + failed_count) > 0 
                      THEN (success_count::NUMERIC / (success_count + failed_count)::NUMERIC) * 100 
                      ELSE 0 END;
  
  SELECT 
    COALESCE(AVG(CASE WHEN result = 'PROFIT' THEN profit_loss_percentage END), 0),
    COALESCE(AVG(CASE WHEN result = 'LOSS' THEN ABS(profit_loss_percentage) END), 0),
    COALESCE(SUM(COALESCE(profit_loss_percentage, 0)), 0),
    COALESCE(MAX(CASE WHEN result = 'PROFIT' THEN profit_loss_percentage END), 0),
    COALESCE(MIN(CASE WHEN result = 'LOSS' THEN profit_loss_percentage END), 0)
  INTO avg_profit_calc, avg_loss_calc, total_pnl_calc, best_profit_calc, worst_loss_calc
  FROM public.enhanced_trading_signals 
  WHERE user_id = user_uuid AND result IS NOT NULL;

  -- Insert or update performance record
  INSERT INTO public.enhanced_signal_performance (
    user_id, date, total_signals, successful_signals, failed_signals, pending_signals,
    win_rate, average_profit, average_loss, total_profit_loss, 
    best_signal_profit, worst_signal_loss
  ) VALUES (
    user_uuid, CURRENT_DATE, total_count, success_count, failed_count, pending_count,
    win_rate_calc, avg_profit_calc, avg_loss_calc, total_pnl_calc,
    best_profit_calc, worst_loss_calc
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_signals = EXCLUDED.total_signals,
    successful_signals = EXCLUDED.successful_signals,
    failed_signals = EXCLUDED.failed_signals,
    pending_signals = EXCLUDED.pending_signals,
    win_rate = EXCLUDED.win_rate,
    average_profit = EXCLUDED.average_profit,
    average_loss = EXCLUDED.average_loss,
    total_profit_loss = EXCLUDED.total_profit_loss,
    best_signal_profit = EXCLUDED.best_signal_profit,
    worst_signal_loss = EXCLUDED.worst_signal_loss,
    updated_at = now();
END;
$$;

