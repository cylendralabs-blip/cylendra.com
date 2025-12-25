# دليل إعداد التداول التلقائي - Auto Trading Setup Guide

## 🔴 المشكلة الرئيسية: البوت لا يعمل

### السبب 1: `auto-trader-worker` غير مجدول ⚠️

`auto-trader-worker` يحتاج إلى أن يكون **مجدول** (scheduled) ليعمل تلقائياً. بدون جدولة، البوت لن يعمل!

---

## ✅ الحل: جدولة auto-trader-worker

### الطريقة 1: استخدام Supabase Cron Jobs (مُوصى به)

1. **افتح Supabase Dashboard**
2. اذهب إلى **Database** → **Cron Jobs**
3. انقر على **Create New Cron Job**
4. أدخل المعلومات التالية:

**Name:**
```
auto-trader-worker
```

**Schedule:**
```
* * * * *
```
(يعمل كل دقيقة)

**SQL:**
```sql
SELECT net.http_post(
  url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-trader-worker',
  headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
);
```

**ملاحظة:** استبدل:
- `YOUR_PROJECT_ID` → Project ID من Supabase Dashboard
- `YOUR_SERVICE_ROLE_KEY` → Service Role Key من Supabase Dashboard → Settings → API

5. احفظ Cron Job

---

### الطريقة 2: استخدام SQL Editor

1. افتح **Supabase Dashboard** → **SQL Editor**
2. نفذ هذا الكود:

```sql
-- جدولة auto-trader-worker كل دقيقة
SELECT cron.schedule(
  'auto-trader-worker',
  '* * * * *',  -- كل دقيقة
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-trader-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

**للتحقق من الجدولة:**
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-trader-worker';
```

**لإلغاء الجدولة (إذا لزم الأمر):**
```sql
SELECT cron.unschedule('auto-trader-worker');
```

---

## 🔍 المشكلة 2: الصفقات اليدوية لا تظهر على Binance

### السبب: `autoExecute = false`

إذا كان `autoExecute = false` في صفحة **Execute Trade**، الصفقة ستكون **محلية فقط** (في قاعدة البيانات) ولن تُنفذ على Binance.

### ✅ الحل:

1. افتح **Execute Trade** (`/dashboard/execute-trade`)
2. تأكد من أن **"التنفيذ التلقائي"** (Auto Execute) **مفعول** ✅
3. يجب أن ترى رسالة: **"✅ التنفيذ التلقائي مُفعل"**
4. إذا كان معطل، فعّله قبل تنفيذ الصفقة

---

## 🔍 المشكلة 3: البوت لا يدخل في صفقات تلقائياً

### الأسباب المحتملة:

#### 1. **لا توجد إشارات PENDING**

البوت يحتاج إلى إشارات بحالة `PENDING` ليعمل عليها.

**التحقق:**
```sql
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

**إذا لم توجد إشارات:**
- تأكد من أن **Signal Source** مفعل في Bot Settings
- تأكد من وجود إشارات من المصدر المحدد

#### 2. **الإشارات لا تطابق الفلاتر**

**التحقق من الفلاتر:**
```sql
SELECT 
  auto_trading_enabled,
  auto_trading_mode,
  allowed_signal_sources,
  allowed_directions,
  min_signal_confidence
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

**المشاكل الشائعة:**
- `allowed_signal_sources` فارغ → أضف مصدر واحد على الأقل
- `allowed_directions` فارغ → أضف اتجاه واحد على الأقل
- `min_signal_confidence` أعلى من `confidence_score` للإشارة

#### 3. **auto-trader-worker لا يعمل**

**التحقق من Logs:**
1. Supabase Dashboard → **Edge Functions** → **auto-trader-worker** → **Logs**
2. ابحث عن:
   - `Auto-trader worker started` ✅
   - `Found X active bot users` ✅
   - `Processing signal...` ✅
   - أخطاء ❌

**اختبار يدوي:**
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-trader-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 خطوات التشخيص الكاملة

### الخطوة 1: تحقق من Cron Job

```sql
-- تحقق من وجود cron job
SELECT * FROM cron.job WHERE jobname = 'auto-trader-worker';

-- إذا لم يكن موجوداً، أنشئه (استخدم الكود أعلاه)
```

