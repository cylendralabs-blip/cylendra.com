# Backtest Runner Edge Function

## Overview

This Edge Function handles backtest requests and runs the backtest simulation.

## Phase 1 Implementation

### Current Status

✅ **Completed:**
- Request validation
- System constraints enforcement
- Database integration
- Error handling
- Timeout protection

⚠️ **Note:**
The actual backtest engine execution is currently a placeholder. The full engine implementation in `src/backtest/backtestEngine.ts` needs to be integrated.

### System Constraints

- **Allowed Pairs**: BTCUSDT, ETHUSDT, SOLUSDT
- **Allowed Timeframes**: 15m, 1h, 4h, 1D
- **Max Historical Period**: 1 year
- **Max Candles**: 10,000 per backtest
- **One Active Backtest**: Only one running backtest per user
- **Timeout**: 60 seconds

### API Endpoint

**POST** `/backtest-runner`

**Request Body:**
```json
{
  "pair": "BTCUSDT",
  "timeframe": "1h",
  "period": "1Y", // or { "from": "2024-01-01", "to": "2024-12-31" }
  "strategyPreset": "conservative", // or
  "botProfile": {
    "botSettings": { ... },
    "strategyId": "main-strategy",
    "exchange": "binance",
    "marketType": "spot"
  },
  "initialCapital": 10000,
  "simulationSettings": {
    "fees": { "makerPct": 0.1, "takerPct": 0.1 },
    "slippage": { "enabled": false, "maxPct": 0.1 }
  }
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "status": "completed",
  "summary": {
    "totalPnL": 0,
    "totalReturnPct": 0,
    "maxDrawdown": 0,
    "winrate": 0,
    "numTrades": 0,
    "stats": { ... }
  }
}
```

### Next Steps

1. **Integrate Full Backtest Engine**: Replace placeholder in `backtestEngine.ts` with actual engine from `src/backtest/backtestEngine.ts`
2. **Add Progress Updates**: Implement progress callbacks for long-running backtests
3. **Add Caching**: Cache historical data to improve performance
4. **Add Rate Limiting**: Implement rate limits per user

## Error Handling

All errors are caught and logged:
- Validation errors return 400
- Active backtest check returns 429
- Execution errors return 500
- Timeout errors are caught and saved to DB

## Database

Results are saved to:
- `backtest_runs` - Run metadata and summary
- `backtest_trades` - Individual trades (optional)

