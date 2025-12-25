# كيفية إنشاء إشارات اختبار - How to Create Test Signals

## 🔍 المشكلة

البوت يعمل بشكل صحيح (`auto-trader-worker` مجدول ويعمل)، لكن **لا توجد إشارات PENDING** في قاعدة البيانات ليعمل عليها.

من الـ logs:
```
Found 0 unique signals to process (0 total, 0 legacy)
Found 4 active bot users
```

---

## ✅ الحل: إنشاء إشارات اختبار

### الطريقة 1: إنشاء إشارة يدوياً عبر SQL (سريع للاختبار)

1. **افتح Supabase Dashboard** → **SQL Editor**

2. **نفذ هذا الكود** (استبدل `YOUR_USER_ID` بـ user_id الخاص بك):

```sql
-- إنشاء إشارة اختبار PENDING
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
  85,  -- confidence_score عالي
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

3. **تحقق من الإشارة:**
```sql
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
ORDER BY created_at DESC;
```

4. **انتظر دقيقة واحدة** - `auto-trader-worker` سيعمل تلقائياً

5. **تحقق من النتيجة:**
```sql
-- تحقق من auto_trades
SELECT 
  id,
  pair,
  direction,
  status,
  reason_code,
  created_at
FROM auto_trades
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

---

### الطريقة 2: استخدام strategy-runner-worker (لإشارات حقيقية)

`strategy-runner-worker` ينشئ إشارات تلقائياً من بيانات السوق الحقيقية.

#### الخطوة 1: جدولة strategy-runner-worker

1. **افتح Supabase Dashboard** → **Database** → **Cron Jobs**

2. **أنشئ cron job جديد:**

**Name:**
```
strategy-runner-worker-15m
```

**Schedule:**
```
*/5 * * * *
```
(كل 5 دقائق)

**SQL:**
```sql
SELECT net.http_post(
  url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/strategy-runner-worker',
  headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
  body:='{"timeframe": "15m"}'::jsonb
);
```

#### الخطوة 2: إضافة رموز إلى Watchlist

1. **افتح Supabase Dashboard** → **Table Editor** → **price_watchlist**

2. **أضف رموز للـ watchlist:**

```sql
INSERT INTO price_watchlist (
  user_id,
  symbol,
  is_active,
  created_at
) VALUES (
  'YOUR_USER_ID',
  'BTCUSDT',
  true,
  NOW()
);
```

3. **أضف المزيد من الرموز:**
```sql
INSERT INTO price_watchlist (user_id, symbol, is_active, created_at)
VALUES 
  ('YOUR_USER_ID', 'ETHUSDT', true, NOW()),
  ('YOUR_USER_ID', 'BNBUSDT', true, NOW());
```

#### الخطوة 3: انتظر إنشاء الإشارات

- `strategy-runner-worker` سيعمل كل 5 دقائق
- سينشئ إشارات تلقائياً إذا كانت الشروط مناسبة
- الإشارات ستكون بحالة `PENDING` وستُعالج بواسطة `auto-trader-worker`

---

### الطريقة 3: استخدام TradingView Webhook (لإشارات TradingView)

إذا كنت تستخدم TradingView، يمكنك إرسال إشارات عبر webhook.

#### الخطوة 1: الحصول على Webhook URL

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/tradingview-webhook
```

#### الخطوة 2: إعداد TradingView Alert

1. في TradingView، أنشئ Alert
2. في "Webhook URL"، أدخل الـ URL أعلاه
3. في "Message"، استخدم هذا التنسيق:

```json
{
  "action": "BUY",
  "symbol": "BTCUSDT",
  "price": 50000,
  "confidence": 85,
  "strategy": "My Strategy",
  "timeframe": "1h"
}
```

#### الخطوة 3: تحقق من الإشارة

```sql
SELECT * FROM tradingview_signals
WHERE user_id = 'YOUR_USER_ID'
AND execution_status = 'PENDING'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔍 التحقق من أن الإشارة ستُعالج

### 1. تحقق من إعدادات البوت:

```sql
SELECT 
  is_active,
  auto_trading_enabled,
  auto_trading_mode,
  allowed_signal_sources,
  allowed_directions,
  min_signal_confidence
FROM bot_settings
WHERE user_id = 'YOUR_USER_ID';
```

