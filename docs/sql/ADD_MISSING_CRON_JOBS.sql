-- This script only adds the missing cron jobs:
--   - strategy-runner-4h
--   - strategy-runner-1d
-- It does NOT recreate the existing jobs (auto-trader-worker, strategy-runner-15m, strategy-runner-1h).

WITH cron_defs AS (
  SELECT 'strategy-runner-4h'::text AS jobname, '0 * * * *'::text AS sched, '4h'::text AS timeframe
  UNION ALL
  SELECT 'strategy-runner-1d', '0 0 * * *', '1d'
)
SELECT cron.schedule(
  jobname,
  sched,
  format($$SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('timeframe', '%s')
  )$$, timeframe)
)
FROM cron_defs d
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job j WHERE j.jobname = d.jobname
);

-- Show the cron jobs for verification
SELECT 
  jobname AS "job_name",
  schedule AS "schedule",
  CASE 
    WHEN active THEN 'active'
    ELSE 'inactive'
  END AS "status"
FROM cron.job
WHERE jobname IN ('strategy-runner-4h', 'strategy-runner-1d')
ORDER BY jobname;

