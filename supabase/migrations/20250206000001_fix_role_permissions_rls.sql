-- Fix RLS Policy for role_permissions table
-- This migration fixes the RLS policy to work with the new RBAC system

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Owners can manage permissions" ON public.role_permissions;

-- Create a new policy that allows owners to manage permissions
-- using the new RBAC system (user_role_assignments + roles)
DO $$
BEGIN
  -- Check if we have the new RBAC tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_role_assignments') THEN
    -- Use new RBAC system
    EXECUTE 'CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_role_assignments ura
          JOIN public.roles r ON ura.role_id = r.id
          WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true 
            AND (ura.expires_at IS NULL OR ura.expires_at > now())
            AND r.name = ''owner''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_role_assignments ura
          JOIN public.roles r ON ura.role_id = r.id
          WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true 
            AND (ura.expires_at IS NULL OR ura.expires_at > now())
            AND r.name = ''owner''
        )
      )';
  ELSIF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_admin') THEN
    -- Fallback to is_admin function
    EXECUTE 'CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()))';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    -- Fallback to old user_roles table
    EXECUTE 'CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = ''owner''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = ''owner''
        )
      )';
  ELSE
    -- Final fallback for environments without RBAC
    EXECUTE 'CREATE POLICY "Owners can manage permissions"
      ON public.role_permissions
      FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

