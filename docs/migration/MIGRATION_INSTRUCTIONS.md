# Migration Instructions - Signal Execution Status

## Problem
The migration `20250627000000_signal_execution_status.sql` failed because the `tradingview_signals` table doesn't exist yet.

## Solution

### Step 1: Check if table exists
Run this query in Supabase SQL Editor:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tradingview_signals'
);
```

### Step 2A: If table DOES NOT exist
You need to run the migration that creates the table first:
1. Open file: `supabase/migrations/20250626122717-ef45b441-460e-40cd-aaec-ec2242352a88.sql`
2. Copy all content
3. Run it in Supabase SQL Editor
4. Then run `20250627000000_signal_execution_status.sql`

### Step 2B: If table EXISTS
Just run the updated `20250627000000_signal_execution_status.sql` migration.

## Updated Migration
The migration now includes:
- ✅ Table existence check
- ✅ Graceful skip if table doesn't exist
- ✅ Clear error messages

## Files
- **Table Creation:** `supabase/migrations/20250626122717-ef45b441-460e-40cd-aaec-ec2242352a88.sql`
- **Add Execution Status:** `supabase/migrations/20250627000000_signal_execution_status.sql`

## Order of Execution
1. First: Run `20250626122717` (creates table)
2. Then: Run `20250627000000` (adds execution status fields)

