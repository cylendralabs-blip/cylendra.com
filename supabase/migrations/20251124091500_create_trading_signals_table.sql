-- Create signal tables if they are missing

CREATE TABLE IF NOT EXISTS public.signal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  timeframes TEXT[] DEFAULT ARRAY['15m', '1h', '4h', '1d'],
  symbols TEXT[] DEFAULT ARRAY['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
  min_confidence_score NUMERIC DEFAULT 70.0,
  enable_ai_analysis BOOLEAN DEFAULT false,
  enable_sentiment_analysis BOOLEAN DEFAULT false,
  enable_advanced_indicators BOOLEAN DEFAULT false,
  cache_duration_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL')),
  signal_strength TEXT NOT NULL CHECK (signal_strength IN ('EXCEPTIONAL', 'VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK')),
  confidence_score NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss_price NUMERIC,
  take_profit_price NUMERIC,
  risk_reward_ratio NUMERIC,
  technical_analysis JSONB DEFAULT '{}'::jsonb,
  volume_analysis JSONB DEFAULT '{}'::jsonb,
  pattern_analysis JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  confirmations TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIGGERED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMP WITH TIME ZONE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  result TEXT CHECK (result IN ('PROFIT', 'LOSS', 'BREAKEVEN')),
  profit_loss_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trading_signals_user_symbol ON public.trading_signals(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON public.trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON public.trading_signals(created_at DESC);

ALTER TABLE public.signal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_settings'
      AND policyname = 'Users can view their own signal settings'
  ) THEN
    CREATE POLICY "Users can view their own signal settings"
      ON public.signal_settings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_settings'
      AND policyname = 'Users can update their own signal settings'
  ) THEN
    CREATE POLICY "Users can update their own signal settings"
      ON public.signal_settings
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_settings'
      AND policyname = 'Users can insert their own signal settings'
  ) THEN
    CREATE POLICY "Users can insert their own signal settings"
      ON public.signal_settings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trading_signals'
      AND policyname = 'Users can view their own signals'
  ) THEN
    CREATE POLICY "Users can view their own signals"
      ON public.trading_signals
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trading_signals'
      AND policyname = 'Users can insert their own signals'
  ) THEN
    CREATE POLICY "Users can insert their own signals"
      ON public.trading_signals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trading_signals'
      AND policyname = 'Users can update their own signals'
  ) THEN
    CREATE POLICY "Users can update their own signals"
      ON public.trading_signals
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

