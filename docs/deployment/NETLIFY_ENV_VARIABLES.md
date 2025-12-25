# متغيرات البيئة المطلوبة في Netlify

## 🚨 متغيرات إجبارية (يجب إضافتها)

### 1. VITE_SUPABASE_URL
```
https://pjgfrhgjbbsqsmwfljpg.supabase.co
```
**الوصف:** رابط مشروع Supabase  
**المصدر:** Supabase Dashboard > Settings > API > Project URL

---

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxMjMsImV4cCI6MjA4MDgwMTEyM30.sA925bnHvb3RP4b2RYyUDj73icuDUtIlRFXc1AcQ7Uw
```
**الوصف:** Anon Key من Supabase (آمن للاستخدام في Frontend)  
**المصدر:** Supabase Dashboard > Settings > API > anon/public key

---

## ⚙️ متغيرات اختيارية (يمكن إضافتها لاحقاً)

### إعدادات التطبيق:
```
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### إعدادات التداول:
```
VITE_DEFAULT_PLATFORM=binance
VITE_ENABLE_TESTNET=false
```

### Feature Flags:
```
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_AI_FEATURES=false
VITE_ENABLE_TRADINGVIEW=true
```

---

## 📝 كيفية الإضافة في Netlify

1. بعد إنشاء الموقع، اذهب إلى **Site settings**
2. اختر **Environment variables** من القائمة الجانبية
3. اضغط **Add variable**
4. أضف كل متغير بشكل منفصل:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://pjgfrhgjbbsqsmwfljpg.supabase.co`
   - **Scope:** اختر `All scopes` أو `Production`
5. كرر العملية لجميع المتغيرات
6. اضغط **Save** بعد إضافة جميع المتغيرات

---

## ⚠️ ملاحظات مهمة

1. **لا تضع مسافات** قبل أو بعد القيم
2. **لا تستخدم علامات اقتباس** حول القيم
3. بعد إضافة المتغيرات، **أعد نشر الموقع** (Trigger deploy)
4. المتغيرات التي تبدأ بـ `VITE_` فقط متاحة في Frontend

---

## ✅ التحقق من الإعدادات

بعد النشر، افتح Console في المتصفح وتحقق من:
- ✅ لا توجد أخطاء Supabase
- ✅ الموقع يعمل بشكل صحيح
- ✅ تسجيل الدخول يعمل

