# 🚀 Quick Start - Phase 2 Strategy System

## ⚡ 5-Minute Setup

### 1. Apply Migrations (Required)

```bash
cd "e:/Orbitra AI"

# Apply Phase 1 migrations (if not done)
supabase db push

# Or manually in Supabase Dashboard SQL Editor:
# 1. Copy content from: supabase/migrations/20240101_strategy_system_phase1.sql
# 2. Run in SQL Editor
# 3. Copy content from: supabase/migrations/20240102_seed_strategy_templates.sql
# 4. Run in SQL Editor
# 5. Copy content from: supabase/migrations/20240103_add_bot_status_field.sql
# 6. Run in SQL Editor
```

### 2. Verify Database

```sql
-- Should return 6 templates
SELECT COUNT(*) FROM strategy_templates;

-- Should have status column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bot_settings' AND column_name = 'status';
```

### 3. Start Dev Server

```bash
npm run dev
```

### 4. Test UI

1. Navigate to **Strategies** page
2. Click **"القوالب المتاحة"** tab
3. Click **"إنشاء استراتيجية"** on any template
4. Fill form and create strategy
5. Go to **Bot Settings** → **"الاستراتيجية"** tab
6. Select your strategy from dropdown
7. Toggle bot ON → Selector should be **disabled**
8. Toggle bot OFF → Selector should be **enabled**

---

## 📁 Key Files

### UI Components
- `src/components/bot-settings/StrategyInstanceSelector.tsx` - Main selector component
- `src/components/strategy-system/CreateStrategyDialog.tsx` - Create/edit dialog

### Services
- `src/services/strategy-system/StrategyInstanceService.ts` - CRUD + versioning

### Hooks
- `src/hooks/useStrategyInstances.ts` - React Query hooks

### Pages
- `src/pages/Strategies.tsx` - Strategy management
- `src/pages/BotSettings.tsx` - Bot configuration

---

## 🎯 What Works Now

✅ Create strategy instances from templates
✅ Edit strategies (creates new version if in use)
✅ Assign strategy to bot
✅ Safe switching (disabled when bot running)
✅ Version awareness ("New version available")
✅ Switch to latest version
✅ Legacy strategy warning

---

## ⚠️ What's Pending

❌ Bot start logic (backend)
❌ Strategy instance loading on bot start
❌ Config validation before start
❌ Status field sync with actual bot state

**See:** `PHASE2_IMPLEMENTATION_NOTES.md` for backend implementation

---

## 🐛 Troubleshooting

### Issue: Selector doesn't show strategies

**Fix:**
```sql
-- Check if templates exist
SELECT * FROM strategy_templates;

-- Check if you have instances
SELECT * FROM strategy_instances WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'strategy_instances';
```

### Issue: Cannot create strategy

**Fix:**
1. Check browser console for errors
2. Verify you're authenticated
3. Check Supabase logs
4. Verify RLS policies allow INSERT

### Issue: "New version available" doesn't show

**Fix:**
1. Make sure you **edited** the strategy (not created new one)
2. Check `parent_id` is set:
   ```sql
   SELECT id, name, version, parent_id FROM strategy_instances;
   ```

---

## 📚 Documentation

- **`STRATEGY_SYSTEM_COMPLETE.md`** - Full overview
- **`PHASE2_TESTING_GUIDE.md`** - Complete testing checklist
- **`PHASE2_IMPLEMENTATION_NOTES.md`** - Backend integration guide
- **`DEPLOYMENT_INSTRUCTIONS.md`** - Production deployment

---

## 🎉 Success!

If you can:
1. ✅ Create a strategy instance
2. ✅ Select it in Bot Settings
3. ✅ See it disabled when bot is ON
4. ✅ See it enabled when bot is OFF

**Then Phase 2 UI is working perfectly!** 🚀

---

## 💬 Need Help?

1. Check browser console for errors
2. Check Supabase logs
3. Review `PHASE2_TESTING_GUIDE.md`
4. Verify migrations applied correctly

---

**Status:** ✅ Ready to Test

**Next:** Backend Integration (see `PHASE2_IMPLEMENTATION_NOTES.md`)

