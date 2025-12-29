# دليل نشر NeuroTrade AI على Netlify

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نشر مشروع NeuroTrade AI على Netlify خطوة بخطوة.

---

## ✅ المتطلبات الأساسية

1. ✅ حساب Netlify (مجاني)
2. ✅ مشروع منشور على GitHub: `https://github.com/cylendra-info/NeuroTradeAI`
3. ✅ مشروع Supabase جاهز
4. ✅ معرفة بـ Supabase URL و Anon Key

---

## 🚀 خطوات النشر على Netlify

### الخطوة 1: إعداد Netlify Site

1. اذهب إلى [app.netlify.com](https://app.netlify.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط **"Add new site"** > **"Import an existing project"**
4. اختر **GitHub** واذهب إلى المستودع: `cylendra-info/NeuroTradeAI`

---

### الخطوة 2: إعدادات البناء (Build Settings)

في صفحة **"Configure site"** في Netlify، استخدم الإعدادات التالية:

#### إعدادات أساسية:
- **Branch to deploy:** `main`
- **Base directory:** _(اتركه فارغاً)_
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`

#### ملاحظة:
ملف `netlify.toml` موجود بالفعل ويحتوي على هذه الإعدادات. Netlify سيستخدمها تلقائياً.

---

### الخطوة 3: إضافة متغيرات البيئة (Environment Variables)

⚠️ **هذه الخطوة ضرورية جداً!**

#### 3.1 قبل النشر الأول:

بعد الضغط على **"Deploy site"**، اذهب إلى:
**Site settings** > **Environment variables** > **Add variable**

#### 3.2 المتغيرات المطلوبة (Required):

أضف المتغيرات التالية:

```env
VITE_SUPABASE_URL=https://pjgfrhgjbbsqsmwfljpg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxMjMsImV4cCI6MjA4MDgwMTEyM30.sA925bnHvb3RP4b2RYyUDj73icuDUtIlRFXc1AcQ7Uw
```

#### 3.3 المتغيرات الاختيارية (Optional):

```env
# إعدادات التطبيق
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0

# إعدادات التداول
VITE_DEFAULT_PLATFORM=binance
VITE_ENABLE_TESTNET=false

# Feature Flags
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_AI_FEATURES=false
VITE_ENABLE_TRADINGVIEW=true

# إعدادات التطوير (اختياري)
VITE_DEBUG=false
VITE_LOG_LEVEL=info
```

---

### الخطوة 4: إعداد Supabase للإنتاج

#### 4.1 في Supabase Dashboard:

1. اذهب إلى **Settings** > **API**
2. أضف URL موقع Netlify إلى **"Site URL"**:
   ```
   https://your-app-name.netlify.app
   ```
3. أضف URL موقع Netlify إلى **"Redirect URLs"**:
   ```
   https://your-app-name.netlify.app/**
   https://your-app-name.netlify.app/auth/callback
   ```

#### 4.2 في Authentication Settings:

1. اذهب إلى **Authentication** > **URL Configuration**
2. تأكد من إضافة:
   - **Site URL:** `https://your-app-name.netlify.app`
   - **Redirect URLs:** `https://your-app-name.netlify.app/**`

---

### الخطوة 5: النشر والاختبار

#### 5.1 النشر:

1. بعد إضافة المتغيرات البيئية، اضغط **"Save"**
2. اذهب إلى **Deploys** tab
3. اضغط **"Trigger deploy"** > **"Deploy site"**
4. انتظر حتى يكتمل البناء (عادة 2-3 دقائق)

#### 5.2 الاختبار:

بعد اكتمال النشر:
1. ✅ تحقق من أن الموقع يعمل: `https://your-app-name.netlify.app`
2. ✅ اختبر تسجيل الدخول
3. ✅ اختبر التنقل بين الصفحات
4. ✅ تحقق من أن Supabase يعمل بشكل صحيح

---

## 🔧 إعدادات إضافية (Optional)

### تخصيص اسم الموقع (Custom Domain):

1. في Netlify Dashboard، اذهب إلى **Domain settings**
2. اضغط **"Add custom domain"**
3. اتبع التعليمات لإضافة الدومين الخاص بك

### إعدادات الأمان (Security Headers):

ملف `netlify.toml` يحتوي بالفعل على:
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `X-Content-Type-Options: nosniff`
- وغيرها...

### تحسين الأداء (Performance):

ملف `netlify.toml` يحتوي على:
- Cache headers للملفات الثابتة
- Redirects للـ SPA routing

---

## 📝 ملخص المتغيرات البيئية

### ✅ مطلوبة (Required):

| المتغير | الوصف | المثال |
|---------|-------|--------|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon Key من Supabase | `eyJhbGc...` |

### ⚙️ اختيارية (Optional):

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|-------------------|
| `VITE_APP_ENV` | بيئة التطبيق | `production` |
| `VITE_DEFAULT_PLATFORM` | المنصة الافتراضية | `binance` |
| `VITE_ENABLE_TESTNET` | تفعيل Testnet | `false` |
| `VITE_ENABLE_ADVANCED_ANALYTICS` | تفعيل التحليلات | `true` |

---

## 🐛 استكشاف الأخطاء

### المشكلة: الموقع لا يعمل بعد النشر

**الحل:**
1. تحقق من **Deploy logs** في Netlify
2. تأكد من إضافة جميع المتغيرات البيئية المطلوبة
3. تحقق من أن `Build command` و `Publish directory` صحيحة

### المشكلة: Supabase لا يعمل

**الحل:**
1. تحقق من أن `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` موجودة
2. تأكد من إضافة URL الموقع إلى Supabase Redirect URLs
3. راجع Console في المتصفح للأخطاء

### المشكلة: الصفحات لا تعمل (404)

**الحل:**
1. تأكد من وجود ملف `netlify.toml` مع redirects صحيحة
2. تحقق من أن `Publish directory` هي `dist`

---

## 📚 المراجع

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ قائمة التحقق (Checklist)

قبل النشر، تأكد من:

- [ ] ✅ ربط المشروع بـ GitHub
- [ ] ✅ إضافة `VITE_SUPABASE_URL` إلى Netlify Environment Variables
- [ ] ✅ إضافة `VITE_SUPABASE_ANON_KEY` إلى Netlify Environment Variables
- [ ] ✅ إضافة Netlify URL إلى Supabase Site URL
- [ ] ✅ إضافة Netlify URL إلى Supabase Redirect URLs
- [ ] ✅ اختبار الموقع بعد النشر
- [ ] ✅ اختبار تسجيل الدخول
- [ ] ✅ اختبار جميع الصفحات الرئيسية

---

**تاريخ التحديث:** 2025  
**الإصدار:** 1.0

