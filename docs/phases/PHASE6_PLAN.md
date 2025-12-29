# Phase 6 - Position Manager Plan

## 🎯 Objectives

By the end of Phase 6, the system should support:

1. ✅ **Central Position Manager** - Runtime management of all open positions
2. ✅ **Real-Time PnL** - Live profit/loss calculation as market moves
3. ✅ **Dynamic DCA System** - Execute DCA levels when price is reached
4. ✅ **Advanced TP/SL System** - Partial TP, Multi-TP, Trailing TP, Break-even, Trailing SL
5. ✅ **Auto-Close Rules** - Close positions when conditions are met
6. ✅ **Binance/OKX Sync** - Real-time order status updates from exchanges
7. ✅ **Database Updates + Logs** - Record all activity
8. ✅ **Real-Time UI Updates** - Display position status live

---

## 📋 Tasks Breakdown

### ✅ Task 1: Position Model Enhancement
- Update `src/core/models/Position.ts` with complete position structure
- Add `OrderRef` interface for order tracking
- Support for entryOrders, dcaOrders, tpOrders, slOrders

### ✅ Task 2: PnL Engine
- Create `src/core/engines/pnlEngine.ts`
- Calculate unrealized/realized PnL
- Support Spot and Futures (with leverage)

### ✅ Task 3: Position Monitor Worker
- Create `supabase/functions/position-monitor-worker/index.ts`
- Scheduled worker (every 20-60 seconds)
- Fetch all open positions
- Update unrealized PnL
- Run runtime managers

### ✅ Task 4: DCA Runtime Manager
- Create `src/services/positions/dcaRuntimeManager.ts`
- Monitor DCA levels
- Execute when price is reached
- Update avgEntryPrice and positionQty

### ✅ Task 5: TP Manager
- Create `src/services/positions/tpManager.ts`
- Support: Fixed TP, Multi-TP, Partial TP, Trailing TP
- Close partial quantity on TP hit

### ✅ Task 6: SL Manager
- Create `src/services/positions/slManager.ts`
- Support: Fixed SL, Trailing SL, Break-even move
- Cancel all orders and close position on SL hit

### ✅ Task 7: Auto-Close Rules
- Create `src/services/positions/autoCloseRules.ts`
- Kill switch → close all
- Drawdown hit → close or disable DCA
- Liquidation risk → close immediately

### ✅ Task 8: Order Sync
- Implement `syncOrders(position)` in worker
- Fetch order status from Binance/OKX
- Normalize order statuses
- Update database

### ✅ Task 9: Database Updates
- Update/create tables: positions, trade_orders, order_events, portfolio_history
- Record all runtime events

### ✅ Task 10: UI Integration
- Update `OpenPositionsPanel.tsx`
- Update `LiveTradingFeed.tsx`
- Display: avg entry, positionQty, unrealized PnL, TP/SL, DCA progress

### ✅ Task 11: Tests
- Unit tests for managers
- Integration test for complete position lifecycle

---

## 📁 File Structure

```
src/
├── core/
│   ├── models/
│   │   ├── Position.ts (updated)
│   │   └── OrderRef.ts (new)
│   └── engines/
│       ├── pnlEngine.ts (new)
│       └── positionEngine.ts (new)
├── services/
│   ├── positions/
│   │   ├── dcaRuntimeManager.ts (new)
│   │   ├── tpManager.ts (new)
│   │   ├── slManager.ts (new)
│   │   └── autoCloseRules.ts (new)
│   └── exchange/
│       ├── binance/
│       │   └── orderSync.ts (new)
│       └── okx/
│           └── orderSync.ts (new)
└── components/
    └── dashboard/
        ├── OpenPositionsPanel.tsx (update)
        └── LiveTradingFeed.tsx (update)

supabase/
├── functions/
│   └── position-monitor-worker/
│       ├── index.ts (new)
│       ├── config.ts (new)
│       └── README.md (new)
└── migrations/
    └── 20250118000000_positions_enhancement.sql (new)
```

---

## 🎯 Success Criteria

- [x] Position Manager handles all open positions
- [x] Real-time PnL calculation working
- [x] DCA levels execute automatically
- [x] TP/SL system advanced features working
- [x] Auto-close rules functional
- [x] Order sync working with Binance/OKX
- [x] All events logged to database
- [x] UI displays real-time position data

---

**Date Created:** 2025-01-17

