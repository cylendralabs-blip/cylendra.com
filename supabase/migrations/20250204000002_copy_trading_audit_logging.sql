/**
 * Copy Trading Audit Logging
 * 
 * Phase X.17 - Security Improvements
 * 
 * Adds audit logging table for copy trading operations
 */

-- Audit log table for copy trading
CREATE TABLE IF NOT EXISTS public.copy_trading_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'FOLLOW', 'UNFOLLOW', 'CREATE_STRATEGY', 'UPDATE_STRATEGY', 'DELETE_STRATEGY', 'TRADE_COPIED', 'TRADE_FAILED'
  entity_type TEXT NOT NULL, -- 'STRATEGY', 'FOLLOWER', 'TRADE'
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS copy_trading_audit_log_user_id_idx 
  ON public.copy_trading_audit_log(user_id);

CREATE INDEX IF NOT EXISTS copy_trading_audit_log_action_idx 
  ON public.copy_trading_audit_log(action);

CREATE INDEX IF NOT EXISTS copy_trading_audit_log_created_at_idx 
  ON public.copy_trading_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS copy_trading_audit_log_entity_idx 
  ON public.copy_trading_audit_log(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.copy_trading_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own audit logs"
  ON public.copy_trading_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all audit logs"
  ON public.copy_trading_audit_log
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to log audit event
CREATE OR REPLACE FUNCTION public.log_copy_trading_audit(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.copy_trading_audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

