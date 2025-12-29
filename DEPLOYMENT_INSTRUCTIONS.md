# Strategy System Phase 1 - Deployment Instructions

## 🚀 Quick Start

Follow these steps to deploy the Strategy System Phase 1 to your Supabase project.

---

## Step 1: Apply Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root directory
cd /path/to/orbitra-ai

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Option B: Using Supabase Dashboard (Manual)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: **Orbitra_AI** (ID: pjgfrhgjbbsqsmwfljpg)
3. Navigate to **SQL Editor**
4. Run the migrations in order:

#### Migration 1: Schema Setup

Copy and paste the entire content of:
```
supabase/migrations/20240101_strategy_system_phase1.sql
```

Click **Run** and wait for completion.

#### Migration 2: Seed Data

Copy and paste the entire content of:
```
supabase/migrations/20240102_seed_strategy_templates.sql
```

Click **Run** and wait for completion.

---

## Step 2: Verify Database Setup

Run these queries in the SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('strategy_templates', 'strategy_instances');

-- Check if templates were seeded
SELECT key, name, category, risk_level 
FROM strategy_templates 
ORDER BY category, name;

-- Check if bot_settings has new column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bot_settings' 
AND column_name = 'strategy_instance_id';
```

Expected results:
- ✅ 2 tables found: `strategy_templates`, `strategy_instances`
- ✅ 6 strategy templates found (3 DCA, 2 Grid, 1 Momentum)
- ✅ `strategy_instance_id` column exists in `bot_settings`

---

## Step 3: Test the System

### Test 1: Browse Templates

1. Navigate to **Strategies** page in your app
2. Click on **"القوالب المتاحة"** (Available Templates) tab
3. You should see 6 strategy templates grouped by category

### Test 2: Create Strategy Instance

1. Click **"إنشاء استراتيجية جديدة"** on any template
2. Fill in the form:
   - Name: "Test DCA Strategy"
   - Configure the fields
3. Click **"إنشاء الاستراتيجية"**
4. Switch to **"استراتيجياتي"** (My Strategies) tab
5. You should see your new strategy

### Test 3: Edit Strategy (Versioning)

1. Click **"تعديل"** (Edit) on your strategy
2. Change some configuration
3. Click **"حفظ التغييرات"**
4. Since the strategy is not in use, it should update directly (no new version)

### Test 4: Versioning with In-Use Strategy

1. Manually mark a strategy as in use:
   ```sql
   UPDATE strategy_instances 
   SET is_in_use = true 
   WHERE id = 'YOUR_STRATEGY_ID';
   ```
2. Try to edit the strategy again
3. You should see a warning: "سيتم إنشاء نسخة جديدة (النسخة 2)"
4. After saving, a new version should be created

---

## Step 4: Update Bot Settings (Optional - Phase 2)

This step is optional for Phase 1. The bot settings will continue to work with the old `strategy_type` field.

To fully integrate with Bot Settings:

1. Update `src/components/bot-settings/StrategySettings.tsx`
2. Replace strategy type dropdown with strategy instance selector
3. Use `useStrategyInstances()` hook to fetch user's strategies
4. Update form to use `strategy_instance_id` instead of `strategy_type`

---

## 🔍 Troubleshooting

### Issue: Migration fails with "table already exists"

**Solution:** The tables might already exist from a previous attempt. Drop them first:

```sql
DROP TABLE IF EXISTS strategy_instances CASCADE;
DROP TABLE IF EXISTS strategy_templates CASCADE;
```

Then re-run the migrations.

### Issue: RLS policies prevent access

**Solution:** Make sure you're logged in as an authenticated user. Check RLS policies:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('strategy_templates', 'strategy_instances');
```

### Issue: Templates not showing in UI

**Solution:** Check browser console for errors. Verify:
1. Supabase client is properly configured
2. User is authenticated
3. Templates exist in database:
   ```sql
   SELECT COUNT(*) FROM strategy_templates WHERE is_active = true;
   ```

### Issue: TypeScript errors

**Solution:** Make sure all new files are properly imported:

```bash
# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 📊 Monitoring

After deployment, monitor these metrics:

1. **Database Performance:**
   ```sql
   -- Check query performance
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%strategy_%' 
   ORDER BY total_exec_time DESC 
   LIMIT 10;
   ```

2. **User Activity:**
   ```sql
   -- Count strategy instances per user
   SELECT user_id, COUNT(*) as strategy_count 
   FROM strategy_instances 
   GROUP BY user_id 
   ORDER BY strategy_count DESC;
   ```

3. **Version Distribution:**
   ```sql
   -- Check version distribution
   SELECT version, COUNT(*) as count 
   FROM strategy_instances 
   GROUP BY version 
   ORDER BY version;
   ```

---

## ✅ Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] 6 strategy templates seeded
- [ ] `strategy_instance_id` column added to `bot_settings`
- [ ] RLS policies working correctly
- [ ] Templates visible in UI
- [ ] Can create strategy instances
- [ ] Can edit strategy instances
- [ ] Versioning works correctly
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## 🎉 Success!

If all checks pass, your Strategy System Phase 1 is successfully deployed!

Next steps:
- Start using the new strategy system
- Migrate existing bot configurations (Phase 2)
- Implement advanced features (Phase 2+)

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the implementation in `STRATEGY_SYSTEM_PHASE1.md`
3. Check Supabase logs for errors
4. Verify all files are properly saved and imported

