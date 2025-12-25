# Phase 2 Testing Guide

## 🧪 Testing Checklist

### Prerequisites

1. **Apply Migrations:**
   ```bash
   cd e:/Orbitra AI
   
   # Apply Phase 1 migrations (if not already done)
   supabase db push supabase/migrations/20240101_strategy_system_phase1.sql
   supabase db push supabase/migrations/20240102_seed_strategy_templates.sql
   
   # Apply Phase 2 migration
   supabase db push supabase/migrations/20240103_add_bot_status_field.sql
   ```

2. **Verify Database:**
   ```sql
   -- Check if status field exists
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'bot_settings'
   AND column_name = 'status';
   
   -- Should return: status | text | 'STOPPED'::text
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 📝 Test Scenarios

### Test 1: Strategy Instance Selector Loads

**Steps:**
1. Navigate to Bot Settings page
2. Click on "الاستراتيجية" (Strategy) tab

**Expected:**
- ✅ Strategy selector dropdown appears
- ✅ Shows "اختر استراتيجية" placeholder
- ✅ "+" button visible next to selector
- ✅ No errors in console

**If No Strategies:**
- ✅ Shows "لا توجد استراتيجيات متاحة"
- ✅ "+" button still works

---

### Test 2: Create Strategy Instance

**Steps:**
1. Click "+" button next to strategy selector
2. Should navigate to Strategies page
3. Click "القوالب المتاحة" (Available Templates) tab
4. Click "إنشاء استراتيجية" on any template
5. Fill in form:
   - Name: "Test DCA Strategy"
   - Configure fields
6. Click "إنشاء الاستراتيجية"

**Expected:**
- ✅ Dialog opens with form
- ✅ Form fields match template schema
- ✅ Can submit form
- ✅ Success toast appears
- ✅ New strategy appears in "استراتيجياتي" tab

---

### Test 3: Select Strategy in Bot Settings

**Steps:**
1. Go back to Bot Settings
2. Click "الاستراتيجية" tab
3. Open strategy selector dropdown
4. Select "Test DCA Strategy"

**Expected:**
- ✅ Dropdown shows strategy with version badge (v1)
- ✅ Can select strategy
- ✅ Preview panel appears below selector
- ✅ Shows strategy name, type, version
- ✅ "فتح" (Open) button works
- ✅ `strategy_instance_id` is set in form

---

### Test 4: Safe Switching - Bot STOPPED

**Steps:**
1. Make sure bot is STOPPED (is_active = false)
2. Go to Strategy tab
3. Try to change strategy

**Expected:**
- ✅ Selector is **enabled**
- ✅ Can change strategy
- ✅ No warning message
- ✅ Description says: "اختر الاستراتيجية التي سيستخدمها البوت"

---

### Test 5: Safe Switching - Bot RUNNING

**Steps:**
1. Toggle bot to RUNNING (is_active = true)
2. Go to Strategy tab
3. Try to change strategy

**Expected:**
- ✅ Warning alert appears: "البوت قيد التشغيل. يجب إيقاف البوت أولاً لتغيير الاستراتيجية"
- ✅ Selector is **disabled** (grayed out)
- ✅ Cannot change strategy
- ✅ Description says: "قم بإيقاف البوت لتغيير الاستراتيجية"

---

### Test 6: Version Awareness

**Steps:**
1. Create a strategy instance (v1)
2. Assign it to bot
3. Go to Strategies page
4. Edit the same strategy (while bot is STOPPED)
5. Make changes and save
6. Go back to Bot Settings → Strategy tab

**Expected:**
- ✅ "New version available" alert appears
- ✅ Shows: "إصدار جديد متاح! الإصدار 2 متوفر الآن"
- ✅ "التبديل للأحدث" button visible
- ✅ Button is **enabled** (bot is STOPPED)

---

### Test 7: Switch to Latest Version

**Steps:**
1. With "New version available" alert showing
2. Bot is STOPPED
3. Click "التبديل للأحدث" button

**Expected:**
- ✅ Selector updates to v2
- ✅ Preview panel shows v2
- ✅ Alert disappears
- ✅ `strategy_instance_id` updated to v2 ID

---

### Test 8: Version Awareness - Bot RUNNING

**Steps:**
1. Assign strategy v1 to bot
2. Start bot (is_active = true)
3. Create v2 of the strategy (edit while bot running)
4. Go to Bot Settings → Strategy tab

**Expected:**
- ✅ "New version available" alert appears
- ✅ "التبديل للأحدث" button is **disabled**
- ✅ Cannot switch while running
- ✅ Must stop bot first

---

### Test 9: Legacy Strategy Warning

**Steps:**
1. Manually set `strategy_type` in database:
   ```sql
   UPDATE bot_settings
   SET strategy_type = 'basic_dca',
       strategy_instance_id = NULL
   WHERE user_id = 'YOUR_USER_ID';
   ```
2. Refresh Bot Settings page
3. Go to Strategy tab

**Expected:**
- ✅ Red warning alert appears
- ✅ Says: "استراتيجية قديمة! يرجى اختيار استراتيجية من النظام الجديد"
- ✅ Selector shows no selection
- ✅ Can select new strategy to migrate

---

### Test 10: Save Settings

**Steps:**
1. Select a strategy instance
2. Configure other settings
3. Click "حفظ الإعدادات" button

**Expected:**
- ✅ Form submits successfully
- ✅ Success toast appears
- ✅ `strategy_instance_id` saved to database
- ✅ Can reload page and see same strategy selected

---

## 🔍 Database Verification

After testing, verify in database:

```sql
-- Check bot_settings
SELECT 
  user_id,
  bot_name,
  strategy_instance_id,
  strategy_type,
  status,
  is_active
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';

