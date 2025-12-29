# حل مشاكل API Keys - OKX Demo و Bybit Testnet

## 🔴 المشكلة 1: OKX Demo - Error 50101

### الخطأ:
```
APIKey does not match current environment
```

### السبب:
OKX يتحقق من أن API Key يطابق البيئة (Live أو Demo).

### الحل:

#### الطريقة الصحيحة لـ OKX Demo:

1. **سجل دخول إلى OKX (الحساب الحقيقي)**
2. **فعّل Demo Trading** من الزر في الأعلى
3. **أنشئ API Key جديد** (من الحساب الحقيقي):
   - Profile → API
   - Create API
   - Trade permission ✅
   - Passphrase قوي
4. **في Orbitra AI:**
   - Platform: `OKX Demo Trading`
   - استخدم نفس API Keys من الخطوة 3
   - احفظ

### ملاحظة مهمة:
- ✅ نفس API Keys تعمل لـ Live و Demo
- ✅ الفرق في اختيار Platform في النظام
- ❌ لا تنشئ API keys منفصلة للـ Demo

---

## 🔴 المشكلة 2: Bybit Testnet - Error 401

### الخطأ:
```
Bybit API error: 401
```

### السبب:
- API Key غير صحيح
- أو API Key من Live وليس Testnet

### الحل:

#### إنشاء Bybit Testnet API Key:

1. **اذهب إلى Bybit Testnet:**
   - https://testnet.bybit.com/

2. **سجل دخول أو أنشئ حساب testnet**

3. **أنشئ API Key:**
   - Account → API
   - Create New Key
   - **Permissions:**
     - ✅ Read-Write
     - ✅ Contract Trade
     - ✅ Spot Trade
   - احفظ API Key و Secret

4. **في Orbitra AI:**
   - Platform: `Bybit Testnet`
   - أدخل API Key و Secret من testnet
   - احفظ

### ملاحظة مهمة:
- ❌ Bybit Live API Keys **لا تعمل** على Testnet
- ✅ يجب إنشاء API keys منفصلة من testnet.bybit.com
- ✅ حساب Testnet منفصل تماماً عن Live

---

## 📋 الفرق بين المنصات:

| المنصة | API Keys | الموقع |
|--------|----------|--------|
| **OKX Live** | نفس Keys | okx.com |
| **OKX Demo** | نفس Keys | okx.com (Demo mode) |
| **Bybit Live** | Keys منفصلة | bybit.com |
| **Bybit Testnet** | Keys منفصلة | testnet.bybit.com |

---

## ✅ خطوات التحقق:

### لـ OKX Demo:
1. افتح OKX
2. فعّل Demo Trading
3. تحقق من وجود أموال وهمية
4. استخدم نفس API Keys في Orbitra

### لـ Bybit Testnet:
1. افتح testnet.bybit.com
2. سجل دخول
3. أنشئ API Key جديد
4. استخدمه في Orbitra

---

## 🔧 إذا استمرت المشكلة:

### OKX:
- تأكد من Passphrase صحيح 100%
- تأكد من API Key له صلاحية Trade
- جرب إنشاء API Key جديد

### Bybit:
- تأكد أنك في testnet.bybit.com
- تأكد من Permissions (Contract + Spot)
- جرب API Key جديد

---

**الخلاصة:**
- OKX: نفس Keys، اختر Platform مختلف
- Bybit: Keys منفصلة، مواقع منفصلة
