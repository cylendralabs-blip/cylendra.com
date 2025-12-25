-- ============================================
-- التحقق من تنفيذات Cron Job لـ ai-signal-runner
-- ============================================

-- 1. التحقق من آخر 10 تنفيذات
SELECT 
  j.jobname AS "اسم الوظيفة",
  jrd.start_time AS "وقت البدء",
  jrd.end_time AS "وقت الانتهاء",
  jrd.status AS "الحالة",
  CASE 
    WHEN jrd.end_time IS NOT NULL AND jrd.start_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))::text || ' ثانية'
    ELSE 'قيد التنفيذ'
  END AS "مدة التنفيذ",
  LEFT(jrd.return_message, 200) AS "الرسالة"
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'ai-signal-runner'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 2. إحصائيات التنفيذات (آخر 24 ساعة)
SELECT 
  COUNT(*) AS "إجمالي التنفيذات",
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) AS "نجحت",
  COUNT(CASE WHEN jrd.status <> 'succeeded' AND jrd.status <> 'running' THEN 1 END) AS "فشلت",
  MAX(jrd.start_time) AS "آخر تنفيذ"
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'ai-signal-runner'
  AND jrd.start_time >= NOW() - INTERVAL '24 hours';

-- 3. التحقق من Active Signals (الجدول الجديد)
SELECT 
  symbol AS "الرمز",
  timeframe AS "الإطار الزمني",
  side AS "الاتجاه",
  final_confidence AS "الثقة",
  status AS "الحالة",
  updated_at AS "آخر تحديث",
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 AS "الدقائق منذ آخر تحديث"
FROM ai_signals_active
ORDER BY updated_at DESC
LIMIT 20;

-- 4. مقارنة Active Signals مع History (آخر 24 ساعة)
SELECT 
  'Active Signals' AS "النوع",
  COUNT(*) AS "العدد"
FROM ai_signals_active
WHERE updated_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'History Signals' AS "النوع",
  COUNT(*) AS "العدد"
FROM ai_signals_history
WHERE created_at >= NOW() - INTERVAL '24 hours';

