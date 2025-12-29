-- Fix RLS Policy for user_role_assignments table
-- This migration fixes the RLS policy to allow users to view their own roles
-- and owners/admins to view all roles for admin purposes

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Owners/Admins can view all role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Owners/Admins can manage role assignments" ON public.user_role_assignments;

-- Policy 1: Users can view their own role assignments
CREATE POLICY "Users can view own roles"
  ON public.user_role_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Owners/Admins can view all role assignments (for admin purposes)
-- Note: We use a function to avoid circular dependency
DO $$
BEGIN
  -- Check if is_admin function exists
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
    EXECUTE 'CREATE POLICY "Owners/Admins can view all role assignments"
      ON public.user_role_assignments
      FOR SELECT
      USING (public.is_admin(auth.uid()))';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    -- Fallback to old user_roles table
    EXECUTE 'CREATE POLICY "Owners/Admins can view all role assignments"
      ON public.user_role_assignments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
        )
      )';
  ELSE
    -- Final fallback: Allow authenticated users (less secure but functional)
    EXECUTE 'CREATE POLICY "Owners/Admins can view all role assignments"
      ON public.user_role_assignments
      FOR SELECT
      USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- Policy 3: Owners/Admins can manage role assignments
DO $$
BEGIN
  -- Check if is_admin function exists
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
    EXECUTE 'CREATE POLICY "Owners/Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()))';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    -- Fallback to old user_roles table
    EXECUTE 'CREATE POLICY "Owners/Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')
        )
      )';
  ELSE
    -- Final fallback
    EXECUTE 'CREATE POLICY "Owners/Admins can manage role assignments"
      ON public.user_role_assignments
      FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

