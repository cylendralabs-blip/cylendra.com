# Phase 9 - Backtesting Engine (Real) + Performance Analytics Plan

## 🎯 Objectives

By the end of Phase 9, the system should have:

1. ✅ **Real Backtesting Runner** (no mocks)
   - Runs strategies on historical OHLCV data
   - Deterministic behavior

2. ✅ **Historical Market Data Feeds**
   - Binance historical candles
   - OKX historical candles
   - Normalized format

3. ✅ **Simulation Engine**
   - Entry simulation
   - DCA levels
   - TP/SL execution
   - Fees calculation
   - Slippage simulation

4. ✅ **Performance Metrics**
   - Win rate, profit factor, Sharpe ratio
   - Max drawdown
   - Equity curve
   - Trade statistics

5. ✅ **Storage & UI**
   - Database tables for backtest results
   - Backtest worker (Edge Function)
   - UI components for backtesting

## 📋 Tasks Breakdown

### ✅ Task 1: Historical Market Data Layer
- Binance historical feed
- OKX historical feed
- History router

### ✅ Task 2: Backtest Config Model
- BacktestConfig interface
- Validation

### ✅ Task 3: Simulation Engine
- Entry simulation
- DCA simulation
- TP/SL simulation
- Position management

### ✅ Task 4: Backtest Runner
- Load historical data
- Calculate indicators
- Run strategy
- Execute simulation

### ✅ Task 5: Fee + Slippage Models
- Fee model (maker/taker)
- Slippage model (deterministic)

### ✅ Task 6: Backtest Result Models
- BacktestTrade
- EquityPoint
- BacktestResult

### ✅ Task 7: Performance Metrics Engine
- Win rate, profit factor
- Max drawdown
- Sharpe ratio
- Other metrics

### ✅ Task 8: Backtest Worker
- Edge Function for long-running backtests
- Async processing

### ✅ Task 9: Database Tables
- backtests table
- backtest_trades table
- backtest_equity_curve table
- backtest_metrics table

### ✅ Task 10: UI Components
- BacktestForm
- BacktestPage
- EquityCurveChart
- BacktestTradesTable
- PerformanceReport

### ✅ Task 11: Tests
- Unit tests
- Integration tests

---

## 📁 File Structure

```
src/
├── services/
│   ├── marketData/
│   │   └── history/
│   │       ├── binanceHistoryFeed.ts (new)
│   │       ├── okxHistoryFeed.ts (new)
│   │       └── historyRouter.ts (new)
│   └── performance/
│       └── performanceEngine.ts (update/create)
├── backtest/
│   ├── backtestRunner.ts (new)
│   ├── simulationEngine.ts (new)
│   ├── feeModel.ts (new)
│   └── slippageModel.ts (new)
├── core/
│   └── models/
│       ├── BacktestConfig.ts (new)
│       ├── BacktestResult.ts (new)
│       ├── BacktestTrade.ts (new)
│       └── EquityPoint.ts (new)
└── components/
    └── backtest/
        ├── BacktestPage.tsx (new)
        ├── BacktestForm.tsx (new)
        ├── EquityCurveChart.tsx (new)
        ├── BacktestTradesTable.tsx (new)
        └── PerformanceReport.tsx (new)

supabase/
├── functions/
│   └── backtest-worker/
│       ├── index.ts (new)
│       ├── config.ts (new)
│       └── README.md (new)
└── migrations/
    └── 20250121000000_backtest_tables.sql (new)
```

---

**Date Created:** 2025-01-17

