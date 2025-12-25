-- Fix ai-signal-runner cron job: Add apikey header
-- This migration adds the apikey header to fix cron job execution
-- Supabase Edge Functions Gateway requires both Authorization and apikey headers

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing ai-signal-runner job if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-signal-runner') THEN
    PERFORM cron.unschedule('ai-signal-runner');
    RAISE NOTICE 'Removed existing ai-signal-runner cron job';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error removing existing job: %', SQLERRM;
END $$;

-- Recreate ai-signal-runner cron job with apikey header
-- Using service_role_key as apikey (same as Authorization Bearer token)
DO $$
BEGIN
  PERFORM cron.schedule(
    'ai-signal-runner',
    '*/10 * * * *', -- Every 10 minutes
    $cron$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ai-signal-runner',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxMjMsImV4cCI6MjA4MDgwMTEyM30.sA925bnHvb3RP4b2RYyUDj73icuDUtIlRFXc1AcQ7Uw',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframes', ARRAY['15m', '1h', '4h'])
    );
    $cron$
  );

  RAISE NOTICE '✅ Cron job "ai-signal-runner" recreated with apikey header (every 10 minutes)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error recreating ai-signal-runner: %', SQLERRM;
END $$;

-- Verify the cron job was created
SELECT 
  jobname AS "Job Name",
  schedule AS "Schedule",
  CASE 
    WHEN active THEN '✅ Active'
    ELSE '❌ Inactive'
  END AS "Status"
FROM cron.job
WHERE jobname = 'ai-signal-runner';

-- Test the cron job manually (optional - uncomment to test)
-- This will return a request_id that you can use to check the response
-- SELECT net.http_post(
--   url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ai-signal-runner',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
--     'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxMjMsImV4cCI6MjA4MDgwMTEyM30.sA925bnHvb3RP4b2RYyUDj73icuDUtIlRFXc1AcQ7Uw',
--     'Content-Type', 'application/json'
--   ),
--   body := jsonb_build_object('timeframes', ARRAY['15m', '1h', '4h'])
-- ) AS request_id;
-- 
-- Then check the response:
-- SELECT * FROM net.http_get_response(<request_id>);

