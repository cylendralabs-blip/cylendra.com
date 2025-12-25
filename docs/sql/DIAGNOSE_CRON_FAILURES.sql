-- ========================================
-- تشخيص فشل Cron Jobs
-- ========================================

-- 1. التحقق من أعمدة جدول cron.job_run_details
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'cron'
  AND table_name = 'job_run_details'
ORDER BY ordinal_position;

-- 2. عرض جميع Cron Jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
ORDER BY jobid;

-- 3. عرض آخر تنفيذ فاشل لكل Job (مصحح نهائياً - استخدام الأعمدة الصحيحة)
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message,
  LEFT(jrd.command, 100) as command_preview
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) jrd ON true
WHERE jrd.status <> 'succeeded' AND jrd.status <> 'running'
ORDER BY j.jobname;

-- 4. عرض آخر 5 تنفيذات لجميع Jobs (مصحح نهائياً)
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  LEFT(jrd.return_message, 200) as return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
ORDER BY jrd.start_time DESC
LIMIT 5;

-- 5. عرض تفاصيل الأخطاء في آخر 5 أيام
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message,
  LEFT(jrd.command, 100) as command_preview
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE jrd.status <> 'succeeded' 
  AND jrd.status <> 'running'
  AND jrd.start_time > NOW() - INTERVAL '5 days'
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 6. إحصائيات التنفيذات (مصحح - استخدام start_time)
SELECT 
  j.jobname,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as succeeded,
  COUNT(CASE WHEN jrd.status <> 'succeeded' AND jrd.status <> 'running' THEN 1 END) as failed,
  MAX(jrd.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
GROUP BY j.jobname
ORDER BY j.jobname;

