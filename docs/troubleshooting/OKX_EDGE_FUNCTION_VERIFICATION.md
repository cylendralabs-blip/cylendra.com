# 🔍 التحقق من Edge Function لـ OKX

## 📋 خطوات التحقق

### 1. التحقق من أن Edge Function محدثة

**في Supabase Dashboard:**
1. اذهب إلى: **Edge Functions** → **exchange-portfolio**
2. اضغط **View Code** أو **Edit**
3. تحقق من أن الكود يحتوي على:
   - `getOKXBalances` function
   - `buildOKXHeaders` function مع `x-simulated-trading` header
   - Logging شامل

### 2. فحص Edge Functions Logs

**في Supabase Dashboard:**
1. اذهب إلى: **Edge Functions** → **exchange-portfolio** → **Logs**
2. ابحث عن آخر استدعاء لـ OKX
3. ابحث عن هذه الرسائل:

```
🔍 Starting OKX balance fetch...
📡 Making OKX API request...
📥 OKX API response status: 200
📋 OKX API response structure: { code: "0", hasData: true, dataLength: 1 }
🔍 Full OKX API response (for debugging): { ... }
```

### 3. ما يجب البحث عنه في Logs

#### ✅ إذا كان OKX API يعيد بيانات:
```
📊 Processing OKX account data, number of accounts: 1
💰 OKX balance item: { ccy: "USDT", total: 1000, available: 1000, inOrder: 0 }
✅ OKX balances normalized: 1 items
```

#### ❌ إذا كان OKX API يعيد بيانات فارغة:
```
⚠️ OKX API returned no data or empty data array
📋 Full OKX API response (for debugging): { code: "0", data: [] }
⚠️ No balances found - this may indicate an empty account or API issue
```

#### ❌ إذا كان هناك خطأ في API:
```
❌ OKX API error: 50000 Invalid API Key
```
أو
```
❌ OKX API HTTP error: { status: 401, errorText: "..." }
```

### 4. التحقق من الملفات المستخدمة

**المسار الصحيح:**
```
Frontend:
  src/components/bot-settings/CapitalSettings.tsx
    → useBinanceCapital hook
      → supabase.functions.invoke('exchange-portfolio', { action: 'get_balance' })

Edge Function:
  supabase/functions/exchange-portfolio/index.ts
    → getBalance handler
      → platforms/okx.ts → getOKXBalances()
```

### 5. إعادة نشر Edge Function (إذا لزم الأمر)

```bash
cd "E:\Orbitra AI"
supabase functions deploy exchange-portfolio
```

### 6. التحقق من أن التغييرات تم نشرها

بعد النشر:
1. افتح **Edge Functions** → **exchange-portfolio** → **Logs**
2. قم بطلب جديد من الواجهة
3. تحقق من أن Logs تحتوي على الرسائل الجديدة (مثل `🔍 Starting OKX balance fetch...`)

---

## 🎯 الخطوات التالية

1. ✅ فحص Edge Functions Logs
2. ✅ التحقق من أن Edge Function محدثة
3. ✅ إعادة نشر Edge Function إذا لزم الأمر
4. ✅ مشاركة Logs للتحليل

