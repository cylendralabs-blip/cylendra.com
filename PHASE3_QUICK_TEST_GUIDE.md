# 🧪 Phase 3: Quick Testing Guide

## 🚀 Start Testing in 3 Steps

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Create a Strategy Instance
1. Go to: `http://localhost:5173/strategies`
2. Click on "استراتيجياتي" tab
3. Click "إنشاء استراتيجية جديدة"
4. Choose any template (e.g., "DCA الأساسية")
5. Fill in the form and save

### Step 3: Test Bot Control
1. Go to: `http://localhost:5173/dashboard/bot-settings`
2. Go to "الاستراتيجية" tab
3. Select the strategy you just created
4. Click "حفظ الإعدادات"
5. Go back to Dashboard: `http://localhost:5173/dashboard`
6. Click the **START** button (green play button)
7. **Expected:** Bot starts, button turns red (stop)
8. Try to change strategy → **Expected:** Selector is disabled
9. Click **STOP** button
10. **Expected:** Bot stops, selector becomes enabled

---

## ✅ What to Check

### 1. Start Button Behavior
- ✅ Disabled if no strategy selected
- ✅ Shows loading spinner while starting
- ✅ Shows success toast on start
- ✅ Button turns red (stop) after start

### 2. Stop Button Behavior
- ✅ Shows loading spinner while stopping
- ✅ Shows success toast on stop
- ✅ Button turns green (start) after stop

### 3. Strategy Selector
- ✅ Disabled when bot is RUNNING
- ✅ Shows warning message when disabled
- ✅ Enabled when bot is STOPPED

### 4. Error Handling
- ✅ Try to start without strategy → Shows error
- ✅ Error message is clear and helpful

### 5. Database Check
Open Supabase Dashboard → SQL Editor:
```sql
select 
  status, 
  is_active, 
  strategy_instance_id, 
  active_strategy_instance_id,
  last_started_at,
  last_stopped_at,
  error_message
from bot_settings
limit 1;
```

**Expected after START:**
- `status` = 'RUNNING'
- `is_active` = true
- `active_strategy_instance_id` = (same as strategy_instance_id)
- `last_started_at` = (recent timestamp)

**Expected after STOP:**
- `status` = 'STOPPED'
- `is_active` = false
- `active_strategy_instance_id` = (still set, as reference)
- `last_stopped_at` = (recent timestamp)

---

## 🐛 Common Issues & Solutions

### Issue 1: "No strategy selected" error
**Solution:** Go to Bot Settings → Strategy tab → Select a strategy → Save

### Issue 2: Start button is disabled
**Possible causes:**
1. No strategy selected → Select a strategy
2. Bot is already running → Stop it first
3. Loading state → Wait a few seconds

### Issue 3: Edge Function error
**Check:**
1. Edge Function is deployed: `supabase functions list --project-ref pjgfrhgjbbsqsmwfljpg`
2. Check logs: Supabase Dashboard → Edge Functions → bot-control → Logs

### Issue 4: TypeScript errors
**Solution:**
```bash
supabase gen types typescript --project-id pjgfrhgjbbsqsmwfljpg --schema public > src/integrations/supabase/types.ts
```

---

## 📊 Test Scenarios

### ✅ Scenario 1: Happy Path
1. Create strategy instance
2. Assign to bot
3. Start bot → ✅ Success
4. Stop bot → ✅ Success

### ✅ Scenario 2: No Strategy
1. Don't assign strategy
2. Try to start → ❌ Error: "No strategy selected"

### ✅ Scenario 3: Safe Switching
1. Start bot
2. Try to change strategy → ❌ Disabled
3. Stop bot
4. Change strategy → ✅ Enabled

### ✅ Scenario 4: Double Start
1. Start bot
2. Try to start again → ❌ Error: "Already running"

---

## 🎯 Success Criteria

All of these should work:
- ✅ Bot starts with valid strategy
- ✅ Bot stops successfully
- ✅ Strategy selector is disabled when running
- ✅ Strategy selector is enabled when stopped
- ✅ Error messages are clear and helpful
- ✅ Database fields are updated correctly
- ✅ No console errors
- ✅ No TypeScript errors

---

## 🚀 Next: Test in Production

Once all tests pass locally:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Phase 3: Bot Start/Stop Logic Implementation"
   git push
   ```

2. **Deploy to production:**
   - Migrations are already applied ✅
   - Edge Function is already deployed ✅
   - Just deploy frontend changes

3. **Test in production:**
   - Same test scenarios as above
   - Monitor Edge Function logs
   - Check for any errors

---

## 💬 Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase Edge Function logs
3. Check database values
4. Review `PHASE3_IMPLEMENTATION_COMPLETE.md` for details

**Happy Testing! 🎉**

