# دليل الترحيل اليدوي لـ Edge Functions

## ⚠️ المشكلة

إذا واجهت مشكلة في الصلاحيات مع `supabase link`، يمكنك استخدام الطرق البديلة التالية:

---

## الطريقة 1: استخدام Access Token

### 1. الحصول على Access Token

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اذهب إلى **Account Settings** > **Access Tokens**
3. أنشئ Access Token جديد
4. انسخ الـ Token

### 2. استخدام Access Token

```bash
# تعيين Access Token كمتغير بيئة
$env:SUPABASE_ACCESS_TOKEN="your-access-token-here"

# أو في PowerShell
set SUPABASE_ACCESS_TOKEN=your-access-token-here

# ثم ربط المشروع
supabase link --project-ref pjgfrhgjbbsqsmwfljpg
```

---

## الطريقة 2: الترحيل اليدوي عبر Supabase Dashboard

### خطوات الترحيل:

1. **اذهب إلى Supabase Dashboard**
   - https://app.supabase.com/project/pjgfrhgjbbsqsmwfljpg

2. **اذهب إلى Edge Functions**
   - من القائمة الجانبية: **Edge Functions**

3. **ترحيل كل Function:**

#### Function 1: execute-trade
- اضغط **New Function**
- الاسم: `execute-trade`
- ارفع جميع الملفات من `supabase/functions/execute-trade/`
- تأكد من رفع ملفات `_shared/` أيضاً

#### Function 2: auto-trader-worker
- اضغط **New Function**
- الاسم: `auto-trader-worker`
- ارفع جميع الملفات من `supabase/functions/auto-trader-worker/`

#### Function 3: strategy-runner-worker
- اضغط **New Function**
- الاسم: `strategy-runner-worker`
- ارفع جميع الملفات من `supabase/functions/strategy-runner-worker/`

#### Function 4: get-candles
- اضغط **New Function**
- الاسم: `get-candles`
- ارفع `supabase/functions/get-candles/index.ts`

#### Function 5: get-live-prices
- اضغط **New Function**
- الاسم: `get-live-prices`
- ارفع `supabase/functions/get-live-prices/index.ts`

#### Function 6: exchange-portfolio
- اضغط **New Function**
- الاسم: `exchange-portfolio`
- ارفع جميع الملفات من `supabase/functions/exchange-portfolio/`

#### Function 7: tradingview-webhook
- اضغط **New Function**
- الاسم: `tradingview-webhook`
- ارفع `supabase/functions/tradingview-webhook/index.ts`

---

## الطريقة 3: استخدام Supabase CLI مع Access Token

### 1. تعيين Access Token

**Windows PowerShell:**
```powershell
$env:SUPABASE_ACCESS_TOKEN="your-access-token"
```

**Windows CMD:**
```cmd
set SUPABASE_ACCESS_TOKEN=your-access-token
```

**Linux/Mac:**
```bash
export SUPABASE_ACCESS_TOKEN=your-access-token
```

### 2. ربط المشروع

```bash
supabase link --project-ref pjgfrhgjbbsqsmwfljpg
```

### 3. ترحيل Functions

```bash
# Critical Functions
supabase functions deploy execute-trade
supabase functions deploy auto-trader-worker

# High Priority Functions
supabase functions deploy strategy-runner-worker
supabase functions deploy get-candles
supabase functions deploy get-live-prices
supabase functions deploy exchange-portfolio

# Medium Priority Functions
supabase functions deploy tradingview-webhook
supabase functions deploy get-trading-pairs
supabase functions deploy sync-platform-trades
supabase functions deploy admin-users
```

---

## الطريقة 4: استخدام Supabase API مباشرة

يمكنك استخدام Supabase Management API لترحيل Functions برمجياً.

**مثال:**
```bash
curl -X POST \
  'https://api.supabase.com/v1/projects/pjgfrhgjbbsqsmwfljpg/functions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "execute-trade",
    "body": "..."
  }'
```

---

## إعداد Environment Variables

بعد ترحيل كل Function، يجب إضافة Environment Variables:

1. اذهب إلى **Edge Functions** في Dashboard
2. اختر Function
3. اذهب إلى **Settings** > **Environment Variables**
4. أضف:

```
SUPABASE_URL=https://pjgfrhgjbbsqsmwfljpg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**للحصول على Service Role Key:**
- اذهب إلى **Settings** > **API**
- انسخ **service_role** key

---

## إعداد Cron Jobs

بعد ترحيل `auto-trader-worker` و `strategy-runner-worker`، أضف Cron Jobs:

### 1. auto-trader-worker

في Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'auto-trader-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/auto-trader-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$;
);
```

### 2. strategy-runner-worker

```sql
SELECT cron.schedule(
  'strategy-runner-15m',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{"timeframe": "15m"}'::jsonb
  );
  $$;
);
```

---

## استكشاف الأخطاء

### المشكلة: "Your account does not have the necessary privileges"

**الحل:**
1. تأكد من أنك مسجل دخول بالحساب الصحيح
2. استخدم Access Token بدلاً من كلمة المرور
3. تأكد من أن لديك صلاحيات Admin على المشروع

### المشكلة: "Cannot find project ref"

**الحل:**
1. تأكد من أن Project Ref صحيح: `pjgfrhgjbbsqsmwfljpg`
2. تأكد من أنك مرتبط بالمشروع: `supabase link --project-ref pjgfrhgjbbsqsmwfljpg`
3. استخدم Access Token للربط

---

## الخطوات التالية

بعد الترحيل الناجح:

1. ✅ اختبار كل Function
2. ✅ إضافة Environment Variables
3. ✅ إعداد Cron Jobs
4. ✅ مراقبة Logs

---

**ملاحظة:** إذا استمرت المشاكل، استخدم الطريقة اليدوية (الطريقة 2) عبر Dashboard.

