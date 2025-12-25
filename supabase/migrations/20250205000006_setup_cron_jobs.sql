-- Phase 18: Setup Cron Jobs for Production
-- This migration sets up all required cron jobs for the system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- ============================================
-- Cron Jobs Setup
-- ============================================
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
  project_ref TEXT := 'pjgfrhgjbbsqsmwfljpg';
  base_url TEXT;
BEGIN
  base_url := 'https://' || project_ref || '.supabase.co';
  
  -- ============================================
  -- Cron Job 1: auto-trader-worker
  -- ============================================
  -- Runs every 1 minute to process pending signals
  PERFORM cron.unschedule('auto-trader-worker');
  
  PERFORM cron.schedule(
    'auto-trader-worker',
    '* * * * *',  -- Every minute
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/auto-trader-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron1$
  );
  
  RAISE NOTICE '✅ Cron job "auto-trader-worker" scheduled (every 1 minute)';
  
  -- ============================================
  -- Cron Job 2: position-monitor-worker
  -- ============================================
  -- Runs every 5 minutes to monitor positions and risk
  PERFORM cron.unschedule('position-monitor-worker');
  
  PERFORM cron.schedule(
    'position-monitor-worker',
    '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- Every 5 minutes
    $cron2$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/position-monitor-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron2$
  );
  
  RAISE NOTICE '✅ Cron job "position-monitor-worker" scheduled (every 5 minutes)';
  
  -- ============================================
  -- Cron Job 3: portfolio-sync-worker
  -- ============================================
  -- Runs every hour to sync portfolio data
  PERFORM cron.unschedule('portfolio-sync-worker');
  
  PERFORM cron.schedule(
    'portfolio-sync-worker',
    '0 * * * *',  -- Every hour at minute 0
    $cron3$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/portfolio-sync-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron3$
  );
  
  RAISE NOTICE '✅ Cron job "portfolio-sync-worker" scheduled (every hour)';
  
  -- ============================================
  -- Cron Job 4: daily-system-stats
  -- ============================================
  -- Runs daily at midnight UTC to record system statistics
  PERFORM cron.unschedule('daily-system-stats');
  
  PERFORM cron.schedule(
    'daily-system-stats',
    '0 0 * * *',  -- Daily at midnight UTC
    $cron4$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/system-health-check',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'record_daily_stats')
    );
    $cron4$
  );
  
  RAISE NOTICE '✅ Cron job "daily-system-stats" scheduled (daily at midnight)';
  
  RAISE NOTICE '🎉 All cron jobs scheduled successfully!';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error setting up cron jobs: %', SQLERRM;
END $$;

