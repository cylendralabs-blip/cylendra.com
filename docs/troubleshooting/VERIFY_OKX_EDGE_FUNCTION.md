# ✅ التحقق من Edge Function لـ OKX

## 🎯 الهدف

التأكد من أن Edge Function `exchange-portfolio` محدثة وتستخدم الكود الصحيح لـ OKX.

## 📋 خطوات التحقق

### الخطوة 1: فحص Edge Function Code

**في Supabase Dashboard:**
1. اذهب إلى: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg
2. **Edge Functions** → **exchange-portfolio**
3. اضغط **View Code** أو **Edit**
4. ابحث عن ملف `platforms/okx.ts`
5. تحقق من وجود هذه الأسطر:

```typescript
// يجب أن يحتوي على:
export async function getOKXBalances(apiKey: any) {
  const isDemo = apiKey.platform === 'okx-demo' || apiKey.testnet === true;
  // ...
  if (isDemo) {
    headers['x-simulated-trading'] = '1';
  }
  // ...
  console.log('🔍 Starting OKX balance fetch...');
  // ...
  console.log('📋 OKX API response structure:', { ... });
  // ...
  if (!data.data || data.data.length === 0) {
    console.log('🔍 Full OKX API response (for debugging):', JSON.stringify(data, null, 2));
  }
}
```

### الخطوة 2: فحص Edge Functions Logs

**في Supabase Dashboard:**
1. **Edge Functions** → **exchange-portfolio** → **Logs**
2. ابحث عن آخر استدعاء (عند الضغط على "تحديث" في الواجهة)
3. ابحث عن هذه الرسائل:

#### ✅ إذا كان الكود محدث:
```
🔍 Starting OKX balance fetch...
📡 Making OKX API request...
📋 OKX API response structure: { code: "0", hasData: true, ... }
```

#### ❌ إذا كان الكود قديم:
```
Fetching OKX balances...
OKX API response: ...
```
(بدون emojis أو logging مفصل)

### الخطوة 3: إعادة نشر Edge Function (إذا لزم الأمر)

إذا كان الكود قديم، يجب إعادة نشره:

```bash
cd "E:\Orbitra AI"
supabase functions deploy exchange-portfolio
```

**أو من Supabase Dashboard:**
1. **Edge Functions** → **exchange-portfolio**
2. اضغط **Deploy** أو **Update**
3. تأكد من أن الكود محدث

### الخطوة 4: التحقق من الملفات المحلية

**في المشروع المحلي:**
```
supabase/functions/exchange-portfolio/
├── index.ts                    ← يجب أن يستدعي getBalance
├── handlers/
│   └── balance.ts              ← يجب أن يستدعي getOKXBalances
└── platforms/
    └── okx.ts                  ← يجب أن يحتوي على getOKXBalances مع logging
```

**تحقق من:**
1. `supabase/functions/exchange-portfolio/platforms/okx.ts` - يجب أن يحتوي على `getOKXBalances` مع logging شامل
2. `supabase/functions/exchange-portfolio/handlers/balance.ts` - يجب أن يستدعي `getOKXBalances(apiKeyData)`

### الخطوة 5: اختبار مباشر

بعد إعادة النشر:
1. افتح الواجهة
2. اختر OKX
3. اضغط "تحديث"
4. افتح **Edge Functions Logs**
5. تحقق من وجود الرسائل الجديدة

---

## 🔍 ما يجب البحث عنه في Logs

### إذا كان OKX API يعيد بيانات فارغة:
```
⚠️ OKX API returned no data or empty data array
📋 Full OKX API response (for debugging): { "code": "0", "data": [] }
```

**هذا يعني:** حساب OKX فارغ فعلاً (طبيعي)

### إذا كان OKX API يعيد بيانات:
```
📊 Processing OKX account data, number of accounts: 1
💰 OKX balance item: { ccy: "USDT", total: 1000, ... }
✅ OKX balances normalized: 1 items
```

**هذا يعني:** OKX API يعيد بيانات، لكن قد تكون في تنسيق مختلف

### إذا كان هناك خطأ:
```
❌ OKX API error: 50000 Invalid API Key
```

**هذا يعني:** API Key غير صحيح

---

## ✅ Checklist

- [ ] Edge Function Code محدث (يحتوي على logging شامل)
- [ ] Edge Functions Logs تظهر الرسائل الجديدة
- [ ] تم إعادة نشر Edge Function إذا لزم الأمر
- [ ] الملفات المحلية محدثة
- [ ] تم اختبار الواجهة بعد النشر

