# استكشاف أخطاء التداول التلقائي - Auto Trading Troubleshooting

## 🔍 المشاكل الشائعة والحلول

### المشكلة 1: البوت لا يدخل في صفقات تلقائياً

#### ✅ الحلول المطلوبة:

#### 1. **تأكد من جدولة auto-trader-worker**

`auto-trader-worker` يحتاج إلى أن يكون **مجدول** (scheduled) ليعمل تلقائياً.

**الخطوات:**

1. افتح **Supabase Dashboard**
2. اذهب إلى **Database** → **Cron Jobs**
3. أنشئ cron job جديد:
   ```sql
   SELECT cron.schedule(
     'auto-trader-worker',
     '* * * * *',  -- كل دقيقة
     $$
     SELECT net.http_post(
       url:='https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker',
       headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

**أو استخدم Supabase Dashboard:**
- Database → Cron Jobs → Create New
- Schedule: `* * * * *` (كل دقيقة)
- SQL: استخدم الكود أعلاه

---

#### 2. **تأكد من وجود إشارات PENDING**

البوت يحتاج إلى إشارات بحالة `PENDING` ليعمل عليها.

**التحقق:**
```sql
SELECT * FROM tradingview_signals 
WHERE user_id = 'YOUR_USER_ID'
AND execution_status = 'PENDING'
ORDER BY created_at DESC;
```

**إذا لم توجد إشارات:**
- تأكد من أن **Signal Source** مفعل في Bot Settings
- تأكد من وجود إشارات من المصدر المحدد

---

#### 3. **تحقق من إعدادات Auto Trading**

في **Bot Settings** → **Auto Trading**:

- ✅ `auto_trading_enabled = true`
- ✅ `auto_trading_mode = 'full_auto'`
- ✅ `allowed_signal_sources` يحتوي على مصدر واحد على الأقل
- ✅ `allowed_directions` يحتوي على اتجاه واحد على الأقل

---

#### 4. **تحقق من API Keys**

- ✅ API keys موجودة ومفعلة (`is_active = true`)
- ✅ API keys للمنصة المحددة في `default_platform`
- ✅ API keys صحيحة (يمكنها الوصول إلى Binance)

---

### المشكلة 2: الصفقات اليدوية لا تظهر على Binance

#### ✅ الحل:

#### 1. **تحقق من `autoExecute` Flag**

في صفحة **Execute Trade**، تأكد من أن:
- ✅ `autoExecute = true` (مفعول)
- إذا كان `autoExecute = false`، الصفقة ستكون **محلية فقط** (في قاعدة البيانات)

#### 2. **تحقق من Edge Function Logs**

1. افتح **Supabase Dashboard**
2. اذهب إلى **Edge Functions** → **execute-trade**
3. تحقق من **Logs** لرؤية الأخطاء

#### 3. **تحقق من API Keys Permissions**

في Binance:
- ✅ API Key لديه صلاحيات **Spot Trading** (للـ Spot)
- ✅ API Key لديه صلاحيات **Futures Trading** (للـ Futures)
- ✅ API Key **ليس** في وضع **Read Only**

---

### المشكلة 3: البوت لا يستجيب للإشارات

#### ✅ الحلول:

#### 1. **تحقق من Signal Source Matching**

الإشارة يجب أن تطابق `allowed_signal_sources`:

- إذا `allowed_signal_sources = ['ai_ultra']`
- الإشارة يجب أن تكون من مصدر `ai_ultra`

**التحقق:**
```sql
SELECT source, execution_status, COUNT(*) 
FROM tradingview_signals 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY source, execution_status;
```

#### 2. **تحقق من Signal Direction**

الإشارة يجب أن تطابق `allowed_directions`:

- إذا `allowed_directions = ['long']`
- الإشارة يجب أن تكون `BUY` أو `STRONG_BUY`

#### 3. **تحقق من Confidence Score**

إذا كان `min_signal_confidence` محدد:
- الإشارة يجب أن يكون `confidence_score >= min_signal_confidence`

---

### المشكلة 4: الصفقات تظهر في قاعدة البيانات لكن لا تظهر على Binance

#### ✅ الحل:

#### 1. **تحقق من Testnet vs Mainnet**

- إذا كنت تستخدم **Binance Testnet**:
  - تأكد من أن API keys هي **Testnet keys**
  - تأكد من أن `testnet = true` في `api_keys` table

#### 2. **تحقق من Edge Function Response**

في **Supabase Dashboard** → **Edge Functions** → **execute-trade** → **Logs**:

ابحث عن:
- `Order placed successfully` ✅
- `Binance API error` ❌
- `Failed to place order` ❌

#### 3. **تحقق من Binance Testnet Dashboard**

- افتح [Binance Testnet](https://testnet.binancefuture.com/)
- تحقق من **Orders** و **Positions**
- تأكد من أن الصفقات موجودة هناك

---

## 🔧 خطوات التشخيص الكاملة

### الخطوة 1: تحقق من الإعدادات

```sql
-- تحقق من bot_settings
SELECT 
  is_active,
  auto_trading_enabled,
  auto_trading_mode,
  allowed_signal_sources,
  allowed_directions,
  default_platform
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

