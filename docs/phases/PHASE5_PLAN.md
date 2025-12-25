# Phase 5 - Risk Management Engine (Advanced)

## 🎯 Goals

Build advanced risk management layer with daily loss limits, maximum exposure limits, kill switch, dynamic position sizing, and portfolio risk assessment.

---

## 📊 Current State Analysis

### ✅ What Exists:
1. **Basic Risk Settings** - `bot_settings` table has risk_percentage, max_active_trades
2. **Position Sizing** - Basic sizing engine exists (`src/core/engines/sizingEngine.ts`)
3. **Safety Guards** - Basic checks in `src/services/signals/safetyGuards.ts`
4. **Trade Execution** - Full execution engine with order lifecycle

### 🔧 What's Needed:
1. **Daily Loss Tracking** - Track daily PnL per user
2. **Exposure Limits** - Track and limit total exposure across all trades
3. **Kill Switch** - Emergency stop for all trading
4. **Dynamic Sizing** - Adjust position size based on volatility/risk
5. **Portfolio Risk** - Calculate and monitor total portfolio risk
6. **Risk Alerts** - Notify when risk limits are reached

---

## 🗂️ Scope

### Inside Phase 5:
- Daily loss limit tracking and enforcement
- Maximum exposure limit tracking and enforcement
- Kill switch functionality (user-level and system-level)
- Dynamic position sizing based on volatility
- Portfolio risk calculation and monitoring
- Risk alerts (in-app, email, telegram)

### Outside Phase 5:
- Advanced position management (Phase 6)
- Backtesting (Phase 9)
- AI-powered risk analysis (Phase 11)

---

## 📋 Tasks (8 tasks)

### Task 1: Daily Loss Tracking
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/dailyLossTracker.ts`
- `supabase/migrations/20250117000000_daily_loss_tracking.sql`

**Features:**
- Track daily PnL per user
- Calculate daily loss percentage
- Enforce daily loss limit
- Reset daily at midnight UTC
- Historical daily loss tracking

**Database Tables:**
- `daily_loss_snapshots` (user_id, date, total_loss, loss_percentage, trades_count)

---

### Task 2: Exposure Limits
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/exposureTracker.ts`
- `supabase/migrations/20250117000001_exposure_limits.sql`

**Features:**
- Track total exposure (sum of all active trade values)
- Calculate exposure percentage of total capital
- Enforce maximum exposure limit
- Real-time exposure updates
- Exposure alerts when approaching limit

**Database Tables:**
- `exposure_snapshots` (user_id, timestamp, total_exposure, exposure_percentage, active_trades)

---

### Task 3: Kill Switch
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/killSwitch.ts`
- `supabase/migrations/20250117000002_kill_switch.sql`

**Features:**
- User-level kill switch (stop all trading for user)
- System-level kill switch (stop all trading globally)
- Automatic kill switch triggers (daily loss exceeded, exposure exceeded)
- Manual kill switch toggle (UI button)
- Kill switch status tracking

**Database Tables:**
- `kill_switches` (user_id, is_active, reason, triggered_at, triggered_by)

---

### Task 4: Dynamic Position Sizing
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/dynamicSizing.ts`
- `src/core/engines/dynamicSizingEngine.ts` (enhanced)

**Features:**
- Adjust position size based on volatility (ATR)
- Adjust position size based on account size
- Adjust position size based on recent performance
- Kelly Criterion for optimal sizing (optional)
- Maximum position size cap

---