**يجب أن تكون:**
- `is_active = true`
- `auto_trading_enabled = true`
- `auto_trading_mode = 'full_auto'`
- `allowed_signal_sources` يحتوي على مصدر الإشارة (مثلاً `['tradingview']` أو `['ai_ultra']`)
- `allowed_directions` يحتوي على اتجاه الإشارة (مثلاً `['long']` للـ BUY)
- `min_signal_confidence` أقل من `confidence_score` للإشارة

### 2. تحقق من مصدر الإشارة:

الإشارة يجب أن تطابق `allowed_signal_sources`:

- إذا `allowed_signal_sources = ['tradingview']`:
  - الإشارة يجب أن تكون من مصدر `tradingview`
  - أو من `webhook_data.source = 'tradingview'`

- إذا `allowed_signal_sources = ['ai_ultra']`:
  - الإشارة يجب أن تكون من مصدر `ai_ultra`
  - أو من `strategy_name` يحتوي على 'AI'

### 3. تحقق من اتجاه الإشارة:

الإشارة يجب أن تطابق `allowed_directions`:

- إذا `allowed_directions = ['long']`:
  - الإشارة يجب أن تكون `BUY` أو `STRONG_BUY`

- إذا `allowed_directions = ['short']`:
  - الإشارة يجب أن تكون `SELL` أو `STRONG_SELL`

---

## 🧪 اختبار سريع

### 1. أنشئ إشارة اختبار:

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
  90,  -- confidence عالي
  50000,
  48000,
  52000,
  2.0,
  'Test Signal',
  'ACTIVE',
  'PENDING',
  NOW()
);
```

### 2. تحقق من إعدادات البوت:

```sql
-- تأكد من أن allowed_signal_sources يحتوي على 'tradingview' أو 'legacy'
-- تأكد من أن allowed_directions يحتوي على 'long'
UPDATE bot_settings
SET 
  allowed_signal_sources = ARRAY['tradingview', 'legacy'],
  allowed_directions = ARRAY['long', 'short']
WHERE user_id = 'YOUR_USER_ID';
```

### 3. انتظر دقيقة واحدة

`auto-trader-worker` سيعمل تلقائياً

### 4. تحقق من النتيجة:

```sql
-- تحقق من auto_trades
SELECT * FROM auto_trades
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- تحقق من auto_trade_logs
SELECT * FROM auto_trade_logs
WHERE auto_trade_id IN (
  SELECT id FROM auto_trades WHERE user_id = 'YOUR_USER_ID'
)
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 مراقبة الإشارات

### عرض جميع الإشارات PENDING:

```sql
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
ORDER BY created_at DESC;
```

### عرض الإشارات المعالجة:

```sql
SELECT 
  ts.id,
  ts.symbol,
  ts.signal_type,
  ts.execution_status,
  ts.execution_reason,
  at.status as auto_trade_status,
  at.reason_code
FROM tradingview_signals ts
LEFT JOIN auto_trades at ON at.signal_id = ts.id
WHERE ts.user_id = 'YOUR_USER_ID'
ORDER BY ts.created_at DESC
LIMIT 20;
```

---

## ⚠️ ملاحظات مهمة

1. **execution_status يجب أن يكون PENDING:**
   - إذا كانت الإشارة بحالة `EXECUTED` أو `FILTERED`، لن تُعالج
   - استخدم `UPDATE tradingview_signals SET execution_status = 'PENDING' WHERE id = '...'` لإعادة المحاولة

2. **مصدر الإشارة:**
   - تأكد من أن `allowed_signal_sources` يحتوي على مصدر الإشارة
   - يمكنك استخدام `webhook_data.source` أو `strategy_name` لتحديد المصدر

3. **اتجاه الإشارة:**
   - `BUY` / `STRONG_BUY` = `long`
   - `SELL` / `STRONG_SELL` = `short`
   - تأكد من أن `allowed_directions` يحتوي على الاتجاه الصحيح

4. **Confidence Score:**
   - تأكد من أن `confidence_score` >= `min_signal_confidence`
   - إذا كان `min_signal_confidence = null`، سيستخدم القيمة الافتراضية (70)

---

## 🔗 روابط مفيدة

- [Auto Trading Setup Guide](./AUTO_TRADING_SETUP_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_AUTO_TRADING.md)
- [Auto Trading Requirements](./AUTO_TRADING_REQUIREMENTS.md)