### الخطوة 2: تحقق من الإعدادات

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

### الخطوة 3: تحقق من API Keys

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

### الخطوة 4: تحقق من الإشارات

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

### الخطوة 5: تحقق من Auto Trades

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

### الخطوة 6: تحقق من Auto Trade Logs

```sql
-- تحقق من auto_trade_logs
SELECT 
  atl.step,
  atl.message,
  atl.data,
  atl.created_at
FROM auto_trade_logs atl
JOIN auto_trades at ON atl.auto_trade_id = at.id
WHERE at.user_id = 'YOUR_USER_ID'
ORDER BY atl.created_at DESC
LIMIT 20;
```

---

## 🚨 الأخطاء الشائعة والحلول

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

### خطأ 7: "API key not found"
**الحل:** تأكد من وجود API key للمنصة المحددة في `default_platform`

### خطأ 8: "Binance API error"
**الحل:** 
- تحقق من صحة API keys
- تحقق من صلاحيات API keys (Trading enabled)
- تحقق من Testnet vs Mainnet

---

## ✅ Checklist الكامل

### إعدادات البوت:
- [ ] `is_active = true` (البوت مفعل)
- [ ] `auto_trading_enabled = true` (التداول التلقائي مفعل)
- [ ] `auto_trading_mode = 'full_auto'` (وضع التداول التلقائي الكامل)
- [ ] `allowed_signal_sources` غير فارغ (مصدر واحد على الأقل)
- [ ] `allowed_directions` غير فارغ (اتجاه واحد على الأقل)
- [ ] `default_platform` محدد

### API Keys:
- [ ] API keys موجودة ومفعلة (`is_active = true`)
- [ ] API keys للمنصة المحددة في `default_platform`
- [ ] API keys صحيحة (يمكنها الوصول إلى Binance)
- [ ] API keys لديها صلاحيات Trading (ليس Read Only)
- [ ] Testnet flag صحيح (`testnet = true` للـ Testnet)

### Cron Job:
- [ ] `auto-trader-worker` مجدول (cron job موجود)
- [ ] Cron job يعمل كل دقيقة (`* * * * *`)
- [ ] URL صحيح في cron job
- [ ] Service Role Key صحيح في cron job

### الإشارات:
- [ ] توجد إشارات بحالة `PENDING`
- [ ] الإشارات تطابق `allowed_signal_sources`
- [ ] الإشارات تطابق `allowed_directions`
- [ ] `confidence_score` >= `min_signal_confidence`

### الصفقات اليدوية:
- [ ] `autoExecute = true` في صفحة Execute Trade
- [ ] API keys صحيحة ومفعلة
- [ ] الرصيد كافي

---

## 🔧 اختبار يدوي

### 1. اختبار auto-trader-worker:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-trader-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "processed": 0,
  "executed": 0,
  "filtered": 0
}
```

### 2. اختبار execute-trade:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/execute-trade \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "YOUR_API_KEY_ID",
    "symbol": "BTCUSDT",
    "marketType": "spot",
    "orderType": "market",
    "entryPrice": 50000,
    "initialAmount": 100,
    "autoExecute": true
  }'
```

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

## 🆘 إذا لم تحل المشكلة

1. **تحقق من Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Browser Console (F12)

2. **تحقق من Database:**
   - راجع `auto_trades` table
   - راجع `auto_trade_logs` table
   - راجع `bot_signal_executions` table

3. **راجع Auto Trade History:**
   - اذهب إلى `/dashboard/auto-trades/history`
   - راجع الصفقات المرفوضة وأسباب الرفض

4. **راجع Troubleshooting Guide:**
   - [TROUBLESHOOTING_AUTO_TRADING.md](./TROUBLESHOOTING_AUTO_TRADING.md)

---

## 🔗 روابط مفيدة

- [Auto Trading Requirements](./AUTO_TRADING_REQUIREMENTS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_AUTO_TRADING.md)
- [Phase X - Auto Trading UI](./PHASE_X_AUTO_TRADING_UI.md)
- [Phase Y - Auto Trading Logging](./PHASE_Y_AUTO_TRADING_LOGGING.md)

