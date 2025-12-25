-- ============================================
-- Cron Jobs Setup - Simplified Version
-- ============================================
-- Cron Job 1: auto-trader-worker
-- ============================================
-- Schedule: Every 1 minute
-- Purpose: Process pending signals and execute trades automatically

SELECT cron.schedule(
  'auto-trader-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/auto-trader-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- Cron Job 2: strategy-runner-worker (15m)
-- ============================================
-- Schedule: Every 5 minutes
-- Purpose: Generate signals for 15m timeframe

SELECT cron.schedule(
  'strategy-runner-15m',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('timeframe', '15m')
  );
  $$
);

-- ============================================
-- Cron Job 3: strategy-runner-worker (1h)
-- ============================================
-- Schedule: Every 15 minutes
-- Purpose: Generate signals for 1h timeframe

SELECT cron.schedule(
  'strategy-runner-1h',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('timeframe', '1h')
  );
  $$
);