-- Check strategy instance
SELECT 
  id,
  name,
  version,
  parent_id,
  is_in_use,
  status
FROM strategy_instances
WHERE user_id = 'YOUR_USER_ID';

-- Verify link
SELECT 
  bs.bot_name,
  si.name as strategy_name,
  si.version,
  st.name as template_name
FROM bot_settings bs
JOIN strategy_instances si ON bs.strategy_instance_id = si.id
JOIN strategy_templates st ON si.template_id = st.id
WHERE bs.user_id = 'YOUR_USER_ID';
```

---

## 🐛 Common Issues

### Issue: Selector doesn't load strategies

**Solution:**
1. Check browser console for errors
2. Verify migrations applied:
   ```sql
   SELECT * FROM strategy_templates;
   SELECT * FROM strategy_instances WHERE user_id = 'YOUR_USER_ID';
   ```
3. Check Supabase RLS policies
4. Verify user is authenticated

### Issue: "New version available" doesn't show

**Solution:**
1. Make sure you edited the strategy (not created new one)
2. Check version numbers in database
3. Verify `parent_id` is set correctly
4. Check browser console for errors

### Issue: Cannot switch strategy

**Solution:**
1. Check bot status (should be STOPPED)
2. Verify `is_active` is false
3. Check if selector is disabled
4. Look for warning message

---

## ✅ Success Criteria

All tests should pass:
- [x] Selector loads strategies
- [x] Can create new strategy
- [x] Can select strategy
- [x] Preview panel works
- [x] Safe switching enforced (STOPPED = enabled, RUNNING = disabled)
- [x] Version awareness works
- [x] Can switch to latest version
- [x] Legacy warning shows
- [x] Settings save correctly
- [x] Database updated correctly

---

## 📊 Performance Testing

**Load Test:**
1. Create 20+ strategy instances
2. Open Bot Settings
3. Check selector performance

**Expected:**
- ✅ Loads in < 1 second
- ✅ Dropdown scrolls smoothly
- ✅ No lag when selecting

---

## 🎉 Phase 2 UI Testing Complete!

Once all tests pass, Phase 2 UI is ready for production.

**Next:** Backend integration (bot start logic)

