# تفعيل محرك الإشارات - Signal Engine Activation

## 📋 نظرة عامة

تم تفعيل محرك الإشارات بالكامل. النظام الآن يولد إشارات تلقائياً من:
1. **إشارات المؤشرات الفنية** (Indicator-based signals) - عبر `strategy-runner-worker`
2. **إشارات الذكاء الاصطناعي** (AI signals) - عبر `ai-signal-runner`

---

## ✅ ما تم إنجازه

### 1. Cron Jobs للإشارات

تم إنشاء 5 cron jobs في ملف:
`supabase/migrations/20250213000002_enable_signal_engine_cron.sql`

#### إشارات المؤشرات (Indicator Signals):
- **strategy-runner-15m**: كل 5 دقائق
- **strategy-runner-1h**: كل 15 دقيقة
- **strategy-runner-4h**: كل ساعة
- **strategy-runner-1d**: يومياً في منتصف الليل UTC

#### إشارات الذكاء الاصطناعي (AI Signals):
- **ai-signal-runner**: كل 10 دقائق

### 2. Edge Function جديد

تم إنشاء `supabase/functions/ai-signal-runner/index.ts`:
- يولد إشارات AI باستخدام المؤشرات الفنية
- يحفظ الإشارات في جدول `ai_signals_history`
- يعمل تلقائياً عبر cron job

### 3. جداول قاعدة البيانات

تم التحقق من وجود الجداول التالية:
- ✅ `tradingview_signals` - لإشارات المؤشرات
- ✅ `ai_signals_history` - لإشارات AI
- ✅ `trading_signals` - للنسخ الاحتياطي

---

## 🚀 خطوات التفعيل

### الخطوة 1: تطبيق Migration

في Supabase Dashboard → SQL Editor:

```sql
-- تطبيق migration
-- File: supabase/migrations/20250213000002_enable_signal_engine_cron.sql
```

أو عبر CLI:
```bash
supabase db push
```

### الخطوة 2: نشر Edge Functions

```bash
# نشر AI Signal Runner
supabase functions deploy ai-signal-runner

# التحقق من strategy-runner-worker (يجب أن يكون منشوراً مسبقاً)
supabase functions deploy strategy-runner-worker
```

### الخطوة 3: التحقق من Cron Jobs

في Supabase Dashboard → Database → Cron Jobs:

يجب أن ترى:
- ✅ strategy-runner-15m (Active)
- ✅ strategy-runner-1h (Active)
- ✅ strategy-runner-4h (Active)
- ✅ strategy-runner-1d (Active)
- ✅ ai-signal-runner (Active)

### الخطوة 4: اختبار توليد الإشارات

#### اختبار يدوي:

```bash
# اختبار strategy-runner-worker
curl -X POST https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "15m"}'

# اختبار ai-signal-runner
curl -X POST https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ai-signal-runner \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeframes": ["15m", "1h"]}'
```

#### التحقق من الإشارات في قاعدة البيانات:

```sql
-- إشارات المؤشرات
SELECT * FROM tradingview_signals 
WHERE source = 'internal_engine' 
ORDER BY created_at DESC 
LIMIT 10;

-- إشارات AI
SELECT * FROM ai_signals_history 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📊 كيف يعمل النظام

### 1. إشارات المؤشرات (Indicator Signals)

**المصدر**: `strategy-runner-worker`

**العملية**:
1. يجلب رموز من `price_watchlist` للمستخدمين النشطين
2. يجلب الشموع من `get-candles` function
3. يحسب المؤشرات الفنية (RSI, MACD, Bollinger Bands, EMA, Stochastic, ATR)
4. يولد إشارات بناءً على قواعد الاستراتيجية
5. يحفظ في `tradingview_signals` مع `source='internal_engine'`

**الجدول**: `tradingview_signals`

### 2. إشارات الذكاء الاصطناعي (AI Signals)

**المصدر**: `ai-signal-runner`

**العملية**:
1. يجلب رموز من `price_watchlist` للمستخدمين النشطين
2. يجلب الشموع من `get-candles` function
3. يحسب المؤشرات الفنية (RSI, MACD)
4. يولد إشارات AI محسّنة
5. يحفظ في `ai_signals_history`

**الجدول**: `ai_signals_history`

---

## 🔍 مراقبة النظام

### 1. مراقبة Cron Jobs

```sql
-- عرض جميع cron jobs
SELECT 
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job
WHERE jobname LIKE '%signal%' OR jobname LIKE '%strategy%'
ORDER BY jobname;
```

### 2. مراقبة الإشارات المولدة

```sql
-- عدد الإشارات المولدة اليوم
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signal_count,
  COUNT(DISTINCT symbol) as unique_symbols