### الخطوة 2: تحقق من API Keys

```sql
-- تحقق من API keys
SELECT 
  id,
  platform,
  is_active,
  testnet
FROM api_keys
WHERE user_id = 'YOUR_USER_ID'
AND is_active = true;
```

### الخطوة 3: تحقق من الإشارات

```sql
-- تحقق من الإشارات PENDING
SELECT 
  id,
  symbol,
  signal_type,
  source,
  confidence_score,
  execution_status,
  created_at
FROM tradingview_signals
WHERE user_id = 'YOUR_USER_ID'
AND execution_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 10;
```

### الخطوة 4: تحقق من Auto Trades

```sql
-- تحقق من auto_trades
SELECT 
  id,
  pair,
  direction,
  status,
  reason_code,
  created_at
FROM auto_trades
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### الخطوة 5: تحقق من Auto Trade Logs

```sql
-- تحقق من auto_trade_logs
SELECT 
  atl.step,
  atl.message,
  atl.created_at
FROM auto_trade_logs atl
JOIN auto_trades at ON atl.auto_trade_id = at.id
WHERE at.user_id = 'YOUR_USER_ID'
ORDER BY atl.created_at DESC
LIMIT 20;
```

---

## 🚨 الأخطاء الشائعة

### خطأ 1: "No bot settings found"
**الحل:** تأكد من وجود `bot_settings` record للمستخدم

### خطأ 2: "Auto trading is disabled"
**الحل:** فعّل `auto_trading_enabled` في Bot Settings

### خطأ 3: "Signal source not allowed"
**الحل:** أضف المصدر إلى `allowed_signal_sources`

### خطأ 4: "Direction not allowed"
**الحل:** أضف الاتجاه إلى `allowed_directions`

### خطأ 5: "Maximum auto trades per day limit reached"
**الحل:** زد `max_auto_trades_per_day` أو انتظر حتى اليوم التالي

### خطأ 6: "Maximum concurrent auto positions limit reached"
**الحل:** أغلق بعض الصفقات النشطة أو زد `max_concurrent_auto_positions`

---

## 📊 مراقبة التداول التلقائي

### 1. **Auto Trade History**
- اذهب إلى `/dashboard/auto-trades/history`
- راجع الصفقات المرفوضة وأسباب الرفض

### 2. **Edge Function Logs**
- Supabase Dashboard → Edge Functions → auto-trader-worker → Logs
- راجع الأخطاء والتحذيرات

### 3. **Auto Trade Logs**
- في Auto Trade History، انقر على صفقة لرؤية logs تفصيلية

---

## ✅ Checklist للتشخيص

- [ ] `auto-trader-worker` مجدول (cron job)
- [ ] `is_active = true` في bot_settings
- [ ] `auto_trading_enabled = true`
- [ ] `auto_trading_mode = 'full_auto'`
- [ ] `allowed_signal_sources` غير فارغ
- [ ] `allowed_directions` غير فارغ
- [ ] `default_platform` محدد
- [ ] API keys موجودة ومفعلة
- [ ] API keys للمنصة الصحيحة
- [ ] API keys لديها صلاحيات Trading
- [ ] توجد إشارات بحالة `PENDING`
- [ ] الإشارات تطابق الفلاتر
- [ ] `autoExecute = true` للصفقات اليدوية

---

## 🆘 إذا لم تحل المشكلة

1. **تحقق من Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Browser Console (F12)

2. **تحقق من Database:**
   - راجع `auto_trades` table
   - راجع `auto_trade_logs` table
   - راجع `bot_signal_executions` table

3. **اختبر Edge Function يدوياً:**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

4. **راجع Auto Trade History:**
   - اذهب إلى `/dashboard/auto-trades/history`
   - راجع الصفقات المرفوضة وأسباب الرفض

---

## 📝 ملاحظات مهمة

1. **Testnet vs Mainnet:**
   - تأكد من استخدام API keys الصحيحة (Testnet أو Mainnet)
   - تأكد من أن `testnet` flag صحيح في `api_keys` table

2. **الصفقات اليدوية:**
   - إذا كان `autoExecute = false`، الصفقة ستكون محلية فقط
   - لتصل إلى Binance، يجب أن يكون `autoExecute = true`

3. **التوقيت:**
   - `auto-trader-worker` يعمل كل دقيقة (إذا كان مجدول)
   - قد تستغرق الصفقة بضع دقائق للظهور

4. **الإشارات:**
   - البوت يحتاج إلى إشارات بحالة `PENDING`
   - إذا لم توجد إشارات، البوت لن يعمل

---

## 🔗 روابط مفيدة

- [Auto Trading Requirements](./AUTO_TRADING_REQUIREMENTS.md)
- [Phase X - Auto Trading UI](./PHASE_X_AUTO_TRADING_UI.md)
- [Phase Y - Auto Trading Logging](./PHASE_Y_AUTO_TRADING_LOGGING.md)

