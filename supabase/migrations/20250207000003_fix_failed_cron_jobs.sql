-- Fix Failed Cron Jobs
-- Phase Admin Billing: Fix business-analytics-aggregator and ticket-automation-worker

-- Fix business-analytics-aggregator cron job
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
BEGIN
  -- Unschedule if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'business-analytics-aggregator') THEN
    PERFORM cron.unschedule('business-analytics-aggregator');
  END IF;
  
  -- Schedule the job with correct URL
  PERFORM cron.schedule(
    'business-analytics-aggregator',
    '0 1 * * *', -- Daily at 1 AM UTC
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/business-analytics-aggregator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron1$
  );
  
  RAISE NOTICE '✅ Cron job "business-analytics-aggregator" fixed and scheduled (daily at 1 AM UTC)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error fixing cron job: %', SQLERRM;
END $$;

-- Fix ticket-automation-worker cron job
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
BEGIN
  -- Unschedule if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ticket-automation-worker') THEN
    PERFORM cron.unschedule('ticket-automation-worker');
  END IF;
  
  -- Schedule the job with correct URL
  PERFORM cron.schedule(
    'ticket-automation-worker',
    '0 * * * *', -- Every hour
    $cron2$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ticket-automation-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron2$
  );
  
  RAISE NOTICE '✅ Cron job "ticket-automation-worker" fixed and scheduled (every hour)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error fixing cron job: %', SQLERRM;
END $$;

