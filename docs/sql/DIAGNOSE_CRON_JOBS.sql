-- ========================================
-- Diagnose Cron Jobs Issue
-- ========================================

-- 1. List ALL cron jobs to see what exists
SELECT 
  jobid,
  jobname,
  active,
  schedule,
  LEFT(command, 100) as command_preview
FROM cron.job
ORDER BY jobname;

-- 2. Check if new cron jobs exist with different names
SELECT 
  jobname,
  active,
  schedule
FROM cron.job
WHERE jobname LIKE '%monitor%'
   OR jobname LIKE '%sync%'
   OR jobname LIKE '%stats%'
   OR jobname LIKE '%portfolio%'
   OR jobname LIKE '%position%'
   OR jobname LIKE '%daily%'
ORDER BY jobname;

-- 3. Check migration execution logs (if available)
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct
FROM pg_stats
WHERE tablename LIKE '%cron%'
LIMIT 10;

-- 4. Try to manually create one cron job to test
-- (This will help diagnose if there's a permission or syntax issue)
-- Uncomment to test:
/*
SELECT cron.schedule(
  'test-position-monitor-worker',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/position-monitor-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
*/

