# Phase 7 - Portfolio & Wallet Integration Plan

## 🎯 Objectives

By the end of Phase 7, the system should support:

1. ✅ **Portfolio Sync from Binance/OKX** - Sync balances, positions, orders
2. ✅ **Portfolio Snapshot Engine** - Capture portfolio state periodically
3. ✅ **Total Equity Calculation** - Spot + Futures + Open Positions PnL
4. ✅ **Professional Metrics for UI** - Daily/Weekly/Monthly PnL, Exposure, Performance
5. ✅ **Complete Portfolio Dashboard UI** - Charts, Tables, Metrics

## 📋 Tasks Breakdown

### ✅ Task 1: Exchange Portfolio APIs
- Create `src/services/exchange/binance/portfolio.ts`
- Create `src/services/exchange/okx/portfolio.ts`
- Fetch Spot balances, Futures balances, Open positions, Open orders
- Normalize data format

### ✅ Task 2: Portfolio Sync Worker
- Create `supabase/functions/portfolio-sync-worker/index.ts`
- Scheduled worker (every 60-300 seconds)
- Fetch portfolio for each user
- Calculate equity, exposure, allocation
- Store snapshots in DB

### ✅ Task 3: Portfolio Snapshot Model
- Create `src/core/models/PortfolioSnapshot.ts`
- Create related models (Equity, Exposure)

### ✅ Task 4: Equity Engine
- Create `src/services/portfolio/portfolioEngine.ts`
- Calculate equity, PnL, allocation, exposure

### ✅ Task 5: Exposure Engine
- Create/update `src/services/portfolio/exposureEngine.ts`
- Calculate exposure per symbol, total exposure %

### ✅ Task 6: Performance Engine
- Create `src/services/portfolio/performanceEngine.ts`
- Calculate winrate, profit factor, sharpe ratio, daily/weekly/monthly PnL

### ✅ Task 7: Database Tables
- Create `portfolio_snapshots` table
- Create/update `users_portfolio_state` table
- Create `performance_history` table (optional)

### ✅ Task 8: UI Integration
- Create `PortfolioDashboard.tsx`
- Create `MetricsBar.tsx`
- Create `EquityChart.tsx`
- Create `AssetAllocationChart.tsx`
- Create `PerformanceStats.tsx`

### ✅ Task 9: Logging & Alerts
- Implement error handling
- Add alerts for sync failures

### ✅ Task 10: Tests
- Unit tests for engines
- Integration tests for portfolio sync

---

## 📁 File Structure

```
src/
├── services/
│   ├── exchange/
│   │   ├── binance/
│   │   │   └── portfolio.ts (new)
│   │   └── okx/
│   │       └── portfolio.ts (new)
│   └── portfolio/
│       ├── portfolioEngine.ts (new)
│       ├── exposureEngine.ts (new/update)
│       └── performanceEngine.ts (new)
├── core/
│   └── models/
│       ├── PortfolioSnapshot.ts (new)
│       ├── Equity.ts (new)
│       └── Exposure.ts (new)
└── components/
    └── dashboard/
        ├── PortfolioDashboard.tsx (new)
        ├── MetricsBar.tsx (new)
        ├── EquityChart.tsx (new)
        ├── AssetAllocationChart.tsx (new)
        └── PerformanceStats.tsx (new)

supabase/
├── functions/
│   └── portfolio-sync-worker/
│       ├── index.ts (new)
│       ├── config.ts (new)
│       └── README.md (new)
└── migrations/
    └── 20250119000000_portfolio_snapshots.sql (new)
```

---

**Date Created:** 2025-01-17

