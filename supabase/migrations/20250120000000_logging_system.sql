-- Phase 8: Logging + Monitoring + Alerting System
-- Migration Date: 2025-01-20
-- Description: Create tables for logging, alerts, and system health

-- ============================================
-- 1. CREATE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Log metadata
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('signal', 'decision', 'order', 'risk', 'position', 'portfolio', 'system', 'ui')),
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Related entities
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  position_id UUID,
  signal_id UUID REFERENCES public.tradingview_signals(id) ON DELETE SET NULL,
  
  -- Exchange/market context
  exchange TEXT,
  market_type TEXT CHECK (market_type IN ('spot', 'futures')),
  symbol TEXT,
  
  -- Source information
  source TEXT DEFAULT 'SYSTEM',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. CREATE ALERT_RULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rule configuration
  type TEXT NOT NULL CHECK (type IN ('error', 'risk', 'order_fill', 'pnl', 'drawdown', 'system')),
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'in_app', 'all')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Conditions (JSONB for flexibility)
  conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System rules cannot be deleted
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CREATE ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  
  -- Alert details
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
  type TEXT NOT NULL CHECK (type IN ('error', 'risk', 'order_fill', 'pnl', 'drawdown', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Related entities
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  position_id UUID,
  signal_id UUID REFERENCES public.tradingview_signals(id) ON DELETE SET NULL,
  
  -- Delivery status
  channels_sent JSONB DEFAULT '[]'::jsonb, -- ['telegram', 'email', 'in_app']
  telegram_sent BOOLEAN DEFAULT false,
  telegram_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  in_app_sent BOOLEAN DEFAULT true, -- Always sent to in-app
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Acknowledgment
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 4. CREATE SYSTEM_HEALTH TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Component being monitored
  component TEXT NOT NULL, -- 'auto-trader-worker', 'strategy-runner-worker', 'position-monitor-worker', 'portfolio-sync-worker', 'health-check-worker', 'binance-api', 'okx-api', 'database'
  component_type TEXT NOT NULL CHECK (component_type IN ('worker', 'exchange', 'database', 'system')),
  
  -- Health status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Metrics
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  
  -- Details
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one record per component
  UNIQUE(component)
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Logs indexes
CREATE INDEX IF NOT EXISTS idx_logs_user_id 
  ON public.logs(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logs_category_level 
  ON public.logs(category, level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_trade_id 
  ON public.logs(trade_id) 
  WHERE trade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logs_signal_id 
  ON public.logs(signal_id) 
  WHERE signal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logs_created_at 
  ON public.logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_action 
  ON public.logs(action, created_at DESC);

-- Alert rules indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id 
  ON public.alert_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled 
  ON public.alert_rules(is_enabled, type) 
  WHERE is_enabled = true;

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id 
  ON public.alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_unread 
  ON public.alerts(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_alerts_level 
  ON public.alerts(level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_type 
  ON public.alerts(type, created_at DESC);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_component 
  ON public.system_health(component);

CREATE INDEX IF NOT EXISTS idx_system_health_status 
  ON public.system_health(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_last_heartbeat 
  ON public.system_health(last_heartbeat DESC);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Logs Policies
DROP POLICY IF EXISTS "Users can view their own logs" 
  ON public.logs;
CREATE POLICY "Users can view their own logs" 
  ON public.logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service can insert logs" 
  ON public.logs;
CREATE POLICY "Service can insert logs" 
  ON public.logs 
  FOR INSERT 
  WITH CHECK (true);

-- Alert Rules Policies
DROP POLICY IF EXISTS "Users can manage their own alert rules" 
  ON public.alert_rules;
CREATE POLICY "Users can manage their own alert rules" 
  ON public.alert_rules 
  FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage alert rules" 
  ON public.alert_rules;
CREATE POLICY "Service can manage alert rules" 
  ON public.alert_rules 
  FOR ALL 
  WITH CHECK (true);

-- Alerts Policies
DROP POLICY IF EXISTS "Users can view their own alerts" 
  ON public.alerts;
CREATE POLICY "Users can view their own alerts" 
  ON public.alerts 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" 
  ON public.alerts;
CREATE POLICY "Users can update their own alerts" 
  ON public.alerts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert alerts" 
  ON public.alerts;
CREATE POLICY "Service can insert alerts" 
  ON public.alerts 
  FOR INSERT 
  WITH CHECK (true);

-- System Health Policies (Admin only - or service role)
DROP POLICY IF EXISTS "Service can manage system health" 
  ON public.system_health;
CREATE POLICY "Service can manage system health" 
  ON public.system_health 
  FOR ALL 
  WITH CHECK (true);

-- ============================================
-- 8. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp for alert_rules
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for alert_rules
DROP TRIGGER IF EXISTS update_alert_rules_updated_at_trigger 
  ON public.alert_rules;
CREATE TRIGGER update_alert_rules_updated_at_trigger
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

-- Function to update updated_at timestamp for system_health
CREATE OR REPLACE FUNCTION update_system_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for system_health
DROP TRIGGER IF EXISTS update_system_health_updated_at_trigger 
  ON public.system_health;
CREATE TRIGGER update_system_health_updated_at_trigger
  BEFORE UPDATE ON public.system_health
  FOR EACH ROW
  EXECUTE FUNCTION update_system_health_updated_at();

-- Function to automatically create in-app alert when log level is error or critical
CREATE OR REPLACE FUNCTION create_alert_on_critical_log()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level IN ('error', 'critical') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.alerts (
      user_id,
      level,
      type,
      title,
      body,
      context,
      trade_id,
      position_id,
      signal_id,
      in_app_sent,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.level,
      CASE 
        WHEN NEW.category = 'risk' THEN 'risk'
        WHEN NEW.category = 'order' THEN 'order_fill'
        WHEN NEW.category = 'system' THEN 'system'
        ELSE 'error'
      END,
      UPPER(NEW.category) || ' ' || UPPER(NEW.action),
      NEW.message,
      NEW.context,
      NEW.trade_id,
      NEW.position_id,
      NEW.signal_id,
      true,
      NEW.created_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic alert creation
DROP TRIGGER IF EXISTS create_alert_on_critical_log_trigger 
  ON public.logs;
CREATE TRIGGER create_alert_on_critical_log_trigger
  AFTER INSERT ON public.logs
  FOR EACH ROW
  EXECUTE FUNCTION create_alert_on_critical_log();

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE public.logs IS 'Comprehensive audit trail of all system events and user actions';
COMMENT ON TABLE public.alert_rules IS 'User-defined and system alert rules with conditions';
COMMENT ON TABLE public.alerts IS 'Generated alerts sent to users via various channels';
COMMENT ON TABLE public.system_health IS 'Health status and metrics for system components (workers, APIs, database)';
COMMENT ON COLUMN public.logs.context IS 'Additional context data in JSON format';
COMMENT ON COLUMN public.alert_rules.conditions IS 'Alert trigger conditions in JSON format';
COMMENT ON COLUMN public.alerts.channels_sent IS 'Array of channels where alert was sent: ["telegram", "email", "in_app"]';

