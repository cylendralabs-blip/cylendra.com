-- FIX_ADMIN_SECURITY_SETTINGS_RLS.sql
-- This script fixes the RLS policy on the 'admin_security_settings' table
-- to allow users to view and manage their own security settings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own security settings" ON public.admin_security_settings;
DROP POLICY IF EXISTS "System can manage security settings" ON public.admin_security_settings;

-- Policy 1: Users can view their own security settings
CREATE POLICY "Users can view own security settings"
  ON public.admin_security_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can manage their own security settings
CREATE POLICY "Users can manage own security settings"
  ON public.admin_security_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: System can manage security settings (for automated processes)
CREATE POLICY "System can manage security settings"
  ON public.admin_security_settings
  FOR ALL
  WITH CHECK (true);

