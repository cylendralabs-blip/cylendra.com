-- ============================================
-- تشخيص مشكلة OKX - فحص شامل (مصحح)
-- ============================================
-- يمكنك تنفيذ هذا في Supabase Dashboard > SQL Editor
-- هذا الملف مصحح من الأخطاء السابقة

-- ============================================
-- 1. فحص API Keys لـ OKX
-- ============================================
SELECT 
  '=== API Keys لـ OKX ===' as section;

SELECT 
  id,
  platform,
  testnet,
  is_active,
  created_at,
  -- التحقق من وجود البيانات
  CASE 
    WHEN api_key IS NULL OR api_key = '' THEN '❌ Missing API Key'
    WHEN secret_key IS NULL OR secret_key = '' THEN '❌ Missing Secret Key'
    WHEN passphrase IS NULL OR passphrase = '' THEN '❌ Missing Passphrase'
    ELSE '✅ All credentials present'
  END as credentials_status,
  LENGTH(api_key) as api_key_length,
  LENGTH(secret_key) as secret_key_length,
  LENGTH(COALESCE(passphrase, '')) as passphrase_length,
  -- عرض أول 10 أحرف من API Key (للتأكد من وجوده)
  LEFT(api_key, 10) || '...' as api_key_preview
FROM api_keys
WHERE platform IN ('okx', 'okx-demo')
ORDER BY created_at DESC;

-- ============================================
-- 2. فحص Portfolio Balances لـ OKX
-- ============================================
SELECT 
  '=== Portfolio Balances لـ OKX ===' as section;

SELECT 
  pb.id,
  pb.api_key_id,
  ak.platform,
  ak.testnet,
  pb.symbol,
  pb.total_balance,
  pb.free_balance,
  pb.locked_balance,
  pb.market_type,
  pb.last_updated,
  CASE 
    WHEN pb.last_updated IS NULL THEN '❌ Never fetched'
    WHEN pb.last_updated < NOW() - INTERVAL '1 hour' THEN '⚠️ Stale (>1h old)'
    WHEN pb.last_updated < NOW() - INTERVAL '10 minutes' THEN '⚠️ Old (>10m old)'
    ELSE '✅ Recent'
  END as data_freshness
FROM portfolio_balances pb
JOIN api_keys ak ON pb.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY pb.last_updated DESC NULLS LAST
LIMIT 50;

-- ============================================
-- 3. ملخص لكل API Key
-- ============================================
SELECT 
  '=== ملخص لكل OKX API Key ===' as section;

SELECT 
  ak.id as api_key_id,
  ak.platform,
  ak.testnet,
  ak.is_active,
  COUNT(pb.id) as balance_records_count,
  MAX(pb.last_updated) as last_balance_update,
  SUM(CASE WHEN pb.total_balance > 0 THEN 1 ELSE 0 END) as non_zero_balances,
  SUM(pb.total_balance) as total_balance_sum,
  CASE 
    WHEN COUNT(pb.id) = 0 THEN '❌ No balances ever fetched'
    WHEN MAX(pb.last_updated) IS NULL THEN '❌ Never updated'
    WHEN MAX(pb.last_updated) < NOW() - INTERVAL '1 hour' THEN '⚠️ Stale data'
    WHEN SUM(pb.total_balance) = 0 THEN '⚠️ All balances are zero'
    ELSE '✅ Has data'
  END as status
FROM api_keys ak
LEFT JOIN portfolio_balances pb ON ak.id = pb.api_key_id
WHERE ak.platform IN ('okx', 'okx-demo')
GROUP BY ak.id, ak.platform, ak.testnet, ak.is_active
ORDER BY last_balance_update DESC NULLS LAST;

-- ============================================
-- 4. فحص Connection Status
-- ============================================
SELECT 
  '=== Connection Status لـ OKX ===' as section;

