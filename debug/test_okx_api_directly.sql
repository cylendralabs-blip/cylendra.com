-- ============================================
-- اختبار OKX API مباشرة من قاعدة البيانات
-- ============================================
-- هذا الملف للتحقق من بيانات API Keys

-- 1. التحقق من وجود API Keys لـ OKX مع Passphrase
SELECT 
  id,
  platform,
  testnet,
  is_active,
  CASE 
    WHEN api_key IS NULL OR api_key = '' THEN '❌ Missing API Key'
    WHEN secret_key IS NULL OR secret_key = '' THEN '❌ Missing Secret Key'
    WHEN passphrase IS NULL OR passphrase = '' THEN '❌ Missing Passphrase'
    ELSE '✅ All credentials present'
  END as credentials_status,
  LENGTH(api_key) as api_key_length,
  LENGTH(secret_key) as secret_key_length,
  LENGTH(passphrase) as passphrase_length
FROM api_keys
WHERE platform IN ('okx', 'okx-demo')
ORDER BY created_at DESC;

-- 2. فحص آخر محاولة جلب رصيد
SELECT 
  ak.id,
  ak.platform,
  ak.testnet,
  pb.symbol,
  pb.total_balance,
  pb.free_balance,
  pb.locked_balance,
  pb.last_updated,
  CASE 
    WHEN pb.last_updated IS NULL THEN '❌ Never fetched'
    WHEN pb.last_updated < NOW() - INTERVAL '1 hour' THEN '⚠️ Stale (>1h old)'
    ELSE '✅ Recent'
  END as data_freshness
FROM api_keys ak
LEFT JOIN portfolio_balances pb ON ak.id = pb.api_key_id AND pb.market_type = 'spot'
WHERE ak.platform IN ('okx', 'okx-demo')
ORDER BY ak.id, pb.last_updated DESC NULLS LAST;

-- 3. فحص إذا كان هناك أي رصيد محفوظ لـ OKX
SELECT 
  ak.platform,
  ak.testnet,
  COUNT(DISTINCT pb.symbol) as unique_symbols,
  SUM(pb.total_balance) as total_balance_sum,
  MAX(pb.last_updated) as last_update
FROM api_keys ak
LEFT JOIN portfolio_balances pb ON ak.id = pb.api_key_id
WHERE ak.platform IN ('okx', 'okx-demo')
GROUP BY ak.platform, ak.testnet;

