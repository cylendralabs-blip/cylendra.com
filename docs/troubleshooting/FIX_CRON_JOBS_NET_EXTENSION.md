# 🔧 حل مشكلة فشل Cron Jobs - Extension pg_net

## 🚨 المشكلة

**الخطأ:**
```
ERROR: schema "net" does not exist
LINE 2:   SELECT net.http_post(
```

**السبب:**
Extension `pg_net` غير مفعل في قاعدة البيانات. هذا Extension مطلوب لاستدعاء HTTP requests من PostgreSQL (للتواصل مع Edge Functions).

---

## ✅ الحل السريع

### الخطوة 1: تفعيل Extension pg_net (30 ثانية)

**في Supabase Dashboard:**

1. اذهب إلى: **SQL Editor**
2. انسخ ولصق هذا الاستعلام:

```sql
-- تفعيل Extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;
```

3. اضغط **Run**
4. يجب أن ترى: `Success. No rows returned`

---

### الخطوة 2: التحقق من التفعيل (30 ثانية)

**في SQL Editor:**

```sql
-- التحقق من أن Extension مفعل
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**يجب أن ترى:** صف واحد يحتوي على `pg_net`

---

### الخطوة 3: التحقق من schema "net" (30 ثانية)

**في SQL Editor:**

```sql
-- التحقق من أن schema "net" موجود
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'net';
```

**يجب أن ترى:** صف واحد يحتوي على `net`

---

### الخطوة 4: انتظر دقيقة واحدة

Cron Jobs ستعيد المحاولة تلقائياً بعد تفعيل Extension.

---

### الخطوة 5: التحقق من نجاح Cron Jobs (1 دقيقة)

**في Supabase Dashboard:**

1. اذهب إلى: **Database** > **Cron Jobs**
2. انتظر دقيقة واحدة
3. تحقق من أن **Last run** أصبح `succeeded` ✅

**أو في SQL Editor:**

```sql
-- عرض آخر تنفيذ لكل Job
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.status,
  jrd.return_message
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) jrd ON true
ORDER BY j.jobname;
```

**يجب أن ترى:** `status = 'succeeded'` ✅

---

## 📋 Checklist الحل

### تفعيل Extension:
- [ ] تفعيل `pg_net` Extension
- [ ] التحقق من التفعيل
- [ ] التحقق من schema "net"
- [ ] التحقق من دالة `net.http_post`

### التحقق من Cron Jobs:
- [ ] انتظر دقيقة واحدة
- [ ] تحقق من نجاح Cron Jobs
- [ ] عرض آخر تنفيذ ناجح

---

## 🎯 الخلاصة

**المشكلة:** Extension `pg_net` غير مفعل  
**الحل:** تفعيل Extension بـ `CREATE EXTENSION IF NOT EXISTS pg_net;`  
**الوقت المتوقع:** أقل من دقيقة واحدة! ⚡

---

## ⚠️ ملاحظة مهمة

**في Supabase:**
- Extension `pg_net` يجب تفعيله مرة واحدة فقط
- بعد التفعيل، سيظل مفعل حتى لو أعدت تشغيل المشروع
- لا حاجة لإعادة التفعيل بعد كل deploy

---

**تاريخ التحديث:** 2025-01-17

