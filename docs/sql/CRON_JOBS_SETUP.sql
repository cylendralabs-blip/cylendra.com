-- ============================================
-- Cron Jobs Setup for NeuroTrade AI
-- Phase 5: Risk Management Engine Complete
-- ============================================

-- ============================================
-- IMPORTANT: Before running, replace these values:
-- ============================================
-- 1. Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
--    Get it from: Supabase Dashboard > Settings > API > service_role key
-- 2. Replace YOUR_PROJECT_REF if different: pjgfrhgjbbsqsmwfljpg

-- ============================================
-- Step 1: Enable pg_net extension (if not enabled)
-- ============================================
-- This is needed for HTTP requests to Edge Functions
-- Run this in SQL Editor first if pg_net is not enabled

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ============================================
-- Step 2: Enable pg_cron extension (if not enabled)
-- ============================================
-- This is needed for scheduling cron jobs
-- Run this in SQL Editor first if pg_cron is not enabled

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- ============================================
-- Step 3: Set your Service Role Key
-- ============================================
-- IMPORTANT: Replace this with your actual service role key
-- Get it from: Supabase Dashboard > Settings > API > service_role key

DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4'; -- ⚠️ REPLACE THIS
  project_ref TEXT := 'pjgfrhgjbbsqsmwfljpg';
  base_url TEXT;
BEGIN
  base_url := 'https://' || project_ref || '.supabase.co';
  
  -- ============================================
  -- Cron Job 1: auto-trader-worker
  -- ============================================
  -- Runs every 1 minute to process pending signals
  -- Deployed Edge Function: auto-trader-worker
  
  -- Remove existing cron job if exists
  PERFORM cron.unschedule('auto-trader-worker');
  
  -- Create new cron job
  PERFORM cron.schedule(
    'auto-trader-worker',           -- Job name
    '* * * * *',                    -- Schedule: Every minute
    $$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/auto-trader-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
    $$
  );
  
  RAISE NOTICE '✅ Cron job "auto-trader-worker" scheduled (every 1 minute)';
  
  -- ============================================
  -- Cron Job 2: strategy-runner-worker (15m timeframe)
  -- ============================================
  -- Runs every 5 minutes for 15m timeframe
  -- Deployed Edge Function: strategy-runner-worker
  
  PERFORM cron.unschedule('strategy-runner-15m');
  
  PERFORM cron.schedule(
    'strategy-runner-15m',
    '*/5 * * * *',                  -- Schedule: Every 5 minutes
    $$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '15m')
    ) AS request_id;
    $$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-15m" scheduled (every 5 minutes)';
  
  -- ============================================
  -- Cron Job 3: strategy-runner-worker (1h timeframe)
  -- ============================================
  -- Runs every 15 minutes for 1h timeframe
  
  PERFORM cron.unschedule('strategy-runner-1h');
  
  PERFORM cron.schedule(
    'strategy-runner-1h',
    '*/15 * * * *',                 -- Schedule: Every 15 minutes
    $$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1h')
    ) AS request_id;
    $$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-1h" scheduled (every 15 minutes)';
  
  -- ============================================
  -- Cron Job 4: strategy-runner-worker (4h timeframe)
  -- ============================================
  -- Runs every hour for 4h timeframe
  
  PERFORM cron.unschedule('strategy-runner-4h');
  
  PERFORM cron.schedule(
    'strategy-runner-4h',
    '0 * * * *',                    -- Schedule: Every hour at minute 0
    $$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '4h')
    ) AS request_id;
    $$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-4h" scheduled (every hour)';
  
  -- ============================================
  -- Cron Job 5: strategy-runner-worker (1d timeframe)
  -- ============================================
  -- Runs every day at midnight for daily timeframe
  
  PERFORM cron.unschedule('strategy-runner-1d');
  
  PERFORM cron.schedule(
    'strategy-runner-1d',
    '0 0 * * *',                    -- Schedule: Every day at midnight
    $$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1d')
    ) AS request_id;
    $$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-1d" scheduled (daily at midnight)';
  
  RAISE NOTICE '🎉 All cron jobs scheduled successfully!';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error setting up cron jobs: %', SQLERRM;
END $$;

-- ============================================
-- View All Scheduled Cron Jobs
-- ============================================
-- Run this to see all your cron jobs:

-- SELECT * FROM cron.job ORDER BY jobid;

-- ============================================
-- Disable/Enable Cron Jobs
-- ============================================

-- Disable a cron job:
-- SELECT cron.unschedule('auto-trader-worker');

-- Re-enable a cron job:
-- (Re-run the schedule command above)

-- ============================================
-- View Cron Job Execution History
-- ============================================
-- Run this to see recent executions:

-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Replace eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4 with your actual service role key
-- 2. Get Service Role Key from: Supabase Dashboard > Settings > API > service_role
-- 3. All URLs use project ref: pjgfrhgjbbsqsmwfljpg
-- 4. Make sure pg_net and pg_cron extensions are enabled
-- 5. Cron jobs run in UTC timezone
-- 6. Monitor execution in cron.job_run_details table

