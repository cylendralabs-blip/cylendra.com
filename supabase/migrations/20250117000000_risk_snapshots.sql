-- Risk Snapshots Storage Migration
-- Phase 5: Risk Management Engine (Advanced)
-- Database tables for risk management snapshots

-- Daily Loss Snapshots Table
CREATE TABLE IF NOT EXISTS public.daily_loss_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  daily_pnl NUMERIC NOT NULL DEFAULT 0,
  daily_pnl_percentage NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  
  trades_count INTEGER NOT NULL DEFAULT 0,
  closed_trades_count INTEGER NOT NULL DEFAULT 0,
  active_trades_count INTEGER NOT NULL DEFAULT 0,
  
  peak_equity NUMERIC NOT NULL,
  current_equity NUMERIC NOT NULL,
  starting_equity NUMERIC NOT NULL,
  
  max_daily_loss_usd NUMERIC,
  max_daily_loss_percentage NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Exposure Snapshots Table
CREATE TABLE IF NOT EXISTS public.exposure_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  total_exposure NUMERIC NOT NULL DEFAULT 0,
  total_exposure_percentage NUMERIC NOT NULL DEFAULT 0,
  symbol_exposures JSONB NOT NULL DEFAULT '{}',
  
  spot_exposure NUMERIC NOT NULL DEFAULT 0,
  futures_exposure NUMERIC NOT NULL DEFAULT 0,
  
  active_trades_count INTEGER NOT NULL DEFAULT 0,
  current_equity NUMERIC NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drawdown Snapshots Table
CREATE TABLE IF NOT EXISTS public.drawdown_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  peak_equity NUMERIC NOT NULL,
  peak_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_equity NUMERIC NOT NULL,
  
  current_drawdown NUMERIC NOT NULL DEFAULT 0,
  current_drawdown_percentage NUMERIC NOT NULL DEFAULT 0,
  max_drawdown NUMERIC NOT NULL DEFAULT 0,
  max_drawdown_percentage NUMERIC NOT NULL DEFAULT 0,
  drawdown_duration_days INTEGER NOT NULL DEFAULT 0,
  
  recovery_needed NUMERIC NOT NULL DEFAULT 0,
  recovery_percentage NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kill Switch State Table
CREATE TABLE IF NOT EXISTS public.kill_switch_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  is_active BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('automatic', 'manual', 'admin')),
  
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  can_reset BOOLEAN NOT NULL DEFAULT true,
  reset_at TIMESTAMP WITH TIME ZONE,
  reset_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Risk Snapshots Table (Consolidated)
CREATE TABLE IF NOT EXISTS public.risk_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  equity NUMERIC NOT NULL,
  peak_equity NUMERIC NOT NULL,
  starting_equity NUMERIC NOT NULL,
  
  daily_pnl NUMERIC NOT NULL DEFAULT 0,
  daily_pnl_percentage NUMERIC NOT NULL DEFAULT 0,
  
  current_drawdown_percentage NUMERIC NOT NULL DEFAULT 0,
  max_drawdown_percentage NUMERIC NOT NULL DEFAULT 0,
  
  total_exposure NUMERIC NOT NULL DEFAULT 0,
  total_exposure_percentage NUMERIC NOT NULL DEFAULT 0,
  symbol_exposures JSONB NOT NULL DEFAULT '{}',
  
  active_trades_count INTEGER NOT NULL DEFAULT 0,
  
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  warnings TEXT[] NOT NULL DEFAULT '{}',
  alerts TEXT[] NOT NULL DEFAULT '{}',
  
  is_killed BOOLEAN NOT NULL DEFAULT false,
  kill_switch_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_loss_snapshots_user_date 
  ON public.daily_loss_snapshots(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_loss_snapshots_date 
  ON public.daily_loss_snapshots(date DESC);

CREATE INDEX IF NOT EXISTS idx_exposure_snapshots_user_timestamp 
  ON public.exposure_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_drawdown_snapshots_user_timestamp 
  ON public.drawdown_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_kill_switch_states_user 
  ON public.kill_switch_states(user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_kill_switch_states_active 
  ON public.kill_switch_states(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_user_timestamp 
  ON public.risk_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_risk_level 
  ON public.risk_snapshots(risk_level) 
  WHERE risk_level IN ('HIGH', 'CRITICAL');

-- Enable Row Level Security
ALTER TABLE public.daily_loss_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exposure_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawdown_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switch_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_loss_snapshots
DROP POLICY IF EXISTS "Users can view their own daily loss snapshots" ON public.daily_loss_snapshots;
CREATE POLICY "Users can view their own daily loss snapshots" 
  ON public.daily_loss_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert daily loss snapshots" ON public.daily_loss_snapshots;
CREATE POLICY "Service can insert daily loss snapshots" 
  ON public.daily_loss_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for exposure_snapshots
DROP POLICY IF EXISTS "Users can view their own exposure snapshots" ON public.exposure_snapshots;
CREATE POLICY "Users can view their own exposure snapshots" 
  ON public.exposure_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert exposure snapshots" ON public.exposure_snapshots;
CREATE POLICY "Service can insert exposure snapshots" 
  ON public.exposure_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for drawdown_snapshots
DROP POLICY IF EXISTS "Users can view their own drawdown snapshots" ON public.drawdown_snapshots;
CREATE POLICY "Users can view their own drawdown snapshots" 
  ON public.drawdown_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert drawdown snapshots" ON public.drawdown_snapshots;
CREATE POLICY "Service can insert drawdown snapshots" 
  ON public.drawdown_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for kill_switch_states
DROP POLICY IF EXISTS "Users can view their own kill switch state" ON public.kill_switch_states;
CREATE POLICY "Users can view their own kill switch state" 
  ON public.kill_switch_states 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own kill switch state" ON public.kill_switch_states;
CREATE POLICY "Users can update their own kill switch state" 
  ON public.kill_switch_states 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage kill switch states" ON public.kill_switch_states;
CREATE POLICY "Service can manage kill switch states" 
  ON public.kill_switch_states 
  FOR ALL 
  USING (true);

-- RLS Policies for risk_snapshots
DROP POLICY IF EXISTS "Users can view their own risk snapshots" ON public.risk_snapshots;
CREATE POLICY "Users can view their own risk snapshots" 
  ON public.risk_snapshots 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert risk snapshots" ON public.risk_snapshots;
CREATE POLICY "Service can insert risk snapshots" 
  ON public.risk_snapshots 
  FOR INSERT 
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_daily_loss_snapshots_updated_at ON public.daily_loss_snapshots;
CREATE TRIGGER update_daily_loss_snapshots_updated_at
  BEFORE UPDATE ON public.daily_loss_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kill_switch_states_updated_at ON public.kill_switch_states;
CREATE TRIGGER update_kill_switch_states_updated_at
  BEFORE UPDATE ON public.kill_switch_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily loss snapshots at midnight UTC
CREATE OR REPLACE FUNCTION reset_daily_loss_snapshots()
RETURNS void AS $$
BEGIN
  -- This would be called by a cron job at midnight UTC
  -- For now, it's a placeholder
  -- Daily snapshots are created on-demand, not reset
END;
$$ LANGUAGE plpgsql;
