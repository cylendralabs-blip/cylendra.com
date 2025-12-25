-- Phase Admin F: Security, Permissions & Audit Infrastructure
-- Create RBAC, audit logs, security events, and admin security tables

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name IN ('owner', 'admin', 'support', 'analyst')),
  display_name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, is_system_role, permissions) VALUES
  ('owner', 'Owner', 'Full platform control', true, '{"*": true}'::jsonb),
  ('admin', 'Admin', 'Full user management and supervision', true, '{
    "view_analytics": true,
    "modify_analytics": false,
    "risk_management": true,
    "kill_switch": true,
    "bot_control": true,
    "feature_flags": true,
    "user_actions": true,
    "support_actions": true,
    "system_config": false,
    "api_key_visibility": false,
    "ticket_categories": true
  }'::jsonb),
  ('support', 'Support', 'Ticket handling and user support', true, '{
    "view_analytics": false,
    "modify_analytics": false,
    "risk_management": false,
    "kill_switch": false,
    "bot_control": false,
    "feature_flags": false,
    "user_actions": false,
    "support_actions": true,
    "system_config": false,
    "api_key_visibility": false,
    "ticket_categories": true
  }'::jsonb),
  ('analyst', 'Analyst', 'Read-only access to analytics', true, '{
    "view_analytics": true,
    "modify_analytics": false,
    "risk_management": false,
    "kill_switch": false,
    "bot_control": false,
    "feature_flags": false,
    "user_actions": false,
    "support_actions": false,
    "system_config": false,
    "api_key_visibility": false,
    "ticket_categories": false
  }'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- RLS Policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view roles"
      ON public.roles
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view roles"
      ON public.roles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can view roles"
      ON public.roles
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 2. USER ROLES ASSIGNMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON public.user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON public.user_role_assignments(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own role assignments
CREATE POLICY "Users can view own roles"
  ON public.user_role_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only owners/admins can manage role assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 3. ADMIN AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL,
  target_type text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

-- RLS Policies
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view audit logs"
      ON public.admin_audit_logs
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view audit logs"
      ON public.admin_audit_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can view audit logs"
      ON public.admin_audit_logs
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- System can insert audit logs (immutable)
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 4. ADMIN SECURITY SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text, -- Encrypted TOTP secret
  two_factor_backup_codes text[], -- Encrypted backup codes
  login_alerts_enabled boolean DEFAULT true,
  session_timeout_hours integer DEFAULT 12,
  last_login_at timestamptz,
  last_login_ip text,
  last_login_user_agent text,
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_security_user_id ON public.admin_security_settings(user_id);

-- RLS Policies
ALTER TABLE public.admin_security_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own security settings
CREATE POLICY "Users can view own security settings"
  ON public.admin_security_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage security settings
CREATE POLICY "System can manage security settings"
  ON public.admin_security_settings
  FOR ALL
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_admin_security_updated_at
  BEFORE UPDATE ON public.admin_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. ADMIN LOGIN ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  success boolean NOT NULL,
  failure_reason text,
  two_factor_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_user_id ON public.admin_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email ON public.admin_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON public.admin_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_created_at ON public.admin_login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_success ON public.admin_login_attempts(success);

-- RLS Policies
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view login attempts"
      ON public.admin_login_attempts
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view login attempts"
      ON public.admin_login_attempts
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can view login attempts"
      ON public.admin_login_attempts
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
  ON public.admin_login_attempts
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. ADMIN ACTIVE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address text NOT NULL,
  user_agent text,
  last_activity_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_user_id ON public.admin_active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_token ON public.admin_active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_expires ON public.admin_active_sessions(expires_at);

-- RLS Policies
ALTER TABLE public.admin_active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.admin_active_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage sessions
CREATE POLICY "System can manage sessions"
  ON public.admin_active_sessions
  FOR ALL
  WITH CHECK (true);

-- ============================================
-- 7. SECURITY EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz DEFAULT now() NOT NULL,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON public.security_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_admin_id ON public.security_events(admin_id);

-- RLS Policies
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view security events"
      ON public.security_events
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view security events"
      ON public.security_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can view security events"
      ON public.security_events
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- System can insert security events
CREATE POLICY "System can insert security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (true);

-- Admins can update security events (mark as resolved)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can update security events"
      ON public.security_events
      FOR UPDATE
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can update security events"
      ON public.security_events
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can update security events"
      ON public.security_events
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 8. ROLE PERMISSIONS TABLE (Granular permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(role_id, permission_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON public.role_permissions(permission_key);

-- RLS Policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only owners can manage permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'owner'
        )
      );
  ELSE
    CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. CONFIGURATION CHANGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.configuration_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  config_key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  requires_confirmation boolean DEFAULT false,
  confirmed_at timestamptz,
  cooldown_until timestamptz,
  auto_revert_at timestamptz,
  reverted boolean DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_config_change_logs_admin_id ON public.configuration_change_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_config_change_logs_config_key ON public.configuration_change_logs(config_key);
CREATE INDEX IF NOT EXISTS idx_config_change_logs_created_at ON public.configuration_change_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.configuration_change_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view config change logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view config change logs"
      ON public.configuration_change_logs
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view config change logs"
      ON public.configuration_change_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
      );
  ELSE
    CREATE POLICY "Admins can view config change logs"
      ON public.configuration_change_logs
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- System can insert config change logs
CREATE POLICY "System can insert config change logs"
  ON public.configuration_change_logs
  FOR INSERT
  WITH CHECK (true);

