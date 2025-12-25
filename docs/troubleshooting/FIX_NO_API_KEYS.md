# 🔧 إصلاح مشكلة "No active API keys found"

## المشكلة

الصفقة تم رفضها بسبب:
- ❌ **NO_API_KEYS**: لا توجد API keys نشطة للمستخدم

---

## ✅ الحل

### 1. إضافة API Keys من واجهة المستخدم

1. اذهب إلى: **إعدادات API** (API Settings)
2. اضغط على **"إضافة API Key جديد"** (Add New API Key)
3. أدخل:
   - **المنصة** (Platform): Binance أو OKX
   - **API Key**
   - **Secret Key**
   - **Passphrase** (إذا كانت مطلوبة)
   - **Testnet**: ✅ مفعل (للتجربة)
4. اضغط **"حفظ"** (Save)
5. تأكد من أن **"نشط"** (Active) مفعل ✅

---

### 2. التحقق من API Keys في قاعدة البيانات

```sql
SELECT 
  id,
  platform,
  is_active,
  testnet,
  created_at
FROM api_keys
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

**يجب أن ترى:**
- ✅ `is_active = true`
- ✅ `platform` موجود (مثلاً: `'binance'` أو `'okx'`)
- ✅ `testnet = true` (للتجربة)

---

### 3. التحقق من default_platform في bot_settings

```sql
SELECT 
  user_id,
  default_platform,
  platform
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

**إذا كان `default_platform` موجود:**
- تأكد من أن `default_platform` يطابق `id` أحد API keys النشطة

**إذا كان `default_platform` فارغ:**
- سيستخدم أول API key نشط تلقائياً

---

### 4. إصلاح default_platform (إذا لزم الأمر)

```sql
-- الحصول على id أول API key نشط
SELECT id 
FROM api_keys 
WHERE user_id = 'YOUR_USER_ID' 
AND is_active = true 
ORDER BY created_at DESC 
LIMIT 1;

-- تحديث bot_settings
UPDATE bot_settings
SET default_platform = 'API_KEY_ID_HERE'
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🔍 خطوات التحقق

### 1. تحقق من API Keys

```sql
SELECT 
  id,
  platform,
  is_active,
  testnet,
  CASE 
    WHEN is_active THEN '✅ نشط'
    ELSE '❌ غير نشط'
  END as status
FROM api_keys
WHERE user_id = 'YOUR_USER_ID';
```

### 2. تحقق من bot_settings

```sql
SELECT 
  user_id,
  default_platform,
  auto_trading_enabled,
  auto_trading_mode,
  is_active
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

### 3. تحقق من تطابق default_platform مع API key

```sql
SELECT 
  bs.user_id,
  bs.default_platform,
  ak.id as api_key_id,
  ak.platform,
  ak.is_active,
  CASE 
    WHEN bs.default_platform = ak.id::text THEN '✅ متطابق'
    ELSE '❌ غير متطابق'
  END as match_status
FROM bot_settings bs
LEFT JOIN api_keys ak ON bs.default_platform = ak.id::text
WHERE bs.user_id = 'YOUR_USER_ID';
```

---

## 📝 SQL Queries للإصلاح السريع

### إصلاح شامل

```sql
-- 1. التحقق من API keys
SELECT 
  id,
  platform,
  is_active,
  testnet
FROM api_keys
WHERE user_id = 'YOUR_USER_ID';

-- 2. إذا لم توجد API keys، يجب إضافتها من واجهة المستخدم
-- (لا يمكن إضافة API keys مباشرة من SQL لأسباب أمنية)

-- 3. إذا كانت موجودة لكن غير نشطة:
UPDATE api_keys
SET is_active = true
WHERE user_id = 'YOUR_USER_ID'
AND id = 'API_KEY_ID_HERE';

-- 4. تحديث default_platform
UPDATE bot_settings
SET default_platform = (
  SELECT id::text 
  FROM api_keys 
  WHERE user_id = 'YOUR_USER_ID' 
  AND is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE user_id = 'YOUR_USER_ID'
AND default_platform IS NULL;
```

---

## ⚠️ ملاحظات مهمة

1. **API Keys لا يمكن إضافتها من SQL:**
   - يجب إضافتها من واجهة المستخدم (صفحة إعدادات API)
   - هذا لأسباب أمنية (التشفير)

2. **default_platform:**
   - إذا كان `NULL` أو فارغ، سيستخدم أول API key نشط تلقائياً
   - إذا كان موجود، يجب أن يطابق `id` أحد API keys النشطة

3. **Testnet vs Mainnet:**
   - للتجربة، استخدم `testnet = true`
   - للتداول الحقيقي، استخدم `testnet = false`

4. **المنصة:**
   - تأكد من أن `platform` في API key يطابق المنصة المطلوبة
   - مثلاً: `'binance'` أو `'okx'`

---

## 🚀 بعد إضافة API Keys

1. **انتظر دقيقة واحدة** - `auto-trader-worker` سيعمل تلقائياً

2. **أنشئ إشارة جديدة** من `tradingview_signals`:
   ```sql
   INSERT INTO tradingview_signals (
     user_id,
     symbol,
     signal_type,
     entry_price,
     stop_loss_price,
     take_profit_price,
     confidence_score,
     execution_status,
     strategy_name,
     timeframe
   ) VALUES (
     'YOUR_USER_ID',
     'BTCUSDT',
     'BUY',
     50000,
     49000,
     51000,
     85,
     'PENDING',
     'Test Signal',
     '1h'
   );
   ```

3. **تحقق من auto_trade_logs:**
   ```sql
   SELECT 
     step,
     message,
     data,
     created_at
   FROM auto_trade_logs
   WHERE auto_trade_id = (
     SELECT id FROM auto_trades 
     WHERE signal_id = 'SIGNAL_ID_HERE'
     ORDER BY created_at DESC 
     LIMIT 1
   )
   ORDER BY created_at DESC;
   ```

**يجب أن ترى:**
- ✅ `signal_received`
- ✅ `filters_applied: PASSED`
- ✅ `limits_checked`
- ✅ `filters_applied: All filters passed, proceeding...`
- ✅ `filters_applied: Checking for duplicate trades`
- ✅ `filters_applied: Running risk evaluation checks`
- ✅ `filters_applied: Checking auto_trading_mode before execution`
- ✅ `accepted_for_execution`
- ✅ `execute_called`
- ✅ `exchange_response` (إذا نجح التنفيذ)

---

## 🔗 روابط مفيدة

- [Auto Trading Setup Guide](./AUTO_TRADING_SETUP_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_AUTO_TRADING.md)
- [Debug Auto Trader Worker](./DEBUG_AUTO_TRADER_WORKER.md)

