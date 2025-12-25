-- ============================================
-- فحص بيانات OKX في قاعدة البيانات
-- ============================================
-- يمكنك تنفيذ هذا في Supabase SQL Editor

-- 1. فحص API Keys لـ OKX
SELECT 
  id,
  platform,
  testnet,
  is_active,
  created_at,
  LENGTH(api_key) as api_key_length,
  LENGTH(secret_key) as secret_key_length,
  CASE 
    WHEN passphrase IS NULL OR passphrase = '' THEN '❌ Missing'
    ELSE '✅ Present'
  END as passphrase_status
FROM api_keys
WHERE platform IN ('okx', 'okx-demo')
ORDER BY created_at DESC;

-- 2. فحص Portfolio Balances لـ OKX
SELECT 
  pb.id,
  pb.api_key_id,
  ak.platform,
  pb.symbol,
  pb.total_balance,
  pb.free_balance,
  pb.locked_balance,
  pb.market_type,
  pb.last_updated,
  ak.testnet
FROM portfolio_balances pb
JOIN api_keys ak ON pb.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY pb.last_updated DESC
LIMIT 50;

-- 3. فحص آخر محاولات جلب الرصيد
SELECT 
  ak.id as api_key_id,
  ak.platform,
  ak.testnet,
  COUNT(pb.id) as balance_records_count,
  MAX(pb.last_updated) as last_balance_update,
  SUM(CASE WHEN pb.total_balance > 0 THEN 1 ELSE 0 END) as non_zero_balances
FROM api_keys ak
LEFT JOIN portfolio_balances pb ON ak.id = pb.api_key_id
WHERE ak.platform IN ('okx', 'okx-demo')
GROUP BY ak.id, ak.platform, ak.testnet
ORDER BY last_balance_update DESC NULLS LAST;

-- 4. فحص Connection Status لـ OKX
SELECT 
  cs.api_key_id,
  ak.platform,
  cs.status,
  cs.last_checked,
  cs.error_message,
  cs.response_time_ms
FROM connection_status cs
JOIN api_keys ak ON cs.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY cs.last_checked DESC
LIMIT 10;

-- 5. فحص Auto Trades لـ OKX (إن وجدت)
-- ملاحظة: قد لا يحتوي جدول auto_trades على api_key_id column
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_trades') 
    THEN '✅ Auto Trades table exists'
    ELSE '❌ Auto Trades table does not exist'
  END as auto_trades_status;

-- محاولة عرض Auto Trades (جدول auto_trades يحتوي على pair وليس symbol)
SELECT 
  at.id,
  at.pair as symbol,  -- auto_trades uses 'pair' not 'symbol'
  at.status,
  at.signal_source,
  at.direction,
  at.created_at
FROM auto_trades at
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_trades')
ORDER BY at.created_at DESC
LIMIT 10;

-- 6. ملخص شامل لـ OKX
SELECT 
  'API Keys' as data_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE testnet = true) as testnet_count
FROM api_keys
WHERE platform IN ('okx', 'okx-demo')

UNION ALL

SELECT 
  'Portfolio Balances' as data_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE total_balance > 0) as active_count,
  COUNT(DISTINCT api_key_id) as testnet_count
FROM portfolio_balances pb
JOIN api_keys ak ON pb.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')

UNION ALL

SELECT 
  'Connection Status' as data_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'connected') as active_count,
  COUNT(*) FILTER (WHERE status = 'error') as testnet_count
FROM connection_status cs
JOIN api_keys ak ON cs.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo');

