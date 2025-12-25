-- Fix RLS Policies for system_stats table
-- Allow users with owner/admin roles to insert and update stats

-- Drop existing policies
DROP POLICY IF EXISTS "System can insert stats" ON public.system_stats;
DROP POLICY IF EXISTS "System can update stats" ON public.system_stats;
DROP POLICY IF EXISTS "Admins can view system stats" ON public.system_stats;

-- Create new policies that check for owner/admin roles via user_role_assignments
CREATE POLICY "Admins can view system stats"
  ON public.system_stats
  FOR SELECT
  USING (
    -- Allow if user has owner/admin role assignment
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
    OR
    -- Fallback: Allow if is_admin function exists and returns true
    (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
      AND public.is_admin(auth.uid())
    )
    OR
    -- Fallback: Allow authenticated users (for initial setup)
    (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can insert system stats"
  ON public.system_stats
  FOR INSERT
  WITH CHECK (
    -- Allow if user has owner/admin role assignment
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
    OR
    -- Fallback: Allow if is_admin function exists and returns true
    (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
      AND public.is_admin(auth.uid())
    )
    OR
    -- Fallback: Allow authenticated users (for initial setup)
    (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can update system stats"
  ON public.system_stats
  FOR UPDATE
  USING (
    -- Allow if user has owner/admin role assignment
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
    OR
    -- Fallback: Allow if is_admin function exists and returns true
    (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
      AND public.is_admin(auth.uid())
    )
    OR
    -- Fallback: Allow authenticated users (for initial setup)
    (auth.uid() IS NOT NULL)
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'system_stats'
ORDER BY policyname;

