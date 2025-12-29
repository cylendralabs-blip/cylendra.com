-- ========================================
-- Create Missing Cron Jobs for Phase 18
-- ========================================
-- Run this if the migration didn't create the new cron jobs

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- ============================================
-- Cron Job 1: position-monitor-worker
-- ============================================
-- Remove existing if any (with error handling)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'position-monitor-worker') THEN
    PERFORM cron.unschedule('position-monitor-worker');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
  NULL;
END $$;

-- Create new
SELECT cron.schedule(
  'position-monitor-worker',
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

-- ============================================
-- Cron Job 2: portfolio-sync-worker
-- ============================================
-- Remove existing if any (with error handling)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'portfolio-sync-worker') THEN
    PERFORM cron.unschedule('portfolio-sync-worker');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
  NULL;
END $$;

-- Create new
SELECT cron.schedule(
  'portfolio-sync-worker',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/portfolio-sync-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- Cron Job 3: daily-system-stats
-- ============================================
-- Remove existing if any (with error handling)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-system-stats') THEN
    PERFORM cron.unschedule('daily-system-stats');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, continue
  NULL;
END $$;

-- Create new
SELECT cron.schedule(
  'daily-system-stats',
  '0 0 * * *',  -- Daily at midnight UTC
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/system-health-check',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'record_daily_stats')
  );
  $$
);

-- ============================================
-- Verify all cron jobs are created
-- ============================================
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

