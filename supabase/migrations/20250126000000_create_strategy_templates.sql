-- ============================================
-- Create Strategy Templates Table
-- 
-- This migration creates the strategy_templates table
-- and related performance tracking tables
-- ============================================

-- Create strategy_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.strategy_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'dca_basic', 'dca_leverage_new', 'dca_leverage_modify', 'grid_classic', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create strategy_performance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.strategy_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.strategy_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  total_loss NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  profit_factor NUMERIC DEFAULT 0,
  active_trades_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(strategy_id, date)
);

-- Create strategy_trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.strategy_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.strategy_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  profit_loss NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.strategy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_trades ENABLE ROW LEVEL SECURITY;

-- Security policies for strategy_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_templates' 
    AND policyname = 'Users can view their own strategies'
  ) THEN
    CREATE POLICY "Users can view their own strategies" 
      ON public.strategy_templates 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_templates' 
    AND policyname = 'Users can create their own strategies'
  ) THEN
    CREATE POLICY "Users can create their own strategies" 
      ON public.strategy_templates 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_templates' 
    AND policyname = 'Users can update their own strategies'
  ) THEN
    CREATE POLICY "Users can update their own strategies" 
      ON public.strategy_templates 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_templates' 
    AND policyname = 'Users can delete their own strategies'
  ) THEN
    CREATE POLICY "Users can delete their own strategies" 
      ON public.strategy_templates 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Security policies for strategy_performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_performance' 
    AND policyname = 'Users can view their own strategy performance'
  ) THEN
    CREATE POLICY "Users can view their own strategy performance" 
      ON public.strategy_performance 
      FOR ALL 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Security policies for strategy_trades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'strategy_trades' 
    AND policyname = 'Users can view their own strategy trades'
  ) THEN
    CREATE POLICY "Users can view their own strategy trades" 
      ON public.strategy_trades 
      FOR ALL 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create or replace function to update updated_at for strategy_templates
CREATE OR REPLACE FUNCTION update_strategy_templates_updated_at()
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

-- Create trigger for strategy_templates
DROP TRIGGER IF EXISTS strategy_templates_updated_at ON public.strategy_templates;
CREATE TRIGGER strategy_templates_updated_at
  BEFORE UPDATE ON public.strategy_templates
  FOR EACH ROW 
  EXECUTE FUNCTION update_strategy_templates_updated_at();

-- Create or replace function to update updated_at for strategy_performance
CREATE OR REPLACE FUNCTION update_strategy_performance_updated_at()
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

-- Create trigger for strategy_performance
DROP TRIGGER IF EXISTS strategy_performance_updated_at ON public.strategy_performance;
CREATE TRIGGER strategy_performance_updated_at
  BEFORE UPDATE ON public.strategy_performance
  FOR EACH ROW 
  EXECUTE FUNCTION update_strategy_performance_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategy_templates_user 
  ON public.strategy_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_type 
  ON public.strategy_templates(type);
CREATE INDEX IF NOT EXISTS idx_strategy_templates_active 
  ON public.strategy_templates(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy 
  ON public.strategy_performance(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_user 
  ON public.strategy_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_date 
  ON public.strategy_performance(date DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_trades_strategy 
  ON public.strategy_trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_trades_user 
  ON public.strategy_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_trades_status 
  ON public.strategy_trades(status);

