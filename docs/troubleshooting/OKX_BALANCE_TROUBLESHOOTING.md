# 🔧 حل مشكلة OKX Balance - لا توجد بيانات

## 🚨 المشكلة

OKX API يعيد `success: true` لكن `balances: []` (مصفوفة فارغة).

## 📋 خطوات التشخيص

### الخطوة 1: فحص قاعدة البيانات

1. افتح **Supabase Dashboard**: https://supabase.com/dashboard/project/pjgfrhgjbbsqsmwfljpg
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `debug/DIAGNOSE_OKX_ISSUE.sql`
4. الصقه في SQL Editor واضغط **Run**

### الخطوة 2: التحقق من API Key

من نتائج SQL، تحقق من:

- ✅ **API Key موجود** (api_key_length > 0)
- ✅ **Secret Key موجود** (secret_key_length > 0)
- ✅ **Passphrase موجود** (passphrase_length > 0) - **مطلوب لـ OKX!**

إذا كان Passphrase مفقوداً:
1. اذهب إلى **API Settings** في التطبيق
2. حدد OKX API Key
3. أضف Passphrase
4. احفظ

### الخطوة 3: فحص Edge Functions Logs

1. في **Supabase Dashboard** → **Edge Functions** → **exchange-portfolio**
2. اضغط **Logs**
3. ابحث عن آخر استدعاء لـ OKX
4. ابحث عن:
   - `🔍 Starting OKX balance fetch...`
   - `📋 OKX API response structure:`
   - `🔍 Full OKX API response (for debugging):`

### الخطوة 4: التحقق من OKX API مباشرة

إذا كان OKX API يعيد بيانات فارغة، قد يكون:

1. **حساب فارغ**: OKX Live account لا يحتوي على أموال
2. **OKX Demo فارغ**: Demo account لا يحتوي على أموال تجريبية
3. **API Key permissions**: API Key قد لا يملك صلاحية قراءة الرصيد

## 🔍 الأسباب المحتملة

### 1. Passphrase مفقود ❌
**الحل:**
- أضف Passphrase في API Settings
- OKX يتطلب Passphrase للاتصال

### 2. حساب OKX فارغ 💰
**الحل:**
- تأكد من وجود رصيد في حساب OKX
- لـ OKX Demo: أضف أموال تجريبية من OKX Demo Trading

### 3. API Key permissions 🔐
**الحل:**
- تأكد من أن API Key لديه صلاحية **Read** للرصيد
- في OKX: Account → API → تأكد من تفعيل "Read" permissions

### 4. Demo Mode header غير موجود 🎭
**الحل:**
- إذا كان `okx-demo`، تأكد من أن `x-simulated-trading: 1` موجود
- تم إصلاح هذا في الكود، لكن تأكد من أن Edge Function محدث

## ✅ الحلول المقترحة

### الحل 1: إعادة إضافة API Key

1. احذف OKX API Key الحالي
2. أضف API Key جديد مع:
   - ✅ API Key
   - ✅ Secret Key
   - ✅ **Passphrase** (مهم!)
   - ✅ Platform: OKX أو OKX Demo
   - ✅ Testnet: true (لـ Demo) أو false (لـ Live)

### الحل 2: التحقق من OKX Dashboard

1. سجل دخول إلى OKX
2. اذهب إلى **Assets** → **Funding Account**
3. تحقق من وجود رصيد
4. لـ Demo: اذهب إلى **Demo Trading** → **Funding**

### الحل 3: اختبار API Key مباشرة

يمكنك اختبار API Key باستخدام curl:

```bash
# لـ OKX Live
curl -X GET "https://www.okx.com/api/v5/account/balance" \
  -H "OK-ACCESS-KEY: YOUR_API_KEY" \
  -H "OK-ACCESS-SIGN: YOUR_SIGNATURE" \
  -H "OK-ACCESS-TIMESTAMP: TIMESTAMP" \
  -H "OK-ACCESS-PASSPHRASE: YOUR_PASSPHRASE"

# لـ OKX Demo (أضف header)
curl -X GET "https://www.okx.com/api/v5/account/balance" \
  -H "OK-ACCESS-KEY: YOUR_API_KEY" \
  -H "OK-ACCESS-SIGN: YOUR_SIGNATURE" \
  -H "OK-ACCESS-TIMESTAMP: TIMESTAMP" \
  -H "OK-ACCESS-PASSPHRASE: YOUR_PASSPHRASE" \
  -H "x-simulated-trading: 1"
```

## 📊 ما يجب البحث عنه في Logs

### في Browser Console:
- `API returned success but no balances for platform: okx`
- `balances: Array(0)`

### في Supabase Edge Functions Logs:
- `📋 OKX API response structure:` - يجب أن يعرض بنية البيانات
- `🔍 Full OKX API response (for debugging):` - يجب أن يعرض الاستجابة الكاملة

### إذا كان OKX API يعيد:
```json
{
  "code": "0",
  "data": []
}
```
هذا يعني أن الحساب فارغ فعلاً.

### إذا كان OKX API يعيد:
```json
{
  "code": "50000",
  "msg": "Invalid API Key"
}
```
هذا يعني أن API Key غير صحيح.

## 🎯 الخطوات التالية

1. ✅ نفّذ `debug/DIAGNOSE_OKX_ISSUE.sql` في SQL Editor
2. ✅ شارك النتائج (خاصة credentials_status)
3. ✅ تحقق من Edge Functions Logs
4. ✅ تأكد من وجود Passphrase
5. ✅ تأكد من وجود رصيد في OKX

---

**ملاحظة:** إذا كان الحساب فارغاً فعلاً، هذا طبيعي. يجب أن تظهر رسالة واضحة في الواجهة.

