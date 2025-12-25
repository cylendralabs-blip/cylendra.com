# 🔍 دليل تشخيص auto-trader-worker

## المشكلة الحالية

الصفقات في `auto_trades` تبقى بحالة `pending` ولا يتم تنفيذها رغم أن:
- ✅ `auto_trading_enabled = true`
- ✅ `auto_trading_mode = 'full_auto'`
- ✅ `is_active = true`

---

## 🔍 خطوات التشخيص

### 1. تحقق من Edge Function Logs

اذهب إلى: **Supabase Dashboard → Edge Functions → auto-trader-worker → Logs**

ابحث عن:
- `Found X active bot users`
- `Found X legacy pending signals`
- `Found signal for user X from source: Y`
- `Found X unique signals to process`
- `No signals found to process. Checking auto_trades table...`

---

### 2. تحقق من auto_trade_logs

```sql
SELECT 
  step,
  message,
  data,
  created_at
FROM auto_trade_logs
WHERE auto_trade_id IN (
  SELECT id FROM auto_trades WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5
)
ORDER BY created_at DESC;
```

**ما الذي يجب أن تراه:**
- ✅ `signal_received`
- ✅ `filters_applied: PASSED`
- ✅ `limits_checked`
- ❓ `filters_applied: All filters passed, proceeding...`
- ❓ `filters_applied: Checking for duplicate trades`
- ❓ `filters_applied: Running risk evaluation checks`
- ❓ `filters_applied: Checking auto_trading_mode before execution`

**إذا توقف عند `limits_checked`:**
- المشكلة في `checkDuplicateTrade` أو `evaluateRisk`
- تحقق من Edge Function Logs للأخطاء

---

### 3. تحقق من tradingview_signals

```sql
SELECT 
  id,
  user_id,
  symbol,
  signal_type,
  execution_status,
  created_at
FROM tradingview_signals
WHERE execution_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 10;
```

**إذا لم تجد أي إشارات:**
- `auto-trader-worker` لا يجد إشارات لمعالجتها
- المشكلة في `getNextSignalForBot` أو `fetchPendingSignals`

---

### 4. تحقق من bot_settings

```sql
SELECT 
  user_id,
  is_active,
  auto_trading_enabled,
  auto_trading_mode,
  allowed_signal_sources,
  signal_source
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

**تأكد من:**
- ✅ `is_active = true`
- ✅ `auto_trading_enabled = true`
- ✅ `auto_trading_mode = 'full_auto'`
- ✅ `allowed_signal_sources` يحتوي على المصدر الصحيح (مثلاً: `['legacy']` أو `['tradingview']`)

---

### 5. تحقق من signal_source في bot_settings

```sql
SELECT 
  user_id,
  signal_source,
  allowed_signal_sources
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

**المشكلة الشائعة:**
- `signal_source` قد يكون `'ai'` بينما الإشارات في `tradingview_signals`
- `allowed_signal_sources` قد لا يحتوي على `'legacy'` أو `'tradingview'`

**الحل:**
```sql
UPDATE bot_settings
SET 
  signal_source = 'legacy',  -- أو 'tradingview' حسب مصدر إشاراتك
  allowed_signal_sources = ARRAY['legacy', 'tradingview']  -- أضف المصادر المطلوبة
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🚨 المشاكل الشائعة والحلول

### المشكلة 1: "Found 0 unique signals to process"

**السبب:**
- لا توجد إشارات بحالة `PENDING` في `tradingview_signals`
- `signal_source` في `bot_settings` لا يطابق مصدر الإشارات
- `allowed_signal_sources` لا يحتوي على المصدر الصحيح

**الحل:**
1. تحقق من `tradingview_signals`:
   ```sql
   SELECT COUNT(*) FROM tradingview_signals WHERE execution_status = 'PENDING';
   ```

2. إذا كان العدد = 0، أنشئ إشارة تجريبية:
   ```sql
   INSERT INTO tradingview_signals (
     user_id,
     symbol,
     signal_type,
     entry_price,
     stop_loss_price,
     take_profit_price,
     confidence_score,
     execution_status,
     strategy_name,
     timeframe
   ) VALUES (
     'YOUR_USER_ID',
     'BTCUSDT',
     'BUY',
     50000,
     49000,
     51000,
     75,
     'PENDING',
     'Test Signal',
     '15m'
   );
   ```

3. تأكد من `signal_source` و `allowed_signal_sources`:
   ```sql
   UPDATE bot_settings
   SET 
     signal_source = 'legacy',
     allowed_signal_sources = ARRAY['legacy', 'tradingview']
   WHERE user_id = 'YOUR_USER_ID';
   ```

---

### المشكلة 2: "No signal found for user X"

**السبب:**
- `getNextSignalForBot` لا يجد إشارات للمستخدم
- قد يكون بسبب:
  - `signal_source` لا يطابق مصدر الإشارات
  - الإشارات قديمة جداً (أكثر من 30 دقيقة)
  - `confidence_score` أقل من `min_confidence`

**الحل:**
1. تحقق من `signal_source`:
   ```sql
   SELECT signal_source FROM bot_settings WHERE user_id = 'YOUR_USER_ID';
   ```

2. تحقق من الإشارات المتاحة:
   ```sql
   -- للإشارات من tradingview_signals
   SELECT * FROM tradingview_signals 
   WHERE user_id = 'YOUR_USER_ID' 
   AND execution_status = 'PENDING'
   ORDER BY created_at DESC;
   
   -- للإشارات من ai_signals_history
   SELECT * FROM ai_signals_history 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

