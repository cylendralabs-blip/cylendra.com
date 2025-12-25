# Phase 2 - Remaining Tasks

## 📋 Tasks Still Needed

### 1. Task 5: Order Storage & Lifecycle (High Priority)

**What's Needed:**
- Database schema for `trade_orders` table
- Database schema for `order_events` table
- Lifecycle tracking implementation
- Partial fills handling

**Files to Create:**
- Database migration files
- `supabase/functions/execute-trade/order-lifecycle.ts`

---

### 2. Task 7: Testnet/Live Switch (Medium Priority)

**What's Needed:**
- UI component for testnet toggle
- Confirmation dialog
- Visual indicator in UI
- API integration

**Files to Modify:**
- Settings/BotSettings component
- API key management UI

---

### 3. Task 8: Integration Tests (Medium Priority)

**What's Needed:**
- Test suite setup
- Test cases for each platform
- Testnet credentials management
- Automated test execution

**Files to Create:**
- `tests/integration/execute-trade.test.ts`
- `tests/integration/binance.test.ts`
- `tests/integration/okx.test.ts`

---

### 4. Task 1.2: OKX Client-Side SDK (Low Priority - Optional)

**What's Needed:**
- Client-side OKX SDK structure (similar to Binance)
- Type definitions
- Utility functions

**Note:** This is optional since all requests go through Edge Functions. Only needed if direct browser access is required.

---

## 🎯 Recommended Order

1. **Task 5** - Order Storage & Lifecycle (enables full order tracking)
2. **Task 7** - Testnet/Live Switch (UX improvement)
3. **Task 8** - Integration Tests (quality assurance)
4. **Task 1.2** - OKX Client-Side SDK (optional enhancement)


