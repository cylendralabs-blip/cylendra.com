/**
 * Copy Trading Monitoring & Alerts
 * 
 * Phase X.17 - Monitoring & Alerts
 * 
 * Adds monitoring and alerting system
 */

-- Alerts Table
CREATE TABLE IF NOT EXISTS public.copy_trading_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'HIGH_DRAWDOWN', 'LOSS_LIMIT_REACHED', 'STRATEGY_PAUSED', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  strategy_id UUID REFERENCES public.copy_strategies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS copy_trading_alerts_user_id_idx 
  ON public.copy_trading_alerts(user_id) 
  WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS copy_trading_alerts_strategy_id_idx 
  ON public.copy_trading_alerts(strategy_id) 
  WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS copy_trading_alerts_type_severity_idx 
  ON public.copy_trading_alerts(type, severity) 
  WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS copy_trading_alerts_created_at_idx 
  ON public.copy_trading_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.copy_trading_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own alerts"
  ON public.copy_trading_alerts
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_user_id FROM public.copy_strategies WHERE id = strategy_id
  ));

CREATE POLICY "Service role can manage all alerts"
  ON public.copy_trading_alerts
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can resolve their own alerts"
  ON public.copy_trading_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