SELECT 
  cs.api_key_id,
  ak.platform,
  ak.testnet,
  cs.status,
  cs.last_checked,
  cs.error_message,
  cs.response_time_ms,
  CASE 
    WHEN cs.status = 'connected' THEN '✅ Connected'
    WHEN cs.status = 'error' THEN '❌ Error'
    ELSE '⚠️ Unknown'
  END as status_display
FROM connection_status cs
JOIN api_keys ak ON cs.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY cs.last_checked DESC
LIMIT 10;

-- ============================================
-- 5. إحصائيات شاملة
-- ============================================
SELECT 
  '=== إحصائيات شاملة ===' as section;

SELECT 
  'API Keys' as data_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE testnet = true) as testnet_count,
  COUNT(*) FILTER (WHERE passphrase IS NOT NULL AND passphrase != '') as with_passphrase
FROM api_keys
WHERE platform IN ('okx', 'okx-demo')

UNION ALL

SELECT 
  'Portfolio Balances' as data_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE total_balance > 0) as active_count,
  COUNT(DISTINCT api_key_id) as testnet_count,
  COUNT(DISTINCT symbol) as with_passphrase
FROM portfolio_balances pb
JOIN api_keys ak ON pb.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo')

UNION ALL

SELECT 
  'Connection Status' as data_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'connected') as active_count,
  COUNT(*) FILTER (WHERE status = 'error') as testnet_count,
  COUNT(*) FILTER (WHERE last_checked > NOW() - INTERVAL '1 hour') as with_passphrase
FROM connection_status cs
JOIN api_keys ak ON cs.api_key_id = ak.id
WHERE ak.platform IN ('okx', 'okx-demo');

-- ============================================
-- 6. فحص آخر محاولة جلب رصيد
-- ============================================
SELECT 
  '=== آخر محاولات جلب الرصيد ===' as section;

SELECT 
  ak.id,
  ak.platform,
  ak.testnet,
  MAX(pb.last_updated) as last_fetch_attempt,
  COUNT(pb.id) as records_found,
  CASE 
    WHEN MAX(pb.last_updated) IS NULL THEN '❌ لم يتم جلب الرصيد أبداً'
    WHEN MAX(pb.last_updated) < NOW() - INTERVAL '1 day' THEN '⚠️ آخر جلب كان منذ أكثر من يوم'
    WHEN COUNT(pb.id) = 0 THEN '⚠️ تم الجلب لكن لا توجد بيانات'
    ELSE '✅ تم الجلب بنجاح'
  END as fetch_status
FROM api_keys ak
LEFT JOIN portfolio_balances pb ON ak.id = pb.api_key_id
WHERE ak.platform IN ('okx', 'okx-demo')
GROUP BY ak.id, ak.platform, ak.testnet
ORDER BY last_fetch_attempt DESC NULLS LAST;

-- ============================================
-- 7. التحقق من صحة البيانات
-- ============================================
SELECT 
  '=== التحقق من صحة البيانات ===' as section;

SELECT 
  ak.id,
  ak.platform,
  -- التحقق من API Key
  CASE 
    WHEN ak.api_key IS NULL OR ak.api_key = '' THEN '❌'
    ELSE '✅'
  END as has_api_key,
  -- التحقق من Secret Key
  CASE 
    WHEN ak.secret_key IS NULL OR ak.secret_key = '' THEN '❌'
    ELSE '✅'
  END as has_secret_key,
  -- التحقق من Passphrase (مطلوب لـ OKX)
  CASE 
    WHEN ak.passphrase IS NULL OR ak.passphrase = '' THEN '❌ Missing (Required for OKX!)'
    ELSE '✅'
  END as has_passphrase,
  -- التحقق من وجود بيانات رصيد
  CASE 
    WHEN EXISTS (SELECT 1 FROM portfolio_balances WHERE api_key_id = ak.id) THEN '✅'
    ELSE '❌ No balance data'
  END as has_balance_data
FROM api_keys ak
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY ak.created_at DESC;

