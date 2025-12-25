-- Simple OKX Debug Query
-- Copy and paste this in Supabase SQL Editor

-- 1. Check your OKX API key configuration
SELECT 
  platform,
  testnet,
  is_active,
  CASE 
    WHEN passphrase IS NOT NULL AND passphrase != '' THEN '✅ SET'
    ELSE '❌ MISSING'
  END as passphrase_status,
  created_at
FROM api_keys 
WHERE platform = 'okx-demo'
ORDER BY created_at DESC
LIMIT 1;

-- Expected Result:
-- platform: okx-demo
-- testnet: true (MUST BE TRUE!)
-- is_active: true
-- passphrase_status: ✅ SET

-- If testnet is FALSE, that's the problem!
-- The system won't send the demo header.

-- 2. Quick fix if testnet is false:
-- UPDATE api_keys 
-- SET testnet = true 
-- WHERE platform = 'okx-demo';