3. إذا كانت الإشارات موجودة لكن `getNextSignalForBot` لا يجدها:
   - تحقق من `min_confidence` في `bot_settings`
   - تحقق من `allowed_symbols` (watchlist)
   - تحقق من `default_timeframe`

---

### المشكلة 3: الصفقات تبقى "pending" بعد `limits_checked`

**السبب:**
- خطأ في `checkDuplicateTrade` أو `evaluateRisk`
- `auto_trading_mode` لا يتم تحميله بشكل صحيح

**الحل:**
1. تحقق من Edge Function Logs:
   - ابحث عن `Error checking duplicates`
   - ابحث عن `Error in risk evaluation`
   - ابحث عن `auto_trading_mode check`

2. تحقق من `auto_trade_logs`:
   ```sql
   SELECT 
     step,
     message,
     data->>'auto_trading_mode' as auto_trading_mode,
     data->>'will_execute' as will_execute,
     created_at
   FROM auto_trade_logs
   WHERE auto_trade_id = 'YOUR_AUTO_TRADE_ID'
   ORDER BY created_at DESC;
   ```

3. إذا كان `will_execute = false`:
   - تحقق من `auto_trading_mode` في `bot_settings`
   - يجب أن يكون `'full_auto'` وليس `'off'` أو `'semi_auto'`

---

## 📊 SQL Queries للتشخيص

### 1. تحقق من حالة auto_trades

```sql
SELECT 
  at.id,
  at.pair,
  at.direction,
  at.status,
  at.reason_code,
  at.created_at,
  COUNT(atl.id) as log_count
FROM auto_trades at
LEFT JOIN auto_trade_logs atl ON atl.auto_trade_id = at.id
WHERE at.status = 'pending'
GROUP BY at.id
ORDER BY at.created_at DESC
LIMIT 10;
```

### 2. تحقق من آخر log entry لكل auto_trade

```sql
SELECT DISTINCT ON (auto_trade_id)
  auto_trade_id,
  step,
  message,
  data,
  created_at
FROM auto_trade_logs
WHERE auto_trade_id IN (
  SELECT id FROM auto_trades WHERE status = 'pending'
)
ORDER BY auto_trade_id, created_at DESC;
```

### 3. تحقق من bot_settings للمستخدم

```sql
SELECT 
  user_id,
  is_active,
  auto_trading_enabled,
  auto_trading_mode,
  signal_source,
  allowed_signal_sources,
  min_signal_confidence,
  allowed_directions
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

### 4. تحقق من الإشارات المتاحة

```sql
-- tradingview_signals
SELECT 
  id,
  user_id,
  symbol,
  signal_type,
  execution_status,
  confidence_score,
  created_at
FROM tradingview_signals
WHERE execution_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 10;

-- ai_signals_history
SELECT 
  id,
  symbol,
  side,
  final_confidence,
  created_at
FROM ai_signals_history
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 الإصلاحات المطبقة

### 1. إضافة Logging شامل
- Logging بعد كل خطوة في `processSignal`
- Logging في `getNextSignalForBot` و `fetchPendingSignals`
- Logging عند عدم وجود إشارات

### 2. إضافة Error Handling
- `try-catch` حول `checkDuplicateTrade`
- `try-catch` حول `evaluateRisk`
- Default إلى `allowed: true` عند فشل risk check

### 3. إضافة تحقق من pending auto_trades
- عند عدم وجود إشارات، يتم التحقق من `auto_trades` table
- Logging للـ pending auto_trades الموجودة

---

## 📝 الخطوات التالية

1. **انتظر دقيقة واحدة** - `auto-trader-worker` يعمل كل دقيقة

2. **تحقق من Edge Function Logs:**
   - اذهب إلى Supabase Dashboard → Edge Functions → auto-trader-worker → Logs
   - ابحث عن الرسائل الجديدة

3. **تحقق من auto_trade_logs:**
   ```sql
   SELECT * FROM auto_trade_logs 
   WHERE auto_trade_id = 'YOUR_AUTO_TRADE_ID'
   ORDER BY created_at DESC;
   ```

4. **إذا استمرت المشكلة:**
   - شارك Edge Function Logs
   - شارك نتائج SQL queries
   - شارك `auto_trade_logs` للصفقة المعلقة

---

## 🔗 روابط مفيدة

- [Auto Trading Setup Guide](./AUTO_TRADING_SETUP_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_AUTO_TRADING.md)
- [How to Create Test Signals](./HOW_TO_CREATE_TEST_SIGNALS.md)
- [Auto Trader Worker Fix Summary](./AUTO_TRADER_WORKER_FIX_SUMMARY.md)

