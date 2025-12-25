-- ========================================
-- عرض تفاصيل فشل Cron Jobs (مصحح نهائياً)
-- ========================================
-- استخدم هذا الاستعلام لمعرفة سبب فشل Cron Jobs

-- 1. عرض آخر تنفيذ فاشل لكل Job
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message,
  LEFT(jrd.command, 150) as command_preview
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

-- 2. عرض تفاصيل الأخطاء في آخر 5 أيام
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message,
  LEFT(jrd.command, 150) as command_preview
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE jrd.status <> 'succeeded' 
  AND jrd.status <> 'running'
  AND jrd.start_time > NOW() - INTERVAL '5 days'
ORDER BY jrd.start_time DESC
LIMIT 10;

