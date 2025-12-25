# Position Monitor Worker

## Overview

The Position Monitor Worker is a scheduled Edge Function that monitors open trading positions in real-time. It updates PnL, monitors TP/SL/DCA levels, syncs orders from exchanges, and applies auto-close rules.

## Phase 6: Position Manager

This worker is part of Phase 6: Position Manager, which provides complete runtime position management.

## Features

- ✅ **Real-Time PnL Updates** - Calculates and updates unrealized PnL as market moves
- ✅ **TP/SL Monitoring** - Monitors take profit and stop loss levels
- ✅ **Partial TP** - Supports multiple partial take profit levels
- ✅ **DCA Monitoring** - Monitors Dollar Cost Averaging levels
- ✅ **Trailing Stop** - Supports trailing stop loss with activation price
- ✅ **Break-Even** - Supports break-even stop loss movement
- ✅ **Auto-Close Rules** - Applies automatic position closing rules:
  - Kill switch activation
  - Max drawdown limit
  - Daily loss limit (USD and %)
  - Liquidation risk (for futures)
- ✅ **Event Logging** - Logs all position events to database
- ⏳ **Order Sync** - Order sync from Binance/OKX (planned for future)

## Configuration

See `config.ts` for configuration options:

- `RUN_INTERVAL_SECONDS`: How often to run the worker (default: 30 seconds)
- `MAX_POSITIONS_PER_RUN`: Maximum positions to process per run (default: 50)
- `PRICE_UPDATE_INTERVAL`: Price update interval (default: 10 seconds)
- `ORDER_SYNC_INTERVAL`: Order sync interval (default: 20 seconds)
- `PNL_UPDATE_INTERVAL`: PnL update interval (default: 15 seconds)

## How It Works

1. **Fetch Open Positions** - Retrieves all positions with status = 'ACTIVE'
2. **Get Current Prices** - Fetches current market prices from exchanges via `get-live-prices` function
3. **Calculate PnL** - Calculates unrealized PnL for each position
4. **Process Managers** - Runs all position managers:
   - **Auto-Close Rules** - Checks kill switch, drawdown, daily loss, liquidation risk
   - **Stop Loss** - Checks if SL should be triggered
   - **Take Profit** - Checks if TP should be triggered
   - **Partial TP** - Checks partial TP levels
   - **Trailing Stop** - Updates trailing stop loss if enabled
   - **Break-Even** - Moves SL to entry price if trigger reached
5. **Update Position** - Updates position in database with new PnL, status, and risk state
6. **Log Events** - Logs all events to `order_events` table

## File Structure

```
position-monitor-worker/
├── index.ts                 # Main entry point
├── config.ts                # Configuration
├── positionProcessor.ts     # Position processing logic
├── managers.ts              # TP/SL/DCA/Auto-Close managers
└── README.md               # This file
```

## Scheduled Execution

This worker should be scheduled to run every 30 seconds (or as configured) using Supabase Cron Jobs.

Example cron job setup:

```sql
SELECT cron.schedule(
  'position-monitor-worker',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/position-monitor-worker',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

## API Endpoints

### POST /position-monitor-worker

Runs the position monitor worker.

**Response:**
```json
{
  "success": true,
  "message": "Position monitor completed successfully",
  "positionsProcessed": 10,
  "positionsUpdated": 10,
  "errors": 0,
  "executionTimeMs": 1234
}
```

## Error Handling

The worker handles errors gracefully:
- Failed price fetches are logged but don't stop processing
- Individual position errors don't stop the worker
- All errors are logged to `order_events` table

## Logging

All events are logged to the `order_events` table with:
- Event type: `POSITION_UPDATED`, `POSITION_ERROR`, etc.
- Event data: JSON with details about the event
- Source: `POSITION_MONITOR`
- Timestamp: Event creation time

## Future Enhancements

- [ ] Order sync from Binance/OKX
- [ ] Advanced DCA execution
- [ ] Partial TP execution
- [ ] Trailing TP
- [ ] Risk-based position sizing
- [ ] Performance metrics

## Phase 6 Status

✅ Task 3: Position Monitor Worker - **Complete**

---

**Date Created:** 2025-01-17  
**Phase:** 6 - Position Manager

