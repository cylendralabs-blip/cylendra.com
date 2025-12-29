# 🔍 أدوات تشخيص OKX

## 📋 الملفات المتاحة

### 1. `FIXED_DIAGNOSE_OKX_ISSUE.sql` ✅ (مصحح)
**الوصف:** فحص شامل لـ OKX في قاعدة البيانات (مصحح من جميع الأخطاء)

**الاستخدام:**
1. افتح Supabase Dashboard → SQL Editor
2. انسخ محتوى الملف
3. نفذ الاستعلام
4. راجع النتائج

**ما يفحصه:**
- ✅ API Keys لـ OKX (مع التحقق من Passphrase)
- ✅ Portfolio Balances
- ✅ Connection Status
- ✅ إحصائيات شاملة
- ✅ آخر محاولات جلب الرصيد

---

### 2. `check_okx_data.sql` ✅ (مصحح)
**الوصف:** فحص سريع لبيانات OKX

**الاستخدام:** نفس الخطوات أعلاه

---

### 3. `test_okx_api_directly.sql`
**الوصف:** فحص API Keys و Portfolio Balances فقط

**الاستخدام:** نفس الخطوات أعلاه

---

## 🎯 الخطوات التالية

### 1. فحص قاعدة البيانات
نفذ `FIXED_DIAGNOSE_OKX_ISSUE.sql` في Supabase SQL Editor

### 2. فحص Edge Functions Logs ⭐ (الأهم!)
1. افتح: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg
2. اذهب إلى: **Edge Functions** → **exchange-portfolio** → **Logs**
3. ابحث عن آخر استدعاء لـ OKX (عند الضغط على "تحديث" في الواجهة)
4. ابحث عن هذه الرسائل:

```
🔍 Starting OKX balance fetch...
📡 Making OKX API request...
📋 OKX API response structure: { ... }
🔍 Full OKX API response (for debugging): { ... }
```

### 3. التحقق من Edge Function Code
1. **Edge Functions** → **exchange-portfolio** → **View Code**
2. تحقق من وجود ملف `platforms/okx.ts`
3. تحقق من وجود `getOKXBalances` مع logging شامل

### 4. إعادة نشر Edge Function (إذا لزم الأمر)
```bash
cd "E:\Orbitra AI"
supabase functions deploy exchange-portfolio
```

---

## 📊 ما يجب البحث عنه في Logs

### ✅ إذا كان OKX API يعيد بيانات:
```
📊 Processing OKX account data, number of accounts: 1
💰 OKX balance item: { ccy: "USDT", total: 1000, ... }
✅ OKX balances normalized: 1 items
```

### ❌ إذا كان OKX API يعيد بيانات فارغة:
```
⚠️ OKX API returned no data or empty data array
📋 Full OKX API response (for debugging): { "code": "0", "data": [] }
⚠️ No balances found - this may indicate an empty account or API issue
```

**هذا يعني:** حساب OKX فارغ فعلاً (طبيعي) أو API Key لا يملك صلاحيات قراءة الرصيد

### ❌ إذا كان هناك خطأ:
```
❌ OKX API error: 50000 Invalid API Key
```

**هذا يعني:** API Key غير صحيح أو منتهي الصلاحية

---

## 🔧 الملفات المصححة

- ✅ `check_okx_data.sql` - تم إصلاح `at.symbol` → `at.pair`
- ✅ `FIXED_DIAGNOSE_OKX_ISSUE.sql` - ملف جديد مصحح بالكامل

---

## 💡 ملاحظات مهمة

1. **Edge Functions Logs هي المفتاح** - إذا لم تكن تظهر رسائل logging مفصلة، قد يكون Edge Function قديم
2. **OKX Demo قد يكون فارغاً** - هذا طبيعي إذا لم تقم بإضافة رصيد محاكي
3. **API Key Permissions** - تأكد من أن API Key لديه صلاحيات قراءة الرصيد (Read-only)

