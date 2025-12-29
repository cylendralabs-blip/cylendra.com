-- ========================================
-- Phase 18: Verify Cron Jobs Setup
-- ========================================

-- 1. Check if all required cron jobs exist and are active
SELECT 
  jobname,
  active,
  schedule,
  CASE 
    WHEN active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM cron.job
WHERE jobname IN (
  'auto-trader-worker',
  'position-monitor-worker',
  'portfolio-sync-worker',
  'daily-system-stats'
)
ORDER BY jobname;

-- 2. Check recent executions for new cron jobs (last 10)
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.status,
  jrd.return_message,
  CASE 
    WHEN jrd.status = 'succeeded' THEN '✅'
    WHEN jrd.status = 'running' THEN '⏳'
    ELSE '❌'
  END as icon
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname IN (
  'position-monitor-worker',
  'portfolio-sync-worker',
  'daily-system-stats'
)
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 3. Statistics for new cron jobs
SELECT 
  j.jobname,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) as succeeded,
  COUNT(CASE WHEN jrd.status <> 'succeeded' AND jrd.status <> 'running' THEN 1 END) as failed,
  MAX(jrd.start_time) as last_run,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No runs yet'
    WHEN COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END) = COUNT(*) THEN '✅ 100% Success'
    WHEN COUNT(CASE WHEN jrd.status = 'succeeded' THEN 1 END)::float / COUNT(*) > 0.95 THEN '✅ Good'
    ELSE '⚠️ Check failures'
  END as health
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE j.jobname IN (
  'position-monitor-worker',
  'portfolio-sync-worker',
  'daily-system-stats'
)
GROUP BY j.jobname
ORDER BY j.jobname;

