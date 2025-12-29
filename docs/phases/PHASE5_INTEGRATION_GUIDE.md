# Phase 5 Integration Guide - Risk Management with Auto-Trader

## Overview

Phase 5 has completed the core risk management engine. To integrate it with the auto-trader worker, we need to add risk checks before trade execution.

## Integration Points

### 1. Auto-Trader Worker (`supabase/functions/auto-trader-worker/index.ts`)

**Location:** After basic filters, before `buildPayload()`

**Steps:**
1. Fetch user's trades and positions
2. Calculate current equity
3. Get latest risk snapshot
4. Check kill switch state
5. Call risk evaluation
6. If denied → update signal status to FILTERED
7. If allowed with adjusted capital → use adjusted capital in payload

**Note:** Since auto-trader-worker runs in Deno Edge Function, it cannot directly import from `src/`. We need to:
- Option A: Create inline risk evaluation logic in the worker
- Option B: Create a separate Edge Function for risk evaluation
- Option C: Copy essential risk check functions to the worker

### 2. Recommended Approach: Inline Risk Checks in Worker

Since Edge Functions have limitations, we'll implement simplified risk checks directly in the worker:

1. **Daily Loss Check** - Calculate daily PnL from trades closed today
2. **Drawdown Check** - Compare current equity vs peak equity
3. **Exposure Check** - Sum total_invested from active trades
4. **Kill Switch Check** - Query `kill_switch_states` table
5. **Max Trades Check** - Count active trades (already implemented)

### 3. Implementation Example

```typescript
// In auto-trader-worker/index.ts, after duplicate check

// Fetch active trades for risk calculation
const { data: activeTrades } = await supabaseClient
  .from('trades')
  .select('*')
  .eq('user_id', signal.user_id)
  .in('status', ['ACTIVE', 'PENDING']);

// Calculate current equity (simplified)
const currentEquity = botSettings.total_capital;
const totalExposure = activeTrades?.reduce((sum, t) => sum + (t.total_invested || 0), 0) || 0;

// Check exposure limit
const maxExposureTotal = botSettings.max_exposure_pct_total || 80.0;
const exposurePct = (totalExposure / currentEquity) * 100;
if (exposurePct >= maxExposureTotal) {
  await updateSignalStatus(supabaseClient, signal.id, 'FILTERED', 
    `Total exposure exceeded: ${exposurePct.toFixed(2)}% >= ${maxExposureTotal}%`);
  return { success: false, reason: 'Exposure limit exceeded' };
}

// Check daily loss limit
// (Fetch trades closed today and calculate PnL)
// ... risk checks continue

// Check kill switch
const { data: killSwitch } = await supabaseClient
  .from('kill_switch_states')
  .select('*')
  .eq('user_id', signal.user_id)
  .eq('is_active', true)
  .single();

if (killSwitch && new Date(killSwitch.expires_at) > new Date()) {
  await updateSignalStatus(supabaseClient, signal.id, 'FILTERED', 
    `Kill switch is active: ${killSwitch.reason}`);
  return { success: false, reason: 'Kill switch active' };
}
```

## Files to Modify

1. **`supabase/functions/auto-trader-worker/index.ts`**
   - Add risk checks after duplicate check
   - Before calling `executeTrade()`

2. **`supabase/functions/auto-trader-worker/signalProcessor.ts`**
   - Add functions to fetch risk data (trades, equity, kill switch)

## Risk Checks to Implement

### Priority 1 (Critical)
- [x] Kill Switch Check
- [x] Daily Loss Limit
- [x] Max Drawdown
- [x] Total Exposure Limit

### Priority 2 (Important)
- [x] Per-Symbol Exposure Limit
- [x] Volatility Guard (if indicators available)

## Next Steps

1. Add risk helper functions to `signalProcessor.ts`
2. Integrate risk checks in `processSignal()` function
3. Test with simulated risk scenarios
4. Update signal status with risk reasons

---

**Status:** Ready for implementation  
**Complexity:** Medium (requires database queries in Edge Function)

