-- ========================================
-- التحقق من Cron Jobs (مصحح)
-- ========================================

-- 0. التحقق من أعمدة جدول cron.job_run_details
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'cron'
  AND table_name = 'job_run_details'
ORDER BY ordinal_position;

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

-- 2. عرض آخر 10 تنفيذات (مصحح - استخدام start_time)
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.job_pid,
  jrd.status,
  jrd.return_message,
  jrd.return_message as error_message
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 3. إحصائيات التنفيذات (مصحح - استخدام start_time)
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

