# Strategy Runner Worker

## Overview

Scheduled Edge Function that runs trading strategies and generates signals automatically.

**Phase 4: Strategy Engine**

## Functionality

1. **Fetches User Watchlists** - Gets symbols from `price_watchlist` table for active bots
2. **Fetches Market Data** - Gets candles from `get-candles` function
3. **Calculates Indicators** - RSI, MACD, Bollinger Bands, Stochastic, EMA, ATR
4. **Generates Signals** - Runs multi-indicator strategy logic
5. **Saves Signals** - Writes signals to `tradingview_signals` table with `source='internal_engine'`
6. **Respects Cooldowns** - Prevents duplicate signals for same symbol/timeframe

## Configuration

Edit `config.ts` to configure:
- `TIMEFRAMES`: Timeframes to process (default: ['5m', '15m', '30m', '1h', '4h', '1d'])
- `MAX_CANDLES`: Maximum candles to fetch (default: 100)
- `MIN_CANDLES`: Minimum candles required (default: 50)
- `MIN_CONFIDENCE`: Minimum confidence score (default: 60)
- `DEFAULT_EXCHANGE`: Exchange to use (default: 'binance')

## Scheduling

### Option 1: Supabase Cron Jobs

Add to Supabase SQL Editor:

```sql
-- Run every 5 minutes for 15m timeframe
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

-- Run every 15 minutes for 1h timeframe
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

### Option 2: External Cron Service

Use external service (e.g., cron-job.org) to call the function periodically.

## Request Format

```json
{
  "timeframe": "15m"  // Optional: specific timeframe to process
}
```

If `timeframe` is not provided, defaults to first supported timeframe.

## Response Format

```json
{
  "success": true,
  "message": "Strategy runner completed successfully",
  "signals_generated": 5,
  "results": {
    "user-id-1": {
      "15m": 2
    },
    "user-id-2": {
      "15m": 3
    }
  },
  "execution_time_ms": 1234
}
```

## Signal Generation Logic

The worker uses a **multi-indicator strategy**:

### Buy Signals
- RSI < 30 (oversold) +2 points
- RSI < 40 +1 point
- MACD bullish + histogram > 0 +2 points
- Price below Bollinger lower band +2 points
- EMA20 > EMA50 (uptrend) +1 point
- Stochastic oversold +1 point

**Minimum 3 points required** for buy signal

### Sell Signals
- RSI > 70 (overbought) +2 points
- RSI > 60 +1 point
- MACD bearish + histogram < 0 +2 points
- Price above Bollinger upper band +2 points
- EMA20 < EMA50 (downtrend) +1 point
- Stochastic overbought +1 point

**Minimum 3 points required** for sell signal

### Confidence Score
- Base: 50%
- +10% per signal point
- Maximum: 100%

### Stop Loss & Take Profit
- Uses ATR-based stop loss if available (2x ATR)
- Otherwise uses bot settings percentages
- Default: 2% SL, 4% TP

## Signal Flow

```
1. Strategy Runner Worker (scheduled)
   ↓
2. Get active bots (bot_settings.is_active = true)
   ↓
3. For each user:
   ├─ Get watchlist symbols
   ├─ For each symbol:
   │  ├─ Fetch candles
   │  ├─ Calculate indicators
   │  ├─ Generate signal (if conditions met)
   │  └─ Save to tradingview_signals (source='internal_engine')
   ↓
4. Auto-Trader Worker picks up signals (execution_status='PENDING')
   ↓
5. Executes trades automatically
```

## Requirements

### User Must Have:
1. **Active Bot** - `bot_settings.is_active = true`
2. **Watchlist** - Symbols in `price_watchlist` table
3. **API Keys** - Configured API keys for trading (optional for signal generation)

### Database Tables Used:
- `bot_settings` - Bot configuration
- `price_watchlist` - User's watchlist symbols
- `tradingview_signals` - Signal storage
- `trades` - Trade history (for duplicate checks)

## Error Handling

- If candles fetch fails → Skip symbol, log error
- If indicators calculation fails → Skip symbol, log error
- If signal generation fails → Skip symbol, log error
- Worker continues processing other symbols/users

## Performance

- Processes multiple users in parallel
- Rate limiting: 500ms delay between symbols
- Maximum signals per run: 50 (configurable)
- Typical execution time: 2-10 seconds per user

## Logging

All operations are logged with:
- Info: Normal operations
- Warn: Skipped symbols/users
- Error: Failures with details

## Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

## Testing

Test the function manually:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "15m"}'
```

## Troubleshooting

### No signals generated
- Check if users have active bots
- Check if users have symbols in watchlist
- Check if minimum confidence threshold is too high
- Check logs for errors

### Too many signals
- Increase minimum confidence threshold
- Increase cooldown period
- Add more filters in strategy logic

### Performance issues
- Reduce number of symbols in watchlist
- Process fewer timeframes per run
- Increase delay between symbols

---

**Created:** Phase 4 - Strategy Engine  
**Status:** ✅ Production Ready

