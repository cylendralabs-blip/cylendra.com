## Signal Backend Setup Checklist

Use this checklist any time the signal dashboard shows no data or the
`enhanced_trading_signals` table is missing.

### 1. Allow the front‑end origin (CORS)

1. Open **Supabase Dashboard → Settings → API**.
2. In **Allowed Origins** add both:
   - `https://neurotradeai7.netlify.app`
   - `http://localhost:5173`
3. Save the settings and redeploy the web app.

Without this step the browser will block every request with a `CORS policy`
error and all Realtime channels will report `CHANNEL_ERROR`.

### 2. Deploy/verify the strategy runner worker

```bash
supabase functions deploy strategy-runner-worker --project-ref pjgfrhgjbbsqsmwfljpg
```

The worker uses the internal strategy engine to create fresh signals.  
Logs are available under **Edge Functions → strategy-runner-worker**.

### 3. Create the `enhanced_trading_signals` tables

1. Copy the contents of [`APPLY_ENHANCED_SIGNALS_TABLE.sql`](../APPLY_ENHANCED_SIGNALS_TABLE.sql).
2. Run it inside the Supabase SQL editor (or execute through `psql`).
3. This script also creates `enhanced_signal_performance` and the helper
   trigger/function. It is idempotent and can be re-run safely.

### 4. Seed demo signals (optional)

To verify the UI without waiting for live signals, run the helper script:

```
supabase/sql/seed_trading_signals.sql
```

The script inserts 10 sample entries for the demo user
`88fd09b4-9148-49ff-aafb-ad420d895dc0`.

### 5. Confirm front‑end access

* Navigate to `/signals`.
* The standard Signal table pulls from `trading_signals`.
* The “Advanced Signals” section now fetches from
  `enhanced_trading_signals`. If the table is missing you will see a
  descriptive alert instead of a blank component.

Once all of the above are completed, the dashboard should stream both the
legacy and enhanced signals without additional changes.*** End Patch

