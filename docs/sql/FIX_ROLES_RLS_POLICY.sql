-- Fix RLS Policy for roles table
-- Allow users to read roles if they have active role assignments

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.roles;

-- Create new policy: Users can view roles if they have active assignments
CREATE POLICY "Users can view roles via assignments"
  ON public.roles
  FOR SELECT
  USING (
    -- Allow if user has active role assignment
    EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = auth.uid()
        AND role_id = roles.id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    )
    OR
    -- Allow if user is admin (via old method)
    (
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
      AND public.is_admin(auth.uid())
    )
    OR
    -- Allow if authenticated (fallback for initial setup)
    (auth.uid() IS NOT NULL)
  );

-- Verify the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'roles'
ORDER BY policyname;

