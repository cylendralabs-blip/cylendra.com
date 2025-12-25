-- Fix Strategy User IDs
-- This script updates all strategy instances to use the correct user_id

-- First, let's see what users we have
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Update all strategy instances to use the current user's ID
-- Replace 'YOUR_CURRENT_USER_ID' with the actual user ID from the query above
-- UPDATE strategy_instances 
-- SET user_id = 'YOUR_CURRENT_USER_ID'
-- WHERE user_id != 'YOUR_CURRENT_USER_ID';

-- Verify the update
-- SELECT id, name, user_id, status, created_at 
-- FROM strategy_instances 
-- ORDER BY created_at DESC;

