-- ========================================
-- Check ALL Cron Jobs (including new ones)
-- ========================================

-- 1. List ALL cron jobs
SELECT 
  jobid,
  jobname,
  active,
  schedule,
  CASE 
    WHEN active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM cron.job
ORDER BY jobname;

-- 2. Check specifically for Phase 18 cron jobs
SELECT 
  jobname,
  active,
  schedule,
  CASE 
    WHEN active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status,
  CASE 
    WHEN jobname = 'auto-trader-worker' THEN '✅ Found'
    WHEN jobname = 'position-monitor-worker' THEN '✅ Found'
    WHEN jobname = 'portfolio-sync-worker' THEN '✅ Found'
    WHEN jobname = 'daily-system-stats' THEN '✅ Found'
    ELSE '❌ Missing'
  END as phase18_status
FROM cron.job
WHERE jobname IN (
  'auto-trader-worker',
  'position-monitor-worker',
  'portfolio-sync-worker',
  'daily-system-stats'
)
ORDER BY jobname;

-- 3. Check if migration created any new jobs (check all jobs)
SELECT 
  jobname,
  active,
  schedule,
  command
FROM cron.job
WHERE jobname LIKE '%worker%' 
   OR jobname LIKE '%sync%'
   OR jobname LIKE '%stats%'
ORDER BY jobname;

