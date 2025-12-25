-- ============================================
-- CRITICAL SECURITY FIX: Complete Database Security Implementation
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Create two_factor_auth table
CREATE TABLE public.two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret text NOT NULL,
  backup_codes text[] NOT NULL DEFAULT '{}',
  is_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create security_logs table
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Create settings_backups table
CREATE TABLE public.settings_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backup_name text NOT NULL,
  bot_settings jsonb,
  api_settings jsonb,
  strategies jsonb,
  is_auto_backup boolean DEFAULT false,
  backup_type text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- 6. Add platform column to portfolio_balances (missing from schema)
ALTER TABLE public.portfolio_balances ADD COLUMN IF NOT EXISTS platform text;

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_backups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update existing is_admin function to use user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- api_keys policies
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- bot_settings policies
CREATE POLICY "Users can view their own bot settings"
  ON public.bot_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot settings"
  ON public.bot_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot settings"
  ON public.bot_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot settings"
  ON public.bot_settings FOR DELETE
  USING (auth.uid() = user_id);

-- connection_status policies
CREATE POLICY "Users can view their own connection status"
  ON public.connection_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connection status"
  ON public.connection_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connection status"
  ON public.connection_status FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connection status"
  ON public.connection_status FOR DELETE
  USING (auth.uid() = user_id);

-- dca_orders policies
CREATE POLICY "Users can view their own DCA orders"
  ON public.dca_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DCA orders"
  ON public.dca_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DCA orders"
  ON public.dca_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DCA orders"
  ON public.dca_orders FOR DELETE
  USING (auth.uid() = user_id);

-- dca_strategies policies
CREATE POLICY "Users can view their own DCA strategies"
  ON public.dca_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DCA strategies"
  ON public.dca_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DCA strategies"
  ON public.dca_strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DCA strategies"
  ON public.dca_strategies FOR DELETE
  USING (auth.uid() = user_id);

-- market_analysis policies (public read, admin write)
CREATE POLICY "Anyone can view market analysis"
  ON public.market_analysis FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert market analysis"
  ON public.market_analysis FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update market analysis"
  ON public.market_analysis FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete market analysis"
  ON public.market_analysis FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- portfolio_balances policies
CREATE POLICY "Users can view their own portfolio balances"
  ON public.portfolio_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio balances"
  ON public.portfolio_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio balances"
  ON public.portfolio_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio balances"
  ON public.portfolio_balances FOR DELETE
  USING (auth.uid() = user_id);

-- profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- trades policies
CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON public.trades FOR DELETE
  USING (auth.uid() = user_id);

-- trading_performance policies
CREATE POLICY "Users can view their own trading performance"
  ON public.trading_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading performance"
  ON public.trading_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading performance"
  ON public.trading_performance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading performance"
  ON public.trading_performance FOR DELETE
  USING (auth.uid() = user_id);

-- user_roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- two_factor_auth policies
CREATE POLICY "Users can view their own 2FA settings"
  ON public.two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
  ON public.two_factor_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON public.two_factor_auth FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings"
  ON public.two_factor_auth FOR DELETE
  USING (auth.uid() = user_id);

-- security_logs policies
CREATE POLICY "Users can view their own security logs"
  ON public.security_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security logs"
  ON public.security_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs"
  ON public.security_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- settings_backups policies
CREATE POLICY "Users can view their own backups"
  ON public.settings_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups"
  ON public.settings_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups"
  ON public.settings_backups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON public.settings_backups FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_two_factor_auth_updated_at
  BEFORE UPDATE ON public.two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX idx_two_factor_auth_user_id ON public.two_factor_auth(user_id);
CREATE INDEX idx_settings_backups_user_id ON public.settings_backups(user_id);