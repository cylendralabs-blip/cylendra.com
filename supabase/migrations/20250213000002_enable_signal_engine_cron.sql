-- Phase: Enable Signal Engine
-- This migration activates the signal generation system by scheduling cron jobs
-- for both indicator-based signals (strategy-runner-worker) and AI signals

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- Cron Job 1: strategy-runner-worker (15m timeframe)
-- ============================================
-- Runs every 5 minutes to generate indicator-based signals for 15m timeframe
-- Saves to: tradingview_signals table with source='internal_engine'

DO $$
BEGIN
  -- Remove existing job if it exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-15m') THEN
    PERFORM cron.unschedule('strategy-runner-15m');
  END IF;

  -- Schedule the job
  PERFORM cron.schedule(
    'strategy-runner-15m',
    '*/5 * * * *', -- Every 5 minutes
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '15m')
    );
    $cron1$
  );

  RAISE NOTICE '✅ Cron job "strategy-runner-15m" scheduled (every 5 minutes)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling strategy-runner-15m: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 2: strategy-runner-worker (1h timeframe)
-- ============================================
-- Runs every 15 minutes to generate indicator-based signals for 1h timeframe

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-1h') THEN
    PERFORM cron.unschedule('strategy-runner-1h');
  END IF;

  PERFORM cron.schedule(
    'strategy-runner-1h',
    '*/15 * * * *', -- Every 15 minutes
    $cron2$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1h')
    );
    $cron2$
  );

  RAISE NOTICE '✅ Cron job "strategy-runner-1h" scheduled (every 15 minutes)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling strategy-runner-1h: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 3: strategy-runner-worker (4h timeframe)
-- ============================================
-- Runs every hour to generate indicator-based signals for 4h timeframe

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-4h') THEN
    PERFORM cron.unschedule('strategy-runner-4h');
  END IF;

  PERFORM cron.schedule(
    'strategy-runner-4h',
    '0 * * * *', -- Every hour at minute 0
    $cron3$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '4h')
    );
    $cron3$
  );

  RAISE NOTICE '✅ Cron job "strategy-runner-4h" scheduled (every hour)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling strategy-runner-4h: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 4: strategy-runner-worker (1d timeframe)
-- ============================================
-- Runs daily at midnight UTC to generate indicator-based signals for 1d timeframe

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-1d') THEN
    PERFORM cron.unschedule('strategy-runner-1d');
  END IF;

  PERFORM cron.schedule(
    'strategy-runner-1d',
    '0 0 * * *', -- Daily at midnight UTC
    $cron4$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1d')
    );
    $cron4$
  );

  RAISE NOTICE '✅ Cron job "strategy-runner-1d" scheduled (daily at midnight)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling strategy-runner-1d: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 5: ai-signal-runner
-- ============================================
-- Runs every 10 minutes to generate AI-powered Ultra Signals
-- Saves to: ai_signals_history table

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai-signal-runner') THEN
    PERFORM cron.unschedule('ai-signal-runner');
  END IF;

  PERFORM cron.schedule(
    'ai-signal-runner',
    '*/10 * * * *', -- Every 10 minutes
    $cron5$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ai-signal-runner',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframes', ARRAY['15m', '1h', '4h'])
    );
    $cron5$
  );

  RAISE NOTICE '✅ Cron job "ai-signal-runner" scheduled (every 10 minutes)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling ai-signal-runner: %', SQLERRM;
END $$;

-- ============================================
-- Verification: Show all signal-related cron jobs
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '🎉 Signal engine cron jobs setup completed!';
  RAISE NOTICE 'Verifying cron jobs...';
END $$;

-- Display all signal-related cron jobs
SELECT 
  jobname AS "Job Name",
  schedule AS "Schedule",
  CASE 
    WHEN active THEN '✅ Active'
    ELSE '❌ Inactive'
  END AS "Status"
FROM cron.job
WHERE jobname LIKE 'strategy-runner%' OR jobname = 'ai-signal-runner'
ORDER BY jobname;

