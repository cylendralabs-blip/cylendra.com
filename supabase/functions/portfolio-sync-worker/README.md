# Portfolio Sync Worker

## Overview

Scheduled Edge Function that syncs portfolio data from exchanges (Binance/OKX) for all users.

## Features

- ✅ Syncs spot and futures balances from exchanges
- ✅ Calculates total equity (spot + futures + unrealized PnL)
- ✅ Calculates exposure and asset allocation
- ✅ Creates portfolio snapshots periodically
- ✅ Updates portfolio state in database
- ✅ Handles errors gracefully with logging

## Configuration

See `config.ts` for configuration options:
- `SYNC_INTERVAL_SECONDS`: How often to run the worker (default: 300 = 5 minutes)
- `MAX_USERS_PER_RUN`: Maximum users to process per run (default: 50)
- `ENABLE_SNAPSHOTS`: Enable snapshot creation (default: true)
- `SNAPSHOT_INTERVAL_MINUTES`: Create snapshot every X minutes (default: 5)

## Database Tables

The worker uses and creates data in:
- `api_keys` - To fetch active API keys per user
- `trades` - To calculate realized/unrealized PnL
- `users_portfolio_state` - Current portfolio state (upsert)
- `portfolio_snapshots` - Historical snapshots (insert)

## Deployment

```bash
supabase functions deploy portfolio-sync-worker
```

## Cron Job Setup

Add to Supabase Cron Jobs:
```sql
SELECT cron.schedule(
  'portfolio-sync-worker',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/portfolio-sync-worker',
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
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/portfolio-sync-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

**Phase 7: Portfolio & Wallet Integration - Task 2**

