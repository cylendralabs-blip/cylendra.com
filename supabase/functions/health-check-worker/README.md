# Health Check Worker

## Overview

Scheduled Edge Function that monitors system health:
- Worker heartbeats (auto-trader, strategy-runner, position-monitor, portfolio-sync)
- Exchange API connectivity (Binance, OKX)
- Database health

## Features

- ✅ Monitors all workers for last heartbeat
- ✅ Pings exchange APIs for connectivity
- ✅ Checks database response time
- ✅ Updates `system_health` table
- ✅ Logs health status

## Configuration

See `config.ts` for configuration options:
- `CHECK_INTERVAL_SECONDS`: How often to run (default: 180 = 3 minutes)
- `HEARTBEAT_TIMEOUT_SECONDS`: Timeout before marking worker as down (default: 600 = 10 minutes)
- `WORKERS`: List of workers to monitor
- `EXCHANGES`: List of exchanges to ping

## Database

The worker uses and updates:
- `logs` - To check worker last run
- `system_health` - To store health status (upsert)

## Deployment

```bash
supabase functions deploy health-check-worker
```

## Cron Job Setup

Add to Supabase Cron Jobs:
```sql
SELECT cron.schedule(
  'health-check-worker',
  '*/3 * * * *', -- Every 3 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/health-check-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

## Testing

Test manually:
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/health-check-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

**Phase 8: Logging + Monitoring + Alerting System - Task 7**

