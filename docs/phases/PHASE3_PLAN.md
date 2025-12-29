# Phase 3 - Auto-Trading Trigger Plan

## 🎯 Goals

Build automatic trading engine that processes signals and executes trades without manual intervention.

## 📊 Current State Analysis

### ✅ Existing Components:
1. **tradingview_signals** table exists with status field
2. **bot_settings** table with `is_active` field
3. **trades** table with status tracking
4. **execute-trade** Edge Function (Phase 2 complete)
5. **ExecutionPayload** model (Phase 2 complete)
6. **tradingview-webhook** function (receives signals)

### 🔧 Integration Points:
- Use existing `tradingview_signals` table
- Extend signal status workflow: `ACTIVE` → `PENDING_EXECUTION` → `EXECUTING` → `EXECUTED` → `FAILED`
- Use `bot_settings.is_active` for bot enablement check
- Use `trades` table to check active trades count
- Call `execute-trade` function from worker

---

## 📋 Tasks (9 tasks)

### Task 1: Signal Store Enhancement ✅
**Status:** Database migration needed

Add execution status fields to `tradingview_signals`:
- `execution_status`: `PENDING` | `FILTERED` | `EXECUTING` | `EXECUTED` | `FAILED` | `IGNORED`
- `execution_reason`: reason for filter/ignore
- `executed_trade_id`: reference to trades table
- `execution_attempts`: counter for retries
- `execution_scheduled_at`: when to process

### Task 2: Auto-Trader Worker 🔄
**Status:** Create scheduled Edge Function

Create `supabase/functions/auto-trader-worker/index.ts`:
- Scheduled to run every 1-3 minutes
- Fetches `PENDING` signals
- Applies filters
- Executes trades
- Updates signal status

### Task 3: Signal Filters 🔍
**Status:** Create filter service

Create `src/services/automatedTrading/signalFilters.ts`:
- Bot enabled check
- Market type match
- Symbol allowed (watchlist/blacklist)
- Cooldown filter
- Max concurrent trades
- Exchange health check

### Task 4: Execution Payload Builder 📦
**Status:** Create payload builder

Create `src/services/automatedTrading/buildPayload.ts`:
- Converts signal + botSettings → ExecutionPayload
- Calculates capital allocation
- Builds DCA levels
- Sets risk parameters

### Task 5: Auto Execution Integration ⚙️
**Status:** Integrate with execute-trade

Connect worker to execute-trade function:
- Call execute-trade API
- Handle responses
- Update signal status
- Store trade_id reference

### Task 6: Idempotency & Duplicate Prevention 🚫
**Status:** Prevent duplicate trades

- Check existing trades for same symbol+side
- Use signal ID in clientOrderId
- Cooldown period per symbol

### Task 7: State Machine & Logging 📝
**Status:** Implement state transitions

- State machine: `PENDING` → `FILTERED/EXECUTING` → `EXECUTED/FAILED`
- Log all transitions
- Store execution events

### Task 8: UI Status Updates 🎨
**Status:** Add live feed component

- Show pending signals
- Show filtered signals with reasons
- Show executed trades
- Real-time updates

### Task 9: Tests 🧪
**Status:** Create test suite

- Unit tests for filters
- Integration tests for worker
- End-to-end flow tests

---

## 🗂️ File Structure

```
supabase/functions/
  └── auto-trader-worker/
      ├── index.ts              # Main worker (scheduled)
      ├── signalProcessor.ts    # Process signals
      ├── filters.ts            # Signal filters
      └── config.ts             # Configuration

supabase/migrations/
  └── [timestamp]_signal_execution_status.sql

src/services/automatedTrading/
  ├── signalFilters.ts          # Filter logic
  ├── buildPayload.ts           # Payload builder
  ├── executionService.ts       # Execute trade service
  └── types.ts                  # Types

src/components/dashboard/
  └── AutoTradingFeed.tsx       # Live feed UI
```

---

## 🚀 Implementation Order

1. Task 1: Database migration (signal execution status)
2. Task 3: Signal filters (independent)
3. Task 4: Payload builder (independent)
4. Task 2: Auto-trader worker (uses filters + builder)
5. Task 5: Execution integration (uses worker)
6. Task 6: Idempotency (uses worker)
7. Task 7: State machine (uses worker)
8. Task 8: UI updates (uses all)
9. Task 9: Tests (tests all)

---

## ✅ Success Criteria

- [ ] Worker runs on schedule
- [ ] Signals are filtered correctly
- [ ] Trades execute automatically
- [ ] No duplicate trades
- [ ] Status updates in real-time
- [ ] All events logged
- [ ] UI shows live feed

