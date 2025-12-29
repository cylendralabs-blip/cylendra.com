# Binance Demo Trading - دليل شامل ومحدث

## 🔍 المشكلة: Binance غيّرت نظام Testnet

### ما كان (القديم):
- **Spot Testnet**: `testnet.binance.vision`
- **Futures Testnet**: `testnet.binancefuture.com`
- منصتان منفصلتان، مفاتيح منفصلة

### ما أصبح (الجديد - 2024):
- **Demo Trading**: `demo.binance.com`
- نظام موحد لـ Spot + Futures
- مفاتيح موحدة تعمل على الاثنين
- **مشكلة**: الـ API endpoints غير واضحة في الوثائق الرسمية

---

## ❌ لماذا الكود الحالي لا يعمل

**الكود الحالي يستخدم:**
```typescript
// في binance.ts
if (marketType === 'futures') {
  apiUrl = `https://testnet.binancefuture.com/fapi/v2/account?...`;  // ❌ قديم
} else {
  apiUrl = `https://testnet.binance.vision/api/v3/account?...`;       // ❌ قديم
}
```

**المستخدم ينشئ مفتاح من:**
```
demo.binance.com (Demo Trading الجديد)
```

**النتيجة:**
```
401 - Invalid API-key, IP, or permissions for action
```

**السبب:** مفاتيح Demo Trading الجديدة لا تعمل مع Testnet endpoints القديمة!

---

## 🎯 الحلول لمشكلة Binance Demo Trading

### الحل 1: اختبار Endpoints بنفسك (مُوصى به) 🔬

**لماذا؟** لأن Binance لم توضح endpoints الجديدة بالضبط!

**الخطوات:**

1. **أنشئ مفتاح من Demo Trading:**
   - اذهب إلى: https://demo.binance.com
   - سجل دخول
   - اذهب إلى **API Management**
   - أنشئ API Key جديد
   - احفظ: API Key + Secret Key

2. **استخدم سكريبت الاختبار:**
```bash
cd debug
# عدّل test_binance_demo.ts وضع مفاتيحك
deno run --allow-net test_binance_demo.ts
```

3. **السكريبت سيختبر:**
   - ✅ `https://testnet.binance.vision` (Spot القديم)
   - ✅ `https://testnet.binancefuture.com` (Futures القديم)
   - ✅ Endpoints أخرى محتملة

4. **النتيجة المتوقعة:**
   - إذا عمل endpoint: سنحصل على `200 OK` + بيانات الحساب
   - إذا لم يعمل: `401 Invalid API-key`

5. **بعد الاختبار:**
   - سجّل أي endpoint عمل
   - شاركه معي لتحديث الكود

---

### الحل 2: استخدام Binance Live مؤقتاً ⚡

**إذا كنت تريد اختبار فوراً:**

1. افتح [binance.com](https://www.binance.com)
2. **API Management** → Create API Key
3. **الصلاحيات:**
   - ✅ Enable Reading
   - ✅ Enable Spot & Margin Trading
   - ✅ Enable Futures (حسب الحاجة)
   - ❌ IP Whitelist: **اتركها فارغة** (مهم!)

4. في Orbitra AI:
   - Platform: **Binance** (Live)
   - Testnet: **غير مفعّل**
   - الصق API Key + Secret

**⚠️ تحذير مهم:**
- استخدم **مبلغ صغير جداً** (5-10 USDT فقط)
- فعّل **Stop Loss** دائماً
- راقب الصفقات بعناية
- **لا تفعّل Auto Trading** إلا بعد اختبار يدوي كامل

**المميزات:**
- ✅ يعمل فوراً (الكود جاهز)
- ✅ اختبار حقيقي بدون مفاجآت

**العيوب:**
- ❌ رسوم حقيقية (صغيرة)
- ❌ مخاطر (محدودة بالمبلغ)

---

### الحل 3: البحث اليدوي عن Endpoints 🔍

**إذا كان لديك خبرة تقنية:**

**احتمالات Demo Trading endpoints:**

1. **الاحتمال 1:** نفس Testnet القديم لكن authentication مختلف
```
https://testnet.binance.vision (Spot)
https://testnet.binancefuture.com (Futures)
```

2. **الاحتمال 2:** endpoints جديدة تماماً
```
https://demo.binance.com/api/... (محتمل)
https://demoapi.binance.com/... (محتمل)
```

3. **الاحتمال 3:** استخدام Live endpoints مع demo credentials
```
https://api.binance.com (Spot)
https://fapi.binance.com (Futures)
```

**كيفية الاختبار:**
```bash
# مثال: اختبار Spot
timestamp=$(date +%s000)
query="timestamp=$timestamp&recvWindow=60000"
signature=$(echo -n "$query" | openssl dgst -sha256 -hmac "YOUR_SECRET" | cut -d' ' -f2)

curl "https://testnet.binance.vision/api/v3/account?$query&signature=$signature" \
  -H "X-MBX-APIKEY: YOUR_API_KEY"
```

---

### الحل 4: تحديث الكود (بعد اكتشاف Endpoints) 🔧

**يحتاج:**
1. بحث Binance Demo Trading API endpoints
2. اختبار يدوي
3. تحديث الكود
4. اختبار شامل

**الوقت المتوقع:** 2-3 ساعات

---

## 📝 معلومات إضافية

### Demo Trading vs Live

| الميزة | Live | Demo Trading |
|--------|------|--------------|
| الرصيد | حقيقي | وهمي |
| الرسوم | حقيقية | لا يوجد |
| المخاطر | نعم | لا |
| الاختبار | محدود | غير محدود |
| API Keys | صالحة دائماً | قد تنتهي |

### تحذيرات

**عند استخدام Binance Live:**
- ⚠️ استخدم مبلغ صغير (5-20 USDT)
- ⚠️ فعّل Stop Loss
- ⚠️ راقب الصفقات
- ⚠️ لا تفعّل Auto Trading مباشرة

**عند استخدام Demo:**
- ✅ اختبر كل شيء
- ✅ تأكد من المنطق
- ✅ راجع الأرباح/الخسائر
- ⚠️ النتائج قد تختلف عن Live

---

## 🚀 التوصية

**للاختبار الآن:**
1. استخدم **OKX Demo** (الأسهل والأفضل)
2. أو **Bybit Testnet**
3. أو **Binance Live** بمبلغ صغير

**للمستقبل:**
- انتظر تحديث الكود لدعم Binance Demo Trading
- أو استمر مع OKX Demo (يعمل ممتاز)

---

## 📚 مصادر

- [Binance Demo Trading Guide](https://www.binance.com/en/support/faq/how-to-use-binance-demo-trading-9be58f73e5e14338809e3b705b9687dd)
- [OKX Demo Trading](https://www.okx.com/demo-trading)
- [Bybit Testnet](https://testnet.bybit.com)

---

**تحديث:** 10 ديسمبر 2025  
**الحالة:** Binance Testnet القديم غير مدعوم حالياً
