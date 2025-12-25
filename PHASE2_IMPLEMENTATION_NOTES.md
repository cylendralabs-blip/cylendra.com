# Phase 2 Implementation Notes

## ✅ Completed Tasks

### 1. Database Schema ✅
- **File:** `supabase/migrations/20240103_add_bot_status_field.sql`
- Added `status` field to `bot_settings` table
- Values: `STOPPED`, `RUNNING`, `PAUSED`, `ERROR`
- Synced with existing `is_active` field
- Created index for performance

### 2. Strategy Instance Service Helpers ✅
- **File:** `src/services/strategy-system/StrategyInstanceService.ts`
- Added `getRootInstance()` - Find root of strategy family
- Added `getLatestVersion()` - Get latest version in family
- Added `checkForNewerVersion()` - Check if newer version exists
- Added `getFamilyVersions()` - Get all versions in family

### 3. Strategy Instance Selector Component ✅
- **File:** `src/components/bot-settings/StrategyInstanceSelector.tsx`
- Replaces hardcoded strategy dropdown
- Shows strategy instances with version numbers
- Displays "New version available" badge
- "Switch to latest" button (only when STOPPED)
- Safe switching enforcement (disabled when RUNNING)
- Preview panel for selected strategy
- "Create new strategy" button
- Legacy strategy warning

### 4. Bot Settings Integration ✅
- **File:** `src/pages/BotSettings.tsx`
- Replaced `StrategySettings` with `StrategyInstanceSelector`
- Added `botStatus` tracking (derived from `is_active` for now)
- Passes `botStatus` to selector component

### 5. Schema Updates ✅
- **File:** `src/core/config/botSettings.schema.ts`
- Added `status` field (optional, default: 'STOPPED')
- Made `strategy_type` optional (backward compatibility)
- Kept `strategy_instance_id` optional (will be required later)

---

## 🚧 Pending Tasks (Backend Integration)

### 1. Bot Start Logic
**Location:** Bot engine / Edge Functions

**Required Changes:**
```typescript
// On bot START:
async function startBot(userId: string) {
  // 1. Load bot settings
  const settings = await getBotSettings(userId);
  
  // 2. Check if strategy_instance_id exists
  if (!settings.strategy_instance_id) {
    // Backward compatibility: check legacy strategy_type
    if (settings.strategy_type) {
      throw new Error('Legacy strategy detected. Please migrate to new strategy system.');
    }
    throw new Error('No strategy selected. Please assign a strategy instance.');
  }
  
  // 3. Load strategy instance
  const instance = await StrategyInstanceService.getInstanceById(
    settings.strategy_instance_id,
    userId
  );
  
  if (!instance) {
    throw new Error('Strategy instance not found');
  }
  
  // 4. Load strategy template
  const template = await StrategyTemplateService.getTemplateById(
    instance.template_id
  );
  
  if (!template) {
    throw new Error('Strategy template not found');
  }
  
  // 5. Validate config using template schema
  const validation = StrategyTemplateService.validateConfig(
    template,
    instance.config
  );
  
  if (!validation.isValid) {
    throw new Error(`Invalid strategy configuration: ${validation.errors.join(', ')}`);
  }
  
  // 6. Mark instance as in use
  await StrategyInstanceService.markAsInUse(instance.id, true);
  
  // 7. Update bot status to RUNNING
  await supabase
    .from('bot_settings')
    .update({ status: 'RUNNING', is_active: true })
    .eq('user_id', userId);
  
  // 8. Initialize bot engine with template + instance config
  await initializeBotEngine({
    userId,
    templateKey: template.key,
    config: instance.config,
    marketType: settings.market_type,
    // ... other settings
  });
}

// On bot STOP:
async function stopBot(userId: string) {
  const settings = await getBotSettings(userId);
  
  // 1. Stop bot engine
  await stopBotEngine(userId);
  
  // 2. Update bot status
  await supabase
    .from('bot_settings')
    .update({ status: 'STOPPED', is_active: false })
    .eq('user_id', userId);
  
  // 3. Mark strategy instance as not in use (optional)
  if (settings.strategy_instance_id) {
    await StrategyInstanceService.markAsInUse(
      settings.strategy_instance_id,
      false
    );
  }
}
```

### 2. Bot Status Sync
**Location:** Bot engine / Realtime updates

**Required:**
- Update `status` field when bot starts/stops/errors
- Sync `is_active` with `status` for backward compatibility
- Emit realtime events for status changes

### 3. Error Handling
**Location:** Bot engine

**Required:**
- Set `status = 'ERROR'` when bot crashes
- Store error message
- Prevent strategy changes when status is ERROR

---

## 📋 Testing Checklist

### UI Testing
- [ ] Strategy selector loads user instances
- [ ] Selector is disabled when bot is RUNNING
- [ ] Selector is enabled when bot is STOPPED
- [ ] "New version available" badge shows correctly
- [ ] "Switch to latest" button works
- [ ] "Create new strategy" button navigates to Strategies page
- [ ] Preview panel shows correct strategy details
- [ ] Legacy strategy warning shows when using old system

### Backend Testing (After Implementation)
- [ ] Bot cannot start without `strategy_instance_id`
- [ ] Bot loads correct template + instance on start
- [ ] Config validation works
- [ ] `is_in_use` flag is set correctly
- [ ] Bot status updates correctly (STOPPED → RUNNING → STOPPED)
- [ ] Strategy cannot be changed while bot is RUNNING
- [ ] Error status is set when bot crashes

---

## 🔄 Migration Path

### For Existing Users

**Option A: Auto-Migration (Recommended)**
```sql
-- Create strategy instances from legacy strategy_type
INSERT INTO strategy_instances (user_id, template_id, name, config, status, version)
SELECT 
  bs.user_id,
  st.id as template_id,
  CONCAT(bs.bot_name, ' - ', bs.strategy_type) as name,
  jsonb_build_object(
    'dcaLevels', bs.dca_levels,
    'riskRewardRatio', bs.risk_reward_ratio
    -- ... map other fields
  ) as config,
  'active' as status,
  1 as version
FROM bot_settings bs
JOIN strategy_templates st ON (
  (bs.strategy_type = 'basic_dca' AND st.key = 'dca_basic') OR
  (bs.strategy_type = 'dca_with_leverage_new' AND st.key = 'dca_advanced') OR
  (bs.strategy_type = 'dca_with_leverage_modify' AND st.key = 'dca_smart')
)
WHERE bs.strategy_instance_id IS NULL;

-- Link bot_settings to new instances
UPDATE bot_settings bs
SET strategy_instance_id = si.id
FROM strategy_instances si
WHERE bs.user_id = si.user_id
AND bs.strategy_instance_id IS NULL;
```

**Option B: Manual Migration**
- Show migration banner in UI
- "Migrate to new system" button
- Wizard to create strategy instance from current settings

---

## 📝 Next Steps

1. **Apply Database Migration**
   ```bash
   supabase db push
   ```

2. **Implement Bot Start Logic**
   - Update bot engine to load strategy instances
   - Add validation
   - Update status tracking

3. **Test End-to-End**
   - Create strategy instance
   - Assign to bot
   - Start bot
   - Verify it uses correct strategy
   - Try to change strategy (should be blocked)
   - Stop bot
   - Change strategy (should work)
   - Start bot again

4. **Deploy**
   - Test in staging
   - Migrate existing users
   - Deploy to production

---

## ⚠️ Important Notes

- **Do NOT allow strategy changes while bot is RUNNING**
- **Always validate config before starting bot**
- **Keep backward compatibility during transition**
- **Monitor for errors during migration**

