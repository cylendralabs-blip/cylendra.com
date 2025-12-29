# دليل ترحيل Edge Functions إلى Supabase

## 📋 نظرة عامة

هذا الدليل يوضح جميع Edge Functions التي يجب ترحيلها إلى Supabase ومتطلبات كل واحدة.

---

## ✅ Edge Functions المطلوبة (Required)

### 1. **execute-trade** ⭐ (الأهم)
**الوصف:** تنفيذ الصفقات على منصات التداول (Binance, OKX)

**الحالة:** ✅ Production Ready

**الملفات:**
```
supabase/functions/execute-trade/
├── index.ts                    # Entry point
├── config.ts                   # Configuration
├── trade-executor.ts           # Main orchestration
├── database.ts                 # Database operations
├── entry-order.ts              # Entry order placement
├── dca-orders.ts               # DCA orders
├── sl-tp-orders.ts             # Stop Loss / Take Profit
├── orders.ts                   # Order operations
├── symbol.ts                   # Symbol validation
├── leverage.ts                 # Leverage management
├── idempotency.ts              # Duplicate prevention
├── retry.ts                    # Retry logic
├── errors.ts                   # Error handling
└── utils.ts                    # Utilities
```

**الوظيفة:**
- تنفيذ صفقات Spot و Futures
- إدارة DCA orders
- إدارة Stop Loss / Take Profit
- إدارة Leverage
- منع التكرار (Idempotency)

**الأولوية:** 🔴 عالية جداً

---

### 2. **auto-trader-worker** ⭐⭐ (مهم جداً)
**الوصف:** Worker مجدول لمعالجة الإشارات تلقائياً وتنفيذ الصفقات

**الحالة:** ✅ Production Ready (Phase 5 Complete)

**الملفات:**
```
supabase/functions/auto-trader-worker/
├── index.ts                    # Entry point
├── config.ts                   # Configuration
├── signalProcessor.ts          # Signal processing + Risk checks
└── executionService.ts         # Trade execution service
```

**الوظيفة:**
- جلب الإشارات المعلقة
- تطبيق الفلاتر
- فحص المخاطر (Phase 5)
- منع التكرار
- تنفيذ الصفقات عبر execute-trade

**الأولوية:** 🔴 عالية جداً

**ملاحظة:** يحتاج إلى Cron Job للجدولة

---

### 3. **strategy-runner-worker** ⭐⭐
**الوصف:** Worker مجدول لتشغيل الاستراتيجيات وإنشاء الإشارات تلقائياً

**الحالة:** ✅ Production Ready (Phase 4 Complete)

**الملفات:**
```
supabase/functions/strategy-runner-worker/
├── index.ts                    # Entry point
├── config.ts                   # Configuration
└── signalGenerator.ts          # Signal generation
```

**الوظيفة:**
- جلب بيانات السوق
- حساب المؤشرات الفنية
- تشغيل الاستراتيجيات
- إنشاء الإشارات تلقائياً

**الأولوية:** 🟡 عالية

**ملاحظة:** يحتاج إلى Cron Job للجدولة

---

### 4. **get-candles** ⭐
**الوصف:** جلب الشموع التاريخية من منصات التداول

**الحالة:** ✅ Production Ready

**الملفات:**
```
supabase/functions/get-candles/
└── index.ts                    # Main function
```

**الوظيفة:**
- جلب الشموع من Binance و OKX
- دعم جميع Timeframes
- Caching للتحسين

**الأولوية:** 🟡 عالية

---

### 5. **get-live-prices** ⭐
**الوصف:** جلب أسعار مباشرة من منصات التداول

**الحالة:** ✅ Production Ready

**الملفات:**
```
supabase/functions/get-live-prices/
└── index.ts                    # Main function
```

**الوظيفة:**
- جلب أسعار مباشرة
- دعم Binance و OKX
- Real-time updates

**الأولوية:** 🟡 عالية

---

### 6. **exchange-portfolio** ⭐
**الوصف:** جلب أرصدة المحافظ من منصات التداول

**الحالة:** ✅ Production Ready

**الملفات:**
```
supabase/functions/exchange-portfolio/
├── index.ts                    # Entry point
├── handlers/
│   └── balance.ts              # Balance handlers
├── platforms/
│   ├── binance.ts
│   ├── okx.ts
│   ├── bybit.ts
│   └── kucoin.ts
└── utils/
    ├── crypto.ts
    └── pricing.ts
```

**الوظيفة:**
- جلب الأرصدة
- اختبار الاتصال
- تحديث جميع الأرصدة

**الأولوية:** 🟡 عالية

---

### 7. **tradingview-webhook** ⭐
**الوصف:** استقبال إشارات TradingView عبر Webhook

**الحالة:** ✅ Production Ready

**الملفات:**
```
supabase/functions/tradingview-webhook/
└── index.ts                    # Main function
```

**الوظيفة:**
- استقبال إشارات TradingView
- التحقق من الصحة
- حفظ الإشارات في قاعدة البيانات

**الأولوية:** 🟡 متوسطة

---

