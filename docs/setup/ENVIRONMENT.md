# Environment Variables Documentation

## نظرة عامة

هذا الملف يوثق جميع متغيرات البيئة المستخدمة في مشروع NeuroTrade AI.

---

## المتغيرات المطلوبة (Required)

### Frontend Variables

#### `VITE_SUPABASE_URL`
- **الوصف**: رابط مشروع Supabase
- **المثال**: `https://your-project.supabase.co`
- **المصدر**: Supabase Dashboard > Settings > API > Project URL
- **المطلوب**: ✅ نعم

#### `VITE_SUPABASE_ANON_KEY`
- **الوصف**: المفتاح العام (Anon Key) من Supabase - آمن للاستخدام في Frontend
- **المثال**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **المصدر**: Supabase Dashboard > Settings > API > anon/public key
- **المطلوب**: ✅ نعم

---

## متغيرات Edge Functions (Backend)

⚠️ **ملاحظة مهمة**: هذه المتغيرات يتم تعيينها تلقائياً في Supabase ولا تحتاج لإضافتها في `.env`

### `SUPABASE_URL`
- **الوصف**: رابط مشروع Supabase (للـ Edge Functions)
- **يتم تعيينه**: تلقائياً في Supabase
- **المطلوب**: ✅ نعم (في Supabase)

### `SUPABASE_SERVICE_ROLE_KEY`
- **الوصف**: Service Role Key - سري جداً ويستخدم فقط في Edge Functions
- **⚠️ تحذير**: لا تشارك هذا المفتاح أبداً
- **يتم تعيينه**: تلقائياً في Supabase
- **المطلوب**: ✅ نعم (في Supabase)

---

## المتغيرات الاختيارية (Optional)

### Application Configuration

#### `VITE_APP_ENV`
- **الوصف**: بيئة التطبيق (development | production)
- **القيمة الافتراضية**: `development`
- **القيم المتاحة**: `development`, `production`, `staging`

#### `VITE_APP_VERSION`
- **الوصف**: نسخة التطبيق
- **القيمة الافتراضية**: `1.0.0`

### Trading Configuration

#### `VITE_DEFAULT_PLATFORM`
- **الوصف**: المنصة الافتراضية للتداول
- **القيمة الافتراضية**: `binance`
- **القيم المتاحة**: `binance`, `okx`, `bybit`, `kucoin`

#### `VITE_ENABLE_TESTNET`
- **الوصف**: تفعيل Testnet بشكل افتراضي
- **النوع**: boolean
- **القيمة الافتراضية**: `false`

### Feature Flags

#### `VITE_ENABLE_ADVANCED_ANALYTICS`
- **الوصف**: تفعيل التحليلات المتقدمة
- **النوع**: boolean
- **القيمة الافتراضية**: `true`

#### `VITE_ENABLE_AI_FEATURES`
- **الوصف**: تفعيل ميزات الذكاء الاصطناعي
- **النوع**: boolean
- **القيمة الافتراضية**: `false`

#### `VITE_ENABLE_TRADINGVIEW`
- **الوصف**: تفعيل تكامل TradingView
- **النوع**: boolean
- **القيمة الافتراضية**: `true`

### Development Configuration

#### `VITE_DEBUG`
- **الوصف**: تفعيل وضع التصحيح
- **النوع**: boolean
- **القيمة الافتراضية**: `false`

#### `VITE_USE_MOCK_DATA`
- **الوصف**: استخدام بيانات وهمية للاختبار
- **النوع**: boolean
- **القيمة الافتراضية**: `false`
- **⚠️ ملاحظة**: استخدم فقط في التطوير

#### `VITE_LOG_LEVEL`
- **الوصف**: مستوى السجلات (Logging Level)
- **القيمة الافتراضية**: `info`
- **القيم المتاحة**: `debug`, `info`, `warn`, `error`

---

## كيفية الإعداد

### 1. إنشاء ملف .env

```bash
# انسخ الملف المثال
cp .env.example .env
```

### 2. أكمل المتغيرات المطلوبة

افتح `.env` وأكمل:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. تحقق من الإعدادات

```bash
# تحقق من أن الملف موجود
cat .env

# تحقق من أن المتغيرات تم تحميلها
npm run dev
```

---

## الأمان

### ✅ الممارسات الجيدة:

1. **أضف `.env` إلى `.gitignore`**
   ```
   .env
   .env.local
   .env.*.local
   ```

2. **لا تشارك مفاتيح Supabase أبداً**
   - خاصة `SUPABASE_SERVICE_ROLE_KEY`

3. **استخدم `VITE_` prefix فقط للمتغيرات الآمنة**
   - جميع متغيرات `VITE_` متاحة في Frontend
   - لا تضع أي secrets في متغيرات `VITE_`

4. **استخدم Supabase Secrets للبيانات الحساسة**
   - Edge Functions تستخدم Supabase Secrets
   - لا حاجة لإضافة secrets في `.env`

---

## استكشاف الأخطاء

### المشكلة: المتغيرات لا تعمل

**الحل:**
1. تأكد من أن الملف `.env` موجود في جذر المشروع
2. تأكد من أن المتغيرات تبدأ بـ `VITE_`
3. أعد تشغيل الخادم: `npm run dev`
4. تحقق من أن الملف غير في `.gitignore`

### المشكلة: Edge Functions لا تعمل

**الحل:**
1. تحقق من Supabase Dashboard > Edge Functions > Settings
2. تأكد من تعيين `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`
3. راجع logs في Supabase Dashboard

---

## المراجع

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Supabase API Keys](https://supabase.com/docs/guides/api/rest/authentication)

---

**تاريخ التحديث**: 2024  
**الإصدار**: 1.0


