# دليل ملء حقول Cron Jobs في Supabase UI

## 📋 البيانات المطلوبة لملء الحقول

---

## Cron Job 1: auto-trader-worker

### الحقول المطلوبة:

#### 1. **Name (الاسم):**
```
auto-trader-worker
```

#### 2. **Schedule (الجدولة):**
```
* * * * *
```
**أو اضغط على زر:** `Every minute`

#### 3. **Type (النوع):**
اختر: **Supabase Edge Function**

**ملاحظة:** إذا لم يكن `pg_net` مفعّل:
- اضغط على `Install pg_net extension` أولاً

#### 4. **Edge Function:**
اختر من القائمة: **auto-trader-worker**

#### 5. **Headers (اختياري):**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/json
```

#### 6. **Body (اختياري):**
```json
{}
```

---

## Cron Job 2: strategy-runner-worker (15m)

### الحقول المطلوبة:

#### 1. **Name (الاسم):**
```
strategy-runner-15m
```

#### 2. **Schedule (الجدولة):**
```
*/5 * * * *
```
**أو اضغط على زر:** `Every 5 minutes`

#### 3. **Type (النوع):**
اختر: **Supabase Edge Function**

#### 4. **Edge Function:**
اختر من القائمة: **strategy-runner-worker**

#### 5. **Headers (اختياري):**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/json
```

#### 6. **Body (مطلوب):**
```json
{
  "timeframe": "15m"
}
```

---

## Cron Job 3: strategy-runner-worker (1h)

### الحقول المطلوبة:

#### 1. **Name (الاسم):**
```
strategy-runner-1h
```

#### 2. **Schedule (الجدولة):**
```
*/15 * * * *
```
**أو اضغط على زر:** `Every 15 minutes` (إذا متوفر)

#### 3. **Type (النوع):**
اختر: **Supabase Edge Function**

#### 4. **Edge Function:**
اختر من القائمة: **strategy-runner-worker**

#### 5. **Body (مطلوب):**
```json
{
  "timeframe": "1h"
}
```

---

## 🚨 معلومات مهمة

### 1. Service Role Key

**كيفية الحصول عليها:**
1. اذهب إلى: Supabase Dashboard
2. **Settings** > **API**
3. انسخ **service_role** key (ليس anon key)

**تحذير:** ⚠️ Service Role Key سري جداً - لا تشاركه أبداً!

---

### 2. تفعيل pg_net

**إذا ظهرت رسالة:**
> "pg_net needs to be installed to use this type"

**الحل:**
1. اضغط على `Install pg_net extension`
2. انتظر حتى يتم التفعيل
3. ثم أعد محاولة إنشاء Cron Job

---

### 3. Schedule Format (Cron Expression)

**أمثلة:**
- `* * * * *` = Every minute
- `*/5 * * * *` = Every 5 minutes
- `*/15 * * * *` = Every 15 minutes
- `0 * * * *` = Every hour at minute 0
- `0 0 * * *` = Every day at midnight

**الصيغة:** `دقيقة ساعة يوم شهر يوم_الأسبوع`

---

## 📝 الخطوات السريعة

### للـ auto-trader-worker:

1. **Name:** `auto-trader-worker`
2. **Schedule:** اضغط `Every minute` أو اكتب `* * * * *`
3. **Type:** اختر `Supabase Edge Function`
4. **Edge Function:** اختر `auto-trader-worker`
5. اضغط **Create cron job**

### للـ strategy-runner-worker:

1. **Name:** `strategy-runner-15m`
2. **Schedule:** اضغط `Every 5 minutes` أو اكتب `*/5 * * * *`
3. **Type:** اختر `Supabase Edge Function`
4. **Edge Function:** اختر `strategy-runner-worker`
5. **Body:** `{"timeframe": "15m"}`
6. اضغط **Create cron job**

---

## ✅ التحقق من Cron Jobs

بعد الإنشاء، يمكنك:

1. **عرض Cron Jobs:**
   ```sql
   SELECT * FROM cron.job ORDER BY jobid;
   ```

2. **عرض آخر التنفيذات:**
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```

3. **إلغاء Cron Job:**
   ```sql
   SELECT cron.unschedule('auto-trader-worker');
   ```

---

## 🔄 الخلاصة

**الطريقة الأسهل:**
1. استخدم Supabase UI لإنشاء Cron Jobs (أسهل)
2. أو استخدم SQL Script من `CRON_JOBS_SETUP_SIMPLE.sql` (أسرع)

**الملفات المتوفرة:**
- `CRON_JOBS_SETUP.sql` - سكربت SQL كامل مع جميع Cron Jobs
- `CRON_JOBS_SETUP_SIMPLE.sql` - سكربت SQL مبسط للـ 3 Cron Jobs الأساسية
- `CRON_JOBS_UI_GUIDE.md` - هذا الملف (دليل UI)

---

**تاريخ التحديث:** 2025-01-17

