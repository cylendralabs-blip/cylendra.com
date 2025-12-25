# Phase 4 Setup Guide

## Quick Start Guide for Strategy Runner Worker

### Prerequisites

1. ✅ Phase 4 code deployed
2. ✅ Database migrations applied
3. ✅ Supabase Edge Functions deployed
4. ✅ Users have active bots and watchlists

---

## Step 1: Verify Database Setup

### Check Required Tables:
```sql
-- Check tradingview_signals table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'tradingview_signals';

-- Check price_watchlist table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'price_watchlist';

-- Check bot_settings table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'bot_settings';
```

### Verify Execution Status Column:
```sql
-- Check execution_status column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tradingview_signals' 
AND column_name = 'execution_status';
```

---

## Step 2: Deploy Edge Functions

### Deploy get-candles:
```bash
# In project root
supabase functions deploy get-candles
```

### Deploy strategy-runner-worker:
```bash
supabase functions deploy strategy-runner-worker
```

### Verify Deployments:
```bash
supabase functions list
```

---

## Step 3: Test Functions Manually

### Test get-candles:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get-candles \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "binance",
    "symbol": "BTC/USDT",
    "timeframe": "15m",
    "limit": 100
  }'
```

**Expected:** Returns candles array with OHLCV data

### Test strategy-runner-worker:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "15m"}'
```

**Expected:** Returns JSON with signals_generated count

---

## Step 4: Setup User Test Data

### 1. Create Test User (or use existing)

### 2. Add Bot Settings:
```sql
INSERT INTO bot_settings (
  user_id,
  is_active,
  bot_name,
  default_platform,
  market_type,
  strategy_type,
  total_capital,
  risk_percentage,
  initial_order_percentage,
  max_active_trades,
  dca_levels,
  take_profit_percentage,
  stop_loss_percentage,
  -- ... other required fields
) VALUES (
  'USER_ID_HERE',
  true,  -- is_active
  'Test Bot',
  'binance',
  'spot',
  'basic_dca',
  1000,
  2.0,
  25.0,
  5,
  5,
  3.0,
  5.0
  -- ... other values
);
```

### 3. Add Watchlist Symbols:
```sql
INSERT INTO price_watchlist (user_id, symbol, display_order) VALUES
  ('USER_ID_HERE', 'BTC/USDT', 1),
  ('USER_ID_HERE', 'ETH/USDT', 2),
  ('USER_ID_HERE', 'BNB/USDT', 3);
```

---

## Step 5: Schedule Strategy Runner

### Option A: Supabase Cron (Recommended)

```sql
-- Schedule for 15m timeframe (runs every 5 minutes)
SELECT cron.schedule(
  'strategy-runner-15m',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{"timeframe": "15m"}'::jsonb
  );
  $$
);

-- Schedule for 1h timeframe (runs every 15 minutes)
SELECT cron.schedule(
  'strategy-runner-1h',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{"timeframe": "1h"}'::jsonb
  );
  $$
);
```

### Option B: External Cron Service

Use service like cron-job.org:
- URL: `https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker`
- Method: POST
- Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
- Body: `{"timeframe": "15m"}`
- Schedule: Every 5 minutes

---

## Step 6: Monitor Signals

### Check Generated Signals:
```sql
-- View recent internal engine signals
SELECT 
  id,
  user_id,
  symbol,
  signal_type,
  entry_price,
  confidence_score,
  execution_status,
  created_at
FROM tradingview_signals
WHERE source = 'internal_engine'
ORDER BY created_at DESC
LIMIT 20;
```

### Monitor Signal Execution:
```sql
-- View signal execution status
SELECT 
  execution_status,
  COUNT(*) as count
FROM tradingview_signals
WHERE source = 'internal_engine'
GROUP BY execution_status;
```

---

## Step 7: Verify Auto-Trader Integration

### Check Auto-Trader Processing:
```sql
-- View signals being processed
SELECT 
  id,
  symbol,
  signal_type,
  execution_status,
  execution_started_at,
  execution_completed_at
FROM tradingview_signals
WHERE source = 'internal_engine'
AND execution_status IN ('PENDING', 'EXECUTING')
ORDER BY created_at DESC;
```

### Monitor Trades Created:
```sql
-- View trades from internal engine signals
SELECT 
  t.id,
  t.symbol,
  t.side,
  t.entry_price,
  t.status,
  ts.signal_type,
  ts.confidence_score
FROM trades t
JOIN tradingview_signals ts ON ts.executed_trade_id = t.id
WHERE ts.source = 'internal_engine'
ORDER BY t.created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### No Signals Generated

1. **Check Bot Settings:**
   ```sql
   SELECT * FROM bot_settings WHERE is_active = true;
   ```

2. **Check Watchlist:**
   ```sql
   SELECT * FROM price_watchlist WHERE user_id = 'USER_ID';
   ```

3. **Check Logs:**
   - Go to Supabase Dashboard → Edge Functions → strategy-runner-worker
   - View logs for errors

4. **Check Confidence Threshold:**
   - Current minimum: 60
   - Adjust in `config.ts` if needed

### Signals Not Executing

1. **Check Auto-Trader Worker:**
   ```sql
   -- Check if auto-trader-worker is scheduled
   SELECT * FROM cron.job WHERE jobname LIKE '%auto-trader%';
   ```

2. **Check Signal Status:**
   ```sql
   SELECT execution_status, COUNT(*) 
   FROM tradingview_signals 
   WHERE source = 'internal_engine'
   GROUP BY execution_status;
   ```

3. **Check Filters:**
   - Signals might be filtered by auto-trader-worker
   - Check `execution_reason` column for filter reasons

### Performance Issues

1. **Reduce Watchlist Size:**
   - Limit number of symbols per user
   - Process fewer timeframes

2. **Increase Delays:**
   - Adjust delay between symbols in code
   - Reduce frequency of cron jobs

3. **Optimize Queries:**
   - Add indexes if needed
   - Cache frequently accessed data

---

## Configuration Tuning

### Adjust Signal Sensitivity:

Edit `supabase/functions/strategy-runner-worker/config.ts`:
- `MIN_CONFIDENCE`: Lower = more signals, Higher = fewer but higher quality
- `MAX_CANDLES`: More = slower but more accurate
- `MIN_CANDLES`: Minimum required for calculation

### Adjust Strategy Logic:

Edit `supabase/functions/strategy-runner-worker/index.ts`:
- Signal point thresholds
- Indicator combinations
- Confidence calculation

---

## Success Indicators

✅ **Signals Generated:** Check `tradingview_signals` table regularly  
✅ **Signals Executed:** Check `trades` table for executed trades  
✅ **No Errors:** Check Edge Function logs for errors  
✅ **Performance:** Execution time < 30 seconds per run  

---

**Setup Complete!** 🎉

The strategy runner should now be generating signals automatically and the auto-trader should be executing them.