FROM tradingview_signals
WHERE source = 'internal_engine'
  AND created_at >= CURRENT_DATE
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- عدد إشارات AI المولدة اليوم
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signal_count,
  COUNT(DISTINCT symbol) as unique_symbols
FROM ai_signals_history
WHERE created_at >= CURRENT_DATE
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. مراقبة الأخطاء

في Supabase Dashboard → Edge Functions → Logs:
- تحقق من `strategy-runner-worker` logs
- تحقق من `ai-signal-runner` logs

---

## ⚙️ الإعدادات

### تعديل التردد

في ملف `supabase/migrations/20250213000002_enable_signal_engine_cron.sql`:

```sql
-- مثال: تغيير تردد ai-signal-runner إلى كل 5 دقائق
PERFORM cron.schedule(
  'ai-signal-runner',
  '*/5 * * * *', -- كل 5 دقائق بدلاً من 10
  ...
);
```

### تعديل الرموز المعالجة

في `supabase/functions/strategy-runner-worker/config.ts`:
```typescript
export const STRATEGY_RUNNER_CONFIG = {
  TIMEFRAMES: ['5m', '15m', '30m', '1h', '4h', '1d'],
  MIN_CONFIDENCE: 60, // الحد الأدنى للثقة
  ...
};
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا توجد إشارات

**الحل**:
1. تحقق من وجود مستخدمين نشطين مع `bot_settings.is_active = true`
2. تحقق من وجود رموز في `price_watchlist`
3. تحقق من logs في Edge Functions
4. تحقق من أن `get-candles` function يعمل بشكل صحيح

### المشكلة: Cron Jobs غير نشطة

**الحل**:
```sql
-- تفعيل cron job يدوياً
UPDATE cron.job SET active = true WHERE jobname = 'strategy-runner-15m';
```

### المشكلة: أخطاء في حفظ الإشارات

**الحل**:
1. تحقق من وجود الجداول (`tradingview_signals`, `ai_signals_history`)
2. تحقق من RLS policies
3. تحقق من service_role_key في cron jobs

---

## 📝 ملاحظات مهمة

1. **Cooldown**: النظام يمنع توليد إشارات مكررة لنفس الرمز/الإطار الزمني خلال 15 دقيقة
2. **Rate Limiting**: هناك تأخير 500ms بين معالجة الرموز لتجنب rate limiting
3. **Minimum Candles**: يحتاج النظام إلى 50+ شمعة على الأقل لتوليد إشارات
4. **Confidence Threshold**: الحد الأدنى للثقة هو 60% (يمكن تعديله في config)

---

## ✅ التحقق النهائي

بعد تطبيق جميع الخطوات، يجب أن ترى:

1. ✅ Cron jobs نشطة في Supabase Dashboard
2. ✅ إشارات جديدة تظهر في `tradingview_signals` و `ai_signals_history`
3. ✅ لا توجد أخطاء في Edge Functions logs
4. ✅ الإشارات تظهر في الواجهة الأمامية

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs في Supabase Dashboard
2. تحقق من cron jobs status
3. تحقق من جداول قاعدة البيانات
4. راجع هذا الملف للتوثيق الكامل

---

**تاريخ الإنشاء**: 2025-02-13
**الحالة**: ✅ مفعّل وجاهز للاستخدام

