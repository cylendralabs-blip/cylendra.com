# Backtest Worker

## Overview

Edge Function for running backtests asynchronously. Handles long-running backtest executions.

## Features

- ✅ Processes backtest requests
- ✅ Updates progress in real-time
- ✅ Saves results to database
- ✅ Handles errors gracefully

## Note

⚠️ **Implementation Limitation**: TypeScript imports don't work directly in Deno Edge Functions. The backtest runner needs to be either:
1. Inlined in the Edge Function
2. Created as a separate service endpoint
3. Compiled to JavaScript and bundled

For now, this is a placeholder implementation.

## Usage

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backtest-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backtestId": "backtest-uuid"}'
```

## Database

The worker uses:
- `backtests` - Backtest configuration and status
- `backtest_trades` - Individual trades
- `backtest_equity_curve` - Equity curve points
- `backtest_metrics` - Performance metrics

---

**Phase 9: Backtesting Engine - Task 8**

