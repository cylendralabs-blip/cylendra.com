-- Phase 3.2: Add cron job for smart-trade-manager
-- Runs every 30 seconds to manage bot-managed Smart Trade positions

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-trade-manager') THEN
    PERFORM cron.unschedule('smart-trade-manager');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if job doesn't exist
    NULL;
END $$;

-- Schedule smart-trade-manager (runs every 30 seconds)
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
  project_ref TEXT := 'pjgfrhgjbbsqsmwfljpg';
BEGIN
  -- Schedule the job
  PERFORM cron.schedule(
    'smart-trade-manager',
    '*/30 * * * * *', -- Every 30 seconds (using 6-field cron syntax)
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/smart-trade-manager',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron1$
  );
  
  RAISE NOTICE '✅ Cron job "smart-trade-manager" scheduled (every 30 seconds)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling cron job: %', SQLERRM;
END $$;

