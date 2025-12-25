-- ========================================
-- التحقق من Cron Jobs (مصحح)
-- ========================================

-- 1. عرض جميع Cron Jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename,
  nodeport
FROM cron.job
ORDER BY jobid;

-- 2. عرض آخر 10 تنفيذات (مصحح - استخدام started_at)
SELECT 
  j.jobname,
  jrd.started_at,
  jrd.job_pid,
  jrd.status,
  jrd.return_message,
  jrd.message as error_message
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
ORDER BY jrd.started_at DESC
LIMIT 10;

-- 3. إحصائيات التنفيذات (مصحح)
SELECT 
  j.jobname,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as succeeded,
  COUNT(CASE WHEN jrd.status = 'failed' THEN 1 END) as failed,
  MAX(jrd.started_at) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
GROUP BY j.jobname
ORDER BY j.jobname;

-- 4. عرض تفاصيل آخر تنفيذ لكل Job
SELECT 
  j.jobname,
  jrd.started_at,
  jrd.status,
  jrd.return_message,
  jrd.message
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY started_at DESC
  LIMIT 1
) jrd ON true
ORDER BY j.jobname;

