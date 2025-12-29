-- Debug Script: Check OKX API Keys Configuration
-- Run this in Supabase SQL Editor to verify your OKX setup

-- 1. Check all OKX API keys
SELECT 
  id,
  platform,
  testnet,
  is_active,
  created_at,
  LEFT(api_key, 10) || '...' as api_key_preview,
  CASE 
    WHEN passphrase IS NOT NULL THEN 'SET'
    ELSE 'NOT SET'
  END as passphrase_status
FROM api_keys 
WHERE platform LIKE 'okx%'
ORDER BY created_at DESC;

-- Expected results:
-- platform='okx-demo' should have testnet=true
-- platform='okx' should have testnet=false

-- 2. Check if testnet flag is set correctly
SELECT 
  platform,
  testnet,
  COUNT(*) as count
FROM api_keys 
WHERE platform LIKE 'okx%'
GROUP BY platform, testnet;

-- 3. Check recent auto_trades for OKX
SELECT 
  id,
  platform,
  status,
  created_at
FROM auto_trades 
WHERE platform LIKE 'okx%'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check detailed logs
SELECT 
  atl.step,
  atl.message,
  atl.data,
  atl.created_at
FROM auto_trade_logs atl
JOIN auto_trades at ON at.id = atl.auto_trade_id
WHERE at.platform LIKE 'okx%'
ORDER BY atl.created_at DESC
LIMIT 10;

-- 5. Verify platform constraint
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'api_keys_platform_check';

-- This should show that 'okx-demo' is allowed

-- 6. Test query to simulate what execute-trade does
SELECT 
  platform,
  api_key,
  secret_key,
  passphrase,
  testnet,
  CASE 
    WHEN platform = 'okx-demo' THEN 'Should use Demo mode (testnet=true)'
    WHEN platform = 'okx' THEN 'Should use Live mode (testnet=false)'
    ELSE 'Unknown platform'
  END as expected_behavior
FROM api_keys
WHERE platform LIKE 'okx%'
AND is_active = true;