### Task 5: Portfolio Risk Assessment
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/portfolioRisk.ts`
- `src/services/riskManagement/riskCalculator.ts`

**Features:**
- Calculate total portfolio risk
- Calculate correlation between positions
- Calculate value at risk (VaR)
- Calculate maximum drawdown
- Portfolio heat map (risk concentration)

---

### Task 6: Risk Alerts
**Status:** Pending

**Files to Create:**
- `src/services/riskManagement/riskAlerts.ts`
- `src/services/riskManagement/alertManager.ts`

**Features:**
- Daily loss limit approaching/breached
- Exposure limit approaching/breached
- Kill switch activated
- High portfolio risk detected
- Email/Telegram notifications (optional)

---

### Task 7: Risk Dashboard UI
**Status:** Pending

**Files to Create:**
- `src/components/risk/RiskDashboard.tsx`
- `src/components/risk/DailyLossWidget.tsx`
- `src/components/risk/ExposureWidget.tsx`
- `src/components/risk/KillSwitchWidget.tsx`
- `src/components/risk/PortfolioRiskWidget.tsx`
- `src/pages/RiskManagement.tsx`

**Features:**
- Real-time risk metrics display
- Daily loss chart
- Exposure chart
- Kill switch toggle
- Risk alerts display
- Historical risk data

---

### Task 8: Integration with Auto-Trader
**Status:** Pending

**Files to Modify:**
- `src/services/automatedTrading/signalFilters.ts` (add risk filters)
- `supabase/functions/auto-trader-worker/index.ts` (add risk checks)

**Features:**
- Check daily loss limit before executing trade
- Check exposure limit before executing trade
- Check kill switch status before executing trade
- Reject trades if risk limits exceeded
- Log risk rejection reasons

---

## 🗂️ File Structure

```
src/
  ├── services/
  │   └── riskManagement/
  │       ├── dailyLossTracker.ts
  │       ├── exposureTracker.ts
  │       ├── killSwitch.ts
  │       ├── dynamicSizing.ts
  │       ├── portfolioRisk.ts
  │       ├── riskCalculator.ts
  │       ├── riskAlerts.ts
  │       └── alertManager.ts
  │
  ├── core/
  │   └── engines/
  │       └── dynamicSizingEngine.ts (enhanced)
  │
  ├── components/
  │   └── risk/
  │       ├── RiskDashboard.tsx
  │       ├── DailyLossWidget.tsx
  │       ├── ExposureWidget.tsx
  │       ├── KillSwitchWidget.tsx
  │       └── PortfolioRiskWidget.tsx
  │
  └── pages/
      └── RiskManagement.tsx

supabase/
  ├── migrations/
  │   ├── 20250117000000_daily_loss_tracking.sql
  │   ├── 20250117000001_exposure_limits.sql
  │   └── 20250117000002_kill_switch.sql
```

---

## 🚀 Implementation Order

1. **Task 1:** Daily Loss Tracking (foundation)
2. **Task 2:** Exposure Limits (foundation)
3. **Task 3:** Kill Switch (foundation)
4. **Task 5:** Portfolio Risk Assessment (uses above)
5. **Task 4:** Dynamic Position Sizing (uses risk data)
6. **Task 6:** Risk Alerts (uses all above)
7. **Task 7:** Risk Dashboard UI (displays all above)
8. **Task 8:** Integration with Auto-Trader (uses all above)

---

## ✅ Success Criteria

- [ ] Daily loss limits enforced
- [ ] Maximum exposure limits enforced
- [ ] Kill switch functional (user & system level)
- [ ] Dynamic sizing adjusts based on risk
- [ ] Portfolio risk calculated and monitored
- [ ] Risk alerts working
- [ ] UI dashboard displays risk metrics
- [ ] Auto-trader respects all risk limits

---

## 📅 Estimated Time

**14-21 days** (depending on complexity of risk calculations)

---

## 🎯 Key Features

### Daily Loss Limit
- Track daily PnL
- Calculate daily loss percentage
- Stop trading when limit reached
- Reset daily at midnight

### Exposure Limit
- Track total exposure across all trades
- Calculate exposure as % of capital
- Prevent new trades when limit reached
- Real-time monitoring

### Kill Switch
- Manual toggle (UI button)
- Automatic triggers (loss/exposure limits)
- User-level and system-level
- Emergency stop for all trading

### Dynamic Sizing
- Volatility-based sizing (ATR)
- Account size-based sizing
- Performance-based sizing
- Maximum cap protection

### Portfolio Risk
- Total portfolio risk calculation
- Position correlation analysis
- Value at Risk (VaR)
- Maximum drawdown tracking

---

**Ready to start Phase 5!** 🚀

