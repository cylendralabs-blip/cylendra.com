# إصلاح مشكلة الإشارات Pending في auto_trades

## 🔍 المشكلة

الإشارات موجودة في `auto_trades` بحالة `pending` لكن لا يتم تنفيذها.

**السبب:** `auto-trader-worker` لا يقرأ من `auto_trades` مباشرة. يقرأ من `tradingview_signals` بحالة `execution_status = 'PENDING'`، ثم ينشئ `auto_trade` تلقائياً.

---

## ✅ الحل: إنشاء إشارة في tradingview_signals

### الخطوة 1: الحصول على signal_id من auto_trades

```sql
-- احصل على signal_id من auto_trades
SELECT 
  id,
  signal_id,
  pair,
  direction,
  status,
  metadata
FROM auto_trades
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;
```

### الخطوة 2: إنشاء إشارة في tradingview_signals

إذا كان `signal_id` موجود في `auto_trades`، استخدمه. إذا لم يكن موجوداً، أنشئ إشارة جديدة:

```sql
-- استبدل القيم التالية:
-- YOUR_USER_ID: user_id الخاص بك
-- signal_id: من auto_trades (إذا موجود) أو NULL
-- metadata: من auto_trades.metadata

INSERT INTO tradingview_signals (
  id,  -- استخدم signal_id من auto_trades إذا موجود
  user_id,
  symbol,
  timeframe,
  signal_type,
  signal_strength,
  confidence_score,
  entry_price,
  stop_loss_price,
  take_profit_price,
  risk_reward_ratio,
  strategy_name,
  status,
  execution_status,
  created_at
) 
SELECT 
  COALESCE(at.signal_id, gen_random_uuid()),  -- استخدم signal_id من auto_trades أو أنشئ واحد جديد
  at.user_id,
  at.pair,
  COALESCE((at.metadata->>'timeframe')::text, '1h'),
  CASE 
    WHEN at.direction = 'long' THEN 'BUY'
    WHEN at.direction = 'short' THEN 'SELL'
    ELSE 'BUY'
  END,
  'STRONG',
  COALESCE((at.metadata->>'confidence_score')::numeric, 85),
  COALESCE((at.metadata->>'entry_price')::numeric, 50000),
  COALESCE((at.metadata->>'stop_loss_price')::numeric, NULL),
  COALESCE((at.metadata->>'take_profit_price')::numeric, NULL),
  2.0,
  COALESCE((at.metadata->>'strategy_name')::text, 'Test Signal'),
  'ACTIVE',
  'PENDING',  -- مهم: يجب أن يكون PENDING
  at.created_at
FROM auto_trades at
WHERE at.status = 'pending'
AND at.id = 'd1047dc3-95b6-4a8a-b8b5-7d979acc1e8d'  -- استبدل بـ auto_trade_id
ON CONFLICT (id) DO NOTHING;  -- إذا كان signal_id موجود بالفعل
```

### الخطوة 3: التحقق من الإشارة

```sql
-- تحقق من أن الإشارة تم إنشاؤها
SELECT 
  id,
  symbol,
  signal_type,
  confidence_score,
  execution_status,
  created_at
FROM tradingview_signals
WHERE user_id = 'YOUR_USER_ID'
AND execution_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 5;
```

### الخطوة 4: انتظر دقيقة واحدة

`auto-trader-worker` سيعمل تلقائياً ويعالج الإشارة.

### الخطوة 5: التحقق من النتيجة

```sql
-- تحقق من auto_trades (يجب أن تتغير الحالة من pending إلى accepted أو rejected)
SELECT 
  id,
  pair,
  direction,
  status,
  reason_code,
  created_at
FROM auto_trades
WHERE id = 'd1047dc3-95b6-4a8a-b8b5-7d979acc1e8d';

-- تحقق من auto_trade_logs
SELECT 
  step,
  message,
  data,
  created_at
FROM auto_trade_logs
WHERE auto_trade_id = 'd1047dc3-95b6-4a8a-b8b5-7d979acc1e8d'
ORDER BY created_at DESC;
```

---

## 🔧 حل بديل: إنشاء إشارة جديدة مباشرة

إذا لم تكن تريد استخدام `auto_trades` الموجودة، أنشئ إشارة جديدة مباشرة:

