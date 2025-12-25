-- التحقق من حالة الإشارات و Cron Jobs
-- استخدم هذا الملف في Supabase SQL Editor

-- ============================================
-- 1. التحقق من Cron Job Status
-- ============================================
SELECT 
  j.jobname AS "اسم الوظيفة",
  j.schedule AS "الجدولة",
  CASE 
    WHEN j.active THEN '✅ نشط'
    ELSE '❌ غير نشط'
  END AS "الحالة",
  MAX(jrd.start_time) AS "آخر تشغيل",
  COUNT(jrd.jobid) AS "عدد التنفيذات"
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname = 'ai-signal-runner'
GROUP BY j.jobname, j.schedule, j.active;

-- ============================================
-- 2. التحقق من آخر تنفيذات Cron Job
-- ============================================
SELECT 
  j.jobname AS "اسم الوظيفة",
  jrd.start_time AS "وقت البدء",
  jrd.end_time AS "وقت الانتهاء",
  jrd.status AS "الحالة",
  jrd.return_message AS "الرسالة",
  CASE 
    WHEN jrd.end_time IS NOT NULL AND jrd.start_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))::text || ' ثانية'
    ELSE 'قيد التنفيذ'
  END AS "مدة التنفيذ"
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'ai-signal-runner'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- ============================================
-- 3. التحقق من الإشارات المولدة (آخر 24 ساعة)
-- ============================================
SELECT 
  symbol AS "الرمز",
  timeframe AS "الإطار الزمني",
  side AS "الاتجاه",
  final_confidence AS "الثقة",
  created_at AS "وقت الإنشاء",
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS "الدقائق منذ الإنشاء"
FROM ai_signals_history
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 4. إحصائيات الإشارات (آخر 24 ساعة)
-- ============================================
SELECT 
  COUNT(*) AS "إجمالي الإشارات",
  COUNT(DISTINCT symbol) AS "عدد الرموز المختلفة",
  COUNT(DISTINCT timeframe) AS "عدد الإطارات المختلفة",
  COUNT(CASE WHEN side = 'BUY' THEN 1 END) AS "إشارات الشراء",
  COUNT(CASE WHEN side = 'SELL' THEN 1 END) AS "إشارات البيع",
  AVG(final_confidence) AS "متوسط الثقة",
  MIN(created_at) AS "أقدم إشارة",
  MAX(created_at) AS "أحدث إشارة"
FROM ai_signals_history
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 5. التحقق من Cooldown (الإشارات في آخر 15 دقيقة)
-- ============================================
SELECT 
  symbol AS "الرمز",
  timeframe AS "الإطار الزمني",
  side AS "الاتجاه",
  COUNT(*) AS "عدد الإشارات",
  MAX(created_at) AS "آخر إشارة",
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/60 AS "الدقائق منذ آخر إشارة"
FROM ai_signals_history
WHERE created_at >= NOW() - INTERVAL '15 minutes'
GROUP BY symbol, timeframe, side
ORDER BY MAX(created_at) DESC;

-- ============================================
-- 6. التحقق من Edge Function Logs (آخر 10 دقائق)
-- ============================================
-- اذهب إلى: Supabase Dashboard → Edge Functions → ai-signal-runner → Logs
-- وابحث عن:
-- - "🚀 Starting AI Signal Runner..."
-- - "✅ Generated AI signal"
-- - "Signal already exists... skipping"
-- - أي أخطاء

