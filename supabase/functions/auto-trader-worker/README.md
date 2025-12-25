# Auto-Trader Worker

## Overview

Scheduled Edge Function that processes pending signals and executes trades automatically.

## Functionality

1. **Fetches Pending Signals** - Gets signals with `execution_status = 'PENDING'`
2. **Applies Filters** - Runs all filters (bot enabled, market type, symbol, cooldown, max trades, etc.)
3. **Checks Duplicates** - Prevents duplicate trades for same symbol/side/market type
4. **Executes Trades** - Calls `execute-trade` function to place orders
5. **Updates Status** - Updates signal execution status (FILTERED, EXECUTING, EXECUTED, FAILED)

## Configuration

Edit `config.ts` to configure:
- `RUN_INTERVAL_MINUTES`: How often to run (default: 1 minute)
- `MAX_SIGNALS_PER_RUN`: Max signals to process per run (default: 10)
- `SYMBOL_COOLDOWN_MINUTES`: Cooldown period for same symbol (default: 15 minutes)
- `DEFAULT_MIN_CONFIDENCE`: Minimum confidence score (default: 70)
- `MAX_EXECUTION_ATTEMPTS`: Max retries per signal (default: 3)
- `RETRY_DELAY_MINUTES`: Delay after failed execution (default: 5 minutes)

## Scheduling

To schedule this function, use Supabase Cron:

```sql
-- Run every 1 minute
SELECT cron.schedule(
  'auto-trader-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

Or use Supabase Dashboard:
1. Go to Database → Cron Jobs
2. Create new cron job
3. Set schedule: `* * * * *` (every minute)
4. Set SQL to call the function

## Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

Optional:
- `SUPABASE_ANON_KEY`: Anon key for calling execute-trade (fallback to service role key)

## Signal Processing Flow

```
1. Fetch Pending Signals
   ↓
2. For each signal:
   ├─ Get user bot settings
   ├─ Get active trades count
   ├─ Get last trade time (cooldown check)
   ├─ Apply filters
   │  ├─ Bot enabled? ❌ → FILTERED
   │  ├─ Max trades? ❌ → FILTERED
   │  ├─ Trade direction allowed? ❌ → FILTERED
   │  ├─ Exchange healthy? ❌ → FILTERED
   │  ├─ Confidence score OK? ❌ → FILTERED
   │  └─ Cooldown OK? ❌ → FILTERED
   ├─ Check duplicates ❌ → IGNORED
   ├─ Risk checks (Phase 5)
   │  ├─ Kill switch active? ❌ → FILTERED
   │  ├─ Daily loss limit exceeded? ❌ → FILTERED
   │  ├─ Max drawdown exceeded? ❌ → FILTERED
   │  ├─ Exposure limit exceeded? ❌ → FILTERED
   │  └─ Adjust capital if needed ⚠️
   ├─ Get API keys ❌ → FILTERED
   ├─ Update status: EXECUTING
   ├─ Execute trade via execute-trade function
   │  ├─ Success ✅ → Update status: EXECUTED (with trade_id)
   │  └─ Failure ❌ → Update status: FAILED (with error)
   └─ Continue to next signal
```

## Filter Details

### Basic Filters
1. **Bot Enabled Check**: Verifies `bot_settings.is_active = true`
2. **Market Type Match**: Checks if signal matches bot's market type setting
3. **Symbol Allowed**: Checks if symbol is in allowed list or blacklist (future feature)
4. **Cooldown Filter**: Prevents executing same symbol within cooldown period
5. **Max Concurrent Trades**: Checks if user reached max active trades limit
6. **Trade Direction Allowed**: Verifies if long/short trades are allowed
7. **Exchange Health**: Checks exchange connection status (future feature)
8. **Confidence Score**: Verifies signal confidence meets minimum threshold

### Risk Management Filters (Phase 5)
9. **Kill Switch Check**: Verifies if kill switch is active for user
10. **Daily Loss Limit**: Checks if daily PnL exceeds `max_daily_loss_usd` or `max_daily_loss_pct`
11. **Max Drawdown Limit**: Checks if current drawdown exceeds `max_drawdown_pct`
12. **Exposure Limits**: 
    - Total exposure: Checks if total exposure exceeds `max_exposure_pct_total`
    - Per-symbol exposure: Checks if symbol exposure exceeds `max_exposure_pct_per_symbol`
13. **Capital Adjustment**: Reduces position size if near risk limits (drawdown > 60% of max, exposure > 60% of max)

## Status Transitions

```
PENDING
  ├─→ FILTERED (failed filters)
  ├─→ IGNORED (duplicate trade)
  └─→ EXECUTING
       ├─→ EXECUTED (success)
       └─→ FAILED (error)
```

## Error Handling

- All errors are logged
- Failed signals are marked as `FAILED` with error message
- Worker continues processing remaining signals even if one fails
- Maximum execution attempts prevent infinite retries

## Testing

Manual test:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Check logs:
```bash
supabase functions logs auto-trader-worker
```

## Monitoring

Monitor execution:
- Check Supabase Edge Function logs
- Query `tradingview_signals` table for execution status
- Track execution metrics (processed, executed, filtered, failed)

## Future Enhancements

- Exchange health checks
- Symbol watchlist/blacklist support
- Advanced retry logic with exponential backoff
- Performance metrics and monitoring
- Alert notifications for failures