```sql
-- إنشاء إشارة جديدة في tradingview_signals
INSERT INTO tradingview_signals (
  user_id,
  symbol,
  timeframe,
  signal_type,
  signal_strength,
  confidence_score,
  entry_price,
  stop_loss_price,
  take_profit_price,
  risk_reward_ratio,
  strategy_name,
  status,
  execution_status,
  created_at
) VALUES (
  'YOUR_USER_ID',  -- استبدل بـ user_id الخاص بك
  'BTCUSDT',
  '1h',
  'BUY',
  'STRONG',
  90,  -- confidence عالي
  50000,  -- entry_price
  48000,  -- stop_loss_price
  52000,  -- take_profit_price
  2.0,
  'Test Signal',
  'ACTIVE',
  'PENDING',  -- مهم: يجب أن يكون PENDING
  NOW()
);
```

---

## ⚠️ ملاحظات مهمة

1. **execution_status يجب أن يكون PENDING:**
   - إذا كانت الإشارة بحالة `EXECUTED` أو `FILTERED`، لن تُعالج
   - استخدم `UPDATE tradingview_signals SET execution_status = 'PENDING' WHERE id = '...'` لإعادة المحاولة

2. **مصدر الإشارة:**
   - تأكد من أن `allowed_signal_sources` في `bot_settings` يحتوي على مصدر الإشارة
   - للإشارات من `tradingview_signals`، استخدم `'tradingview'` أو `'legacy'`

3. **اتجاه الإشارة:**
   - `BUY` / `STRONG_BUY` = `long`
   - `SELL` / `STRONG_SELL` = `short`
   - تأكد من أن `allowed_directions` يحتوي على الاتجاه الصحيح

4. **Confidence Score:**
   - تأكد من أن `confidence_score` >= `min_signal_confidence`
   - إذا كان `min_signal_confidence = null`، سيستخدم القيمة الافتراضية (70)

---

## 🔍 التحقق من الأخطاء

### 1. تحقق من auto_trade_logs:

```sql
SELECT 
  atl.step,
  atl.message,
  atl.data,
  atl.created_at
FROM auto_trade_logs atl
WHERE atl.auto_trade_id = 'd1047dc3-95b6-4a8a-b8b5-7d979acc1e8d'
ORDER BY atl.created_at DESC;
```

### 2. تحقق من Edge Function Logs:

1. Supabase Dashboard → **Edge Functions** → **auto-trader-worker** → **Logs**
2. ابحث عن:
   - `Processing signal...` ✅
   - `Signal processing blocked by guards` ❌
   - `No bot settings found` ❌
   - `Auto trading is disabled` ❌

### 3. تحقق من إعدادات البوت:

```sql
SELECT 
  is_active,
  auto_trading_enabled,
  auto_trading_mode,
  allowed_signal_sources,
  allowed_directions,
  min_signal_confidence,
  default_platform
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📊 سيناريو كامل

### 1. إنشاء إشارة في tradingview_signals:

```sql
INSERT INTO tradingview_signals (
  user_id, symbol, timeframe, signal_type, signal_strength,
  confidence_score, entry_price, stop_loss_price, take_profit_price,
  risk_reward_ratio, strategy_name, status, execution_status, created_at
) VALUES (
  'YOUR_USER_ID',
  'BTCUSDT',
  '1h',
  'BUY',
  'STRONG',
  90,
  50000,
  48000,
  52000,
  2.0,
  'Test Signal',
  'ACTIVE',
  'PENDING',
  NOW()
) RETURNING id;
```

### 2. انتظر دقيقة واحدة

`auto-trader-worker` سيعمل تلقائياً

### 3. تحقق من auto_trades:

```sql
SELECT * FROM auto_trades
WHERE signal_id = 'SIGNAL_ID_FROM_STEP_1'
ORDER BY created_at DESC;
```

### 4. تحقق من auto_trade_logs:

```sql
SELECT * FROM auto_trade_logs
WHERE auto_trade_id IN (
  SELECT id FROM auto_trades WHERE signal_id = 'SIGNAL_ID_FROM_STEP_1'
)
ORDER BY created_at DESC;
```

---

## 🔗 روابط مفيدة

- [How to Create Test Signals](./HOW_TO_CREATE_TEST_SIGNALS.md)
- [Auto Trading Setup Guide](./AUTO_TRADING_SETUP_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_AUTO_TRADING.md)

