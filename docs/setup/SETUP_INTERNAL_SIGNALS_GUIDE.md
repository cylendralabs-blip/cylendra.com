# دليل تفعيل الإشارات الداخلية
# Internal Signals Setup Guide

## ✅ الخطوات المطلوبة

### الخطوة 1: إعداد البيانات في قاعدة البيانات

1. افتح **Supabase Dashboard**: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `setup_internal_signals.sql` والصقه في SQL Editor
4. اضغط **Run** لتنفيذ السكربت

**أو** يمكنك تشغيله من Terminal:

```powershell
# افتح Supabase Dashboard > SQL Editor
# ثم انسخ والصق محتوى setup_internal_signals.sql
```

### الخطوة 2: تفعيل Cron Jobs

1. في **Supabase Dashboard** > **SQL Editor**
2. افتح ملف `CRON_JOBS_SETUP.sql`
3. تأكد من تحديث `SERVICE_ROLE_KEY` في الملف
4. شغّل السكربت

**ملاحظة**: Service Role Key موجود في:
- Supabase Dashboard > Settings > API > service_role key

### الخطوة 3: التحقق من Edge Functions

تأكد من نشر Edge Functions التالية:

1. **strategy-runner-worker** (مطلوب)
   ```bash
   supabase functions deploy strategy-runner-worker
   ```

2. **auto-trader-worker** (اختياري - للتنفيذ التلقائي)
   ```bash
   supabase functions deploy auto-trader-worker
   ```

### الخطوة 4: اختبار النظام

#### اختبار يدوي لـ strategy-runner-worker:

```bash
curl -X POST https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "15m"}'
```

#### التحقق من الإشارات في قاعدة البيانات:

```sql
-- عرض الإشارات المولدة
SELECT 
  id,
  symbol,
  timeframe,
  signal_type,
  confidence_score,
  entry_price,
  source,
  execution_status,
  created_at
FROM tradingview_signals
WHERE source = 'internal_engine'
ORDER BY created_at DESC
LIMIT 10;
```

#### التحقق من إعدادات البوت:

```sql
-- عرض المستخدمين النشطين
SELECT 
  u.email,
  bs.is_active,
  bs.bot_name,
  bs.market_type,
  (SELECT COUNT(*) FROM price_watchlist pw WHERE pw.user_id = u.id) as watchlist_count
FROM auth.users u
LEFT JOIN bot_settings bs ON bs.user_id = u.id
WHERE bs.is_active = true;
```

## 📊 مراقبة النظام

### في الواجهة:
- **صفحة TradingView**: عرض جميع الإشارات
- **صفحة Signals**: عرض الإشارات المحسنة

### في قاعدة البيانات:
- **tradingview_signals**: جميع الإشارات
- **bot_settings**: إعدادات البوت
- **price_watchlist**: قائمة المراقبة

## 🔧 استكشاف الأخطاء

### لا توجد إشارات:
1. تحقق من أن `bot_settings.is_active = true`
2. تحقق من وجود رموز في `price_watchlist`
3. تحقق من سجلات Edge Functions في Supabase Dashboard
4. تحقق من Cron Jobs في `cron.job` table

### Cron Jobs لا تعمل:
```sql
-- عرض جميع Cron Jobs
SELECT * FROM cron.job ORDER BY jobid;

-- عرض سجل التنفيذ
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

## 📝 ملاحظات مهمة

1. **Cron Jobs تعمل في UTC** - تأكد من ضبط الوقت
2. **Service Role Key** - احتفظ به آمناً ولا تشاركه
3. **Edge Functions** - تأكد من نشرها قبل تفعيل Cron Jobs
4. **الرموز الافتراضية** - يمكن تعديلها في `setup_internal_signals.sql`

## ✅ قائمة التحقق

- [ ] تم تشغيل `setup_internal_signals.sql`
- [ ] تم تفعيل Cron Jobs (`CRON_JOBS_SETUP.sql`)
- [ ] تم نشر `strategy-runner-worker`
- [ ] تم التحقق من وجود إشارات في `tradingview_signals`
- [ ] تم التحقق من عمل Cron Jobs

---

**تم إنشاء هذا الدليل بواسطة:** AI Assistant  
**التاريخ:** 2025-01-25

