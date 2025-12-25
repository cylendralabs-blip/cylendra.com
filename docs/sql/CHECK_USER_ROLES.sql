-- Check User Roles for Specific User
-- User ID: 7dfab25b-3ef0-44ee-a418-12245e37b919
-- Email: veneradrive@gmail.com

-- Step 1: Check if user exists
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE id = '7dfab25b-3ef0-44ee-a418-12245e37b919'
   OR email = 'veneradrive@gmail.com';

-- Step 2: Check role assignments
SELECT 
  ura.id,
  ura.user_id,
  ura.role_id,
  ura.is_active,
  ura.expires_at,
  ura.assigned_at,
  r.name as role_name,
  r.display_name,
  r.permissions
FROM public.user_role_assignments ura
JOIN public.roles r ON r.id = ura.role_id
WHERE ura.user_id = '7dfab25b-3ef0-44ee-a418-12245e37b919'
  AND ura.is_active = true;

-- Step 3: Check if owner role exists
SELECT * FROM public.roles WHERE name = 'owner';

-- Step 4: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('user_role_assignments', 'roles')
ORDER BY tablename, policyname;

-- Step 5: Test direct query (bypassing RLS for testing)
SET LOCAL role TO postgres;
SELECT 
  ura.user_id,
  r.name as role_name
FROM public.user_role_assignments ura
JOIN public.roles r ON r.id = ura.role_id
WHERE ura.user_id = '7dfab25b-3ef0-44ee-a418-12245e37b919'
  AND ura.is_active = true;
RESET role;

