-- Fix subscription-email-notifier cron job
-- Phase Admin Billing: Fix the service_role_key variable issue

DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
  job_exists BOOLEAN;
BEGIN
  -- Check if job exists before unscheduling
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'subscription-email-notifier'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('subscription-email-notifier');
  END IF;
  
  -- Schedule the job with service_role_key embedded directly in the command string
  -- Note: We use single quotes and escape them by doubling them ('')
  PERFORM cron.schedule(
    'subscription-email-notifier',
    '0 * * * *', -- Every hour
    'SELECT net.http_post(
      url := ''https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/subscription-email-notifier'',
      headers := jsonb_build_object(
        ''Authorization'', ''Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4'',
        ''Content-Type'', ''application/json''
      ),
      body := ''{}''::jsonb
    );'
  );
  
  RAISE NOTICE '✅ Cron job "subscription-email-notifier" fixed and scheduled (every hour)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error fixing cron job: %', SQLERRM;
END $$;