## ⚙️ Edge Functions الاختيارية (Optional)

### 8. **get-trading-pairs**
**الوصف:** جلب أزواج التداول المتاحة

**الحالة:** ✅ Production Ready

**الأولوية:** 🟢 متوسطة

---

### 9. **sync-platform-trades**
**الوصف:** مزامنة الصفقات من منصات التداول

**الحالة:** ✅ Production Ready

**الأولوية:** 🟢 متوسطة

---

### 10. **admin-users**
**الوصف:** إدارة المستخدمين (Admin)

**الحالة:** ✅ Production Ready

**الأولوية:** 🟢 منخفضة (للمطورين فقط)

---

## 📁 ملفات مشتركة (Shared Files)

**الملفات المشتركة:** يجب ترحيلها مع كل Edge Function

```
supabase/functions/_shared/
├── cors.ts                     # CORS headers
├── logger.ts                   # Logging utility
├── types.ts                    # Shared types
└── utils.ts                    # Shared utilities
```

**ملاحظة:** هذه الملفات تُستورد من جميع Edge Functions

---

## 🚀 خطوات الترحيل

### الطريقة 1: استخدام Supabase CLI (موصى بها)

#### 1. تثبيت Supabase CLI
```bash
npm install -g supabase
```

#### 2. تسجيل الدخول
```bash
supabase login
```

#### 3. ربط المشروع
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### 4. ترحيل Edge Functions

**ترحيل function واحدة:**
```bash
supabase functions deploy execute-trade
supabase functions deploy auto-trader-worker
supabase functions deploy strategy-runner-worker
supabase functions deploy get-candles
supabase functions deploy get-live-prices
supabase functions deploy exchange-portfolio
supabase functions deploy tradingview-webhook
```

**ترحيل جميع Functions مرة واحدة:**
```bash
supabase functions deploy
```

---

### الطريقة 2: استخدام Supabase Dashboard

1. اذهب إلى **Edge Functions** في Supabase Dashboard
2. اضغط **New Function**
3. ارفع ملفات كل function يدوياً

---

## ⚙️ إعداد Environment Variables

لكل Edge Function، يجب إضافة المتغيرات التالية في Supabase Dashboard:

**المتغيرات المطلوبة للجميع:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**المتغيرات الاختيارية:**
```
SUPABASE_ANON_KEY=your-anon-key
```

**كيفية الإضافة:**
1. اذهب إلى Edge Functions في Supabase Dashboard
2. اختر Function
3. اذهب إلى **Settings** > **Environment Variables**
4. أضف المتغيرات

---

## 📅 إعداد Cron Jobs

### 1. auto-trader-worker
```sql
-- Run every 1 minute
SELECT cron.schedule(
  'auto-trader-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### 2. strategy-runner-worker
```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'strategy-runner-15m',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/strategy-runner-worker',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{"timeframe": "15m"}'::jsonb
  );
  $$
);
```

---

## 📋 قائمة التحقق (Checklist)

### قبل الترحيل:
- [ ] ✅ التحقق من أن جميع الملفات موجودة
- [ ] ✅ التحقق من أن `_shared/` موجود
- [ ] ✅ اختبار Functions محلياً (اختياري)

### بعد الترحيل:
- [ ] ✅ إضافة Environment Variables
- [ ] ✅ اختبار كل Function
- [ ] ✅ إعداد Cron Jobs للـ Workers
- [ ] ✅ مراقبة Logs

---

## 🎯 الأولويات حسب الأهمية

### 🔴 أولوية عالية جداً (ترحيل فوراً):
1. **execute-trade** - أساس التطبيق
2. **auto-trader-worker** - التداول التلقائي

### 🟡 أولوية عالية (ترحيل بعد الأساسيات):
3. **strategy-runner-worker** - إنشاء الإشارات
4. **get-candles** - بيانات السوق
5. **get-live-prices** - الأسعار المباشرة
6. **exchange-portfolio** - المحافظ

### 🟢 أولوية متوسطة (ترحيل لاحقاً):
7. **tradingview-webhook** - إشارات TradingView
8. **get-trading-pairs** - أزواج التداول
9. **sync-platform-trades** - المزامنة
10. **admin-users** - الإدارة

---

## 📝 ملاحظات مهمة

1. **الترتيب مهم:** يجب ترحيل `execute-trade` أولاً لأن `auto-trader-worker` يعتمد عليه
2. **Shared Files:** ملفات `_shared/` تُنشر تلقائياً مع كل Function
3. **Environment Variables:** تأكد من إضافة جميع المتغيرات المطلوبة
4. **Cron Jobs:** لا تنسَ إعداد Cron Jobs للـ Workers
5. **Testing:** اختبر كل Function بعد الترحيل

---

## 🔍 اختبار Edge Functions

### اختبار execute-trade:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/execute-trade \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "buy",
    "amount": 100,
    ...
  }'
```

### اختبار auto-trader-worker:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/auto-trader-worker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## 📚 المراجع

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**تاريخ التحديث:** 2025-01-17  
**الإصدار:** 1.0

