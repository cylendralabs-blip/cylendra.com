# ✅ التحقق من API Key في OKX

## 🔍 خطوات التحقق

### 1. التحقق من API Key في OKX Dashboard

1. **سجل الدخول إلى OKX:**
   - اذهب إلى: https://www.okx.com
   - سجل الدخول إلى حسابك

2. **افتح إعدادات API:**
   - اذهب إلى: **Account** → **API** → **API Management**
   - أو: **Settings** → **API**

3. **تحقق من API Key:**
   - ✅ **API Key**: يجب أن يطابق ما أدخلته في Orbitra AI
   - ✅ **Secret Key**: يجب أن يطابق ما أدخلته (يظهر مرة واحدة فقط عند الإنشاء)
   - ✅ **Passphrase**: يجب أن يطابق ما أدخلته (يظهر مرة واحدة فقط)

### 2. التحقق من الصلاحيات (Permissions)

**يجب أن يكون API Key لديه:**
- ✅ **Read** (قراءة) - مطلوب لجلب الرصيد
- ✅ **Trade** (تداول) - مطلوب للتنفيذ
- ❌ **Withdraw** (سحب) - **لا تفعله أبداً** (لأمانك)

### 3. التحقق من IP Whitelist

- إذا كان API Key لديه **IP Whitelist** مفعل:
  - يجب إضافة IP الخاص بـ Supabase Edge Functions
  - أو تعطيل IP Whitelist مؤقتاً للاختبار

### 4. التحقق من Passphrase

**مهم جداً:**
- Passphrase هو **كلمة مرور** أنشأتها عند إنشاء API Key
- **ليس** كلمة مرور حسابك في OKX
- Passphrase يظهر **مرة واحدة فقط** عند إنشاء API Key
- إذا نسيت Passphrase، يجب **حذف API Key وإنشاء واحد جديد**

### 5. التحقق من نوع الحساب

- **Live Account**: يجب أن يكون API Key من حساب Live
- **Demo Account**: يجب أن يكون API Key من حساب Demo (مع `x-simulated-trading` header)

---

## 🧪 اختبار API Key مباشرة

### استخدام OKX API Documentation

1. اذهب إلى: https://www.okx.com/docs-v5/en/#rest-api
2. جرب **Account Balance** endpoint:
   - Endpoint: `GET /api/v5/account/balance`
   - استخدم Postman أو curl لاختبار API Key

### مثال باستخدام curl:

```bash
# احصل على timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# أنشئ message للتوقيع
METHOD="GET"
REQUEST_PATH="/api/v5/account/balance"
BODY=""
MESSAGE="${TIMESTAMP}${METHOD}${REQUEST_PATH}${BODY}"

# أنشئ signature (HMAC SHA256 Base64)
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$SECRET_KEY" -binary | base64)

# أرسل الطلب
curl -X GET "https://www.okx.com/api/v5/account/balance" \
  -H "OK-ACCESS-KEY: $API_KEY" \
  -H "OK-ACCESS-SIGN: $SIGNATURE" \
  -H "OK-ACCESS-TIMESTAMP: $TIMESTAMP" \
  -H "OK-ACCESS-PASSPHRASE: $PASSPHRASE" \
  -H "Content-Type: application/json"
```

---

## ❌ الأخطاء الشائعة

### 1. "Invalid Sign" (50113)
**الأسباب المحتملة:**
- Secret Key غير صحيح
- Passphrase غير صحيح
- Timestamp غير متزامن
- Message للتوقيع غير صحيح

**الحل:**
- تأكد من Secret Key و Passphrase صحيحين
- تأكد من أن الساعة متزامنة

### 2. "Request header OK-ACCESS-PASSPHRASE incorrect" (50105)
**الأسباب المحتملة:**
- Passphrase غير صحيح
- Passphrase يحتوي على مسافات زائدة

**الحل:**
- انسخ Passphrase كما هو (بدون مسافات)
- تأكد من أن Passphrase صحيح

### 3. "Invalid API Key" (50000)
**الأسباب المحتملة:**
- API Key غير صحيح
- API Key منتهي الصلاحية
- API Key محذوف

**الحل:**
- أنشئ API Key جديد

---

## ✅ Checklist

قبل إضافة API Key في Orbitra AI:

- [ ] API Key صحيح (من OKX Dashboard)
- [ ] Secret Key صحيح (نسخته عند الإنشاء)
- [ ] Passphrase صحيح (نسخته عند الإنشاء)
- [ ] API Key لديه صلاحيات Read و Trade
- [ ] API Key نشط (لم يتم حذفه)
- [ ] IP Whitelist معطل أو IP مضاف
- [ ] الساعة متزامنة

---

## 🔄 إذا استمرت المشكلة

1. **احذف API Key الحالي** من Orbitra AI
2. **احذف API Key** من OKX Dashboard
3. **أنشئ API Key جديد** في OKX:
   - تأكد من نسخ **Secret Key** و **Passphrase** فوراً
   - لا تغلق الصفحة قبل النسخ!
4. **أضف API Key الجديد** في Orbitra AI

---

## 📞 دعم OKX

إذا استمرت المشكلة بعد التحقق من كل شيء:
- تواصل مع دعم OKX: https://www.okx.com/support
- أو راجع التوثيق: https://www.okx.com/docs-v5/en/

