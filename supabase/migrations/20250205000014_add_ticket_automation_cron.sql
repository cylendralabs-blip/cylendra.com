-- Phase Admin E: Add ticket automation cron job

-- Enable extensions if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove existing job if it exists
do $$
begin
  if exists (select 1 from cron.job where jobname = 'ticket-automation-worker') then
    perform cron.unschedule('ticket-automation-worker');
  end if;
exception
  when others then
    -- Ignore errors if job doesn't exist
    null;
end $$;

-- Schedule ticket automation worker (runs every hour)
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
  project_ref TEXT := 'pjgfrhgjbbsqsmwfljpg';
BEGIN
  -- Unschedule if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ticket-automation-worker') THEN
    PERFORM cron.unschedule('ticket-automation-worker');
  END IF;
  
  -- Schedule the job
  PERFORM cron.schedule(
    'ticket-automation-worker',
    '0 * * * *', -- Every hour
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ticket-automation-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron1$
  );
  
  RAISE NOTICE '✅ Cron job "ticket-automation-worker" scheduled (every hour)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling cron job: %', SQLERRM;
END $$;

