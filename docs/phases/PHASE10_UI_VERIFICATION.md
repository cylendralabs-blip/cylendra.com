# Phase 10 - UI Verification Checklist

## ✅ Files Created and Verified

### Dashboard Components (Task 2)
- ✅ `src/components/dashboard/DashboardAdvancedSection.tsx` - Collapsible advanced metrics
- ✅ `src/components/dashboard/DashboardAlertsPreview.tsx` - Recent alerts preview  
- ✅ `src/components/dashboard/OpenPositionsSummary.tsx` - Open positions summary
- ✅ `src/components/dashboard/MetricsBar.tsx` - Top metrics bar (already existed, being used)

### Bot Settings Components (Task 3)
- ✅ `src/components/bot-settings/RiskPresets.tsx` - Risk presets (Low/Medium/High)
- ✅ `src/components/bot-settings/TradeSizePreview.tsx` - Trade size preview

### Onboarding (Task 9)
- ✅ `src/components/onboarding/OnboardingWizard.tsx` - Multi-step wizard
- ✅ `src/pages/Onboarding.tsx` - Onboarding page

### Design System (Task 11)
- ✅ `src/ui/components/common/DesignTokens.ts` - Centralized design tokens

### Safety Components (Task 12)
- ✅ `src/components/safety/RiskDisclaimer.tsx` - Risk disclaimer
- ✅ `src/components/safety/ConfirmationModal.tsx` - Confirmation modal
- ✅ `src/components/safety/TradeReasonModal.tsx` - Trade reason modal
- ✅ `src/components/safety/TestnetGuard.tsx` - Testnet guard

## ✅ Files Modified

### Dashboard Page
- ✅ `src/pages/Index.tsx` - Rebuilt with new components
  - Uses: MetricsBar, OpenPositionsSummary, DashboardAlertsPreview, DashboardAdvancedSection
  - Layout: Grid with proper sections

### Bot Settings Page
- ✅ `src/pages/BotSettings.tsx` - Added RiskPresets and TradeSizePreview
  - RiskPresets in Risk tab
  - TradeSizePreview before save button

### App Routes
- ✅ `src/App.tsx` - Added Onboarding route

## 🔍 What Should Be Visible

### Dashboard (`/dashboard`)
1. **Top Metrics Bar** - Total Equity, Daily PnL, Unrealized PnL, Exposure%
2. **Open Positions Summary** - Count, best/worst trade, total open PnL
3. **Portfolio Chart** - Equity curve
4. **Live Trading Feed** - Recent signals & trades
5. **Alerts Preview** - Last 2 alerts
6. **Advanced Metrics** - Collapsible section (hidden by default)

### Bot Settings (`/dashboard/bot-settings`)
1. **Risk Tab** - Should show:
   - Risk Presets (3 buttons: Low/Medium/High)
   - Risk Settings form
2. **Before Save Button** - Should show:
   - Trade Size Preview component

### Onboarding (`/onboarding`)
1. Multi-step wizard with 6 steps

## ⚠️ Potential Issues

1. **Cache Issue**: Browser may be caching old version
   - Solution: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache

2. **Build Issue**: Netlify may not have deployed latest version
   - Check Netlify deployment logs
   - Verify latest commit is deployed

3. **Component Errors**: Some components may have runtime errors
   - Check browser console for errors
   - Verify all imports are correct

4. **Data Missing**: Some components depend on database data
   - MetricsBar needs portfolio state
   - AlertsPreview needs alerts table
   - OpenPositionsSummary needs trades table

## 📝 Next Steps

1. Clear browser cache and hard refresh
2. Check Netlify deployment status
3. Verify database tables exist (users_portfolio_state, alerts, trades)
4. Check browser console for errors
5. Verify all imports are working

---

**Last Updated**: 2025-01-17

