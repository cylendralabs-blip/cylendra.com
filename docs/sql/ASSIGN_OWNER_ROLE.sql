-- ============================================
-- Assign Owner Role to Main Admin Account
-- ============================================
-- User: veneradrive@gmail.com
-- User ID: 7dfab25b-3ef0-44ee-a418-12245e37b919
-- 
-- This script assigns the "owner" role to the main admin account,
-- giving them full platform control with all permissions.
-- ============================================

-- Step 1: Ensure roles table exists and has owner role
DO $$
BEGIN
  -- Insert owner role if it doesn't exist
  INSERT INTO public.roles (name, display_name, description, is_system_role, permissions)
  VALUES (
    'owner',
    'Owner',
    'Full platform control',
    true,
    '{"*": true}'::jsonb
  )
  ON CONFLICT (name) DO NOTHING;
  
  RAISE NOTICE 'Owner role ensured';
END $$;

-- Step 2: Get the owner role ID and assign to user
DO $$
DECLARE
  owner_role_id uuid;
  user_id_val uuid := '7dfab25b-3ef0-44ee-a418-12245e37b919';
BEGIN
  -- Get owner role ID
  SELECT id INTO owner_role_id
  FROM public.roles
  WHERE name = 'owner'
  LIMIT 1;

  IF owner_role_id IS NULL THEN
    RAISE EXCEPTION 'Owner role not found. Please run migrations first.';
  END IF;

  -- Step 3: Remove any existing role assignments for this user
  DELETE FROM public.user_role_assignments
  WHERE user_id = user_id_val;

  -- Step 4: Assign owner role
  INSERT INTO public.user_role_assignments (
    user_id,
    role_id,
    assigned_by,
    is_active,
    expires_at
  ) VALUES (
    user_id_val,
    owner_role_id,
    user_id_val, -- Self-assigned
    true,
    NULL -- No expiration
  )
  ON CONFLICT (user_id, role_id) DO UPDATE
  SET is_active = true,
      expires_at = NULL,
      assigned_at = now();

  RAISE NOTICE 'Successfully assigned owner role to user %', user_id_val;
END $$;

-- Step 5: Verify the assignment
SELECT 
  u.email,
  r.name as role_name,
  r.display_name,
  r.permissions,
  ura.is_active,
  ura.assigned_at,
  CASE 
    WHEN r.permissions->>'*' = 'true' THEN '✅ Full Access (Owner)'
    ELSE '⚠️ Limited Access'
  END as access_level
FROM public.user_role_assignments ura
JOIN public.roles r ON r.id = ura.role_id
JOIN auth.users u ON u.id = ura.user_id
WHERE ura.user_id = '7dfab25b-3ef0-44ee-a418-12245e37b919'
  AND ura.is_active = true;

-- Step 6: Display summary
DO $$
DECLARE
  role_count integer;
BEGIN
  SELECT COUNT(*) INTO role_count
  FROM public.user_role_assignments ura
  JOIN public.roles r ON r.id = ura.role_id
  WHERE ura.user_id = '7dfab25b-3ef0-44ee-a418-12245e37b919'
    AND ura.is_active = true
    AND r.name = 'owner';
  
  IF role_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS: Owner role assigned successfully!';
    RAISE NOTICE 'User: veneradrive@gmail.com';
    RAISE NOTICE 'User ID: 7dfab25b-3ef0-44ee-a418-12245e37b919';
    RAISE NOTICE 'Role: Owner (Full Platform Control)';
  ELSE
    RAISE WARNING '⚠️ WARNING: Owner role assignment may have failed. Please check the results above.';
  END IF;
END $$;
