# OKX Demo Troubleshooting Guide

## المشكلة المحتملة

بناءً على الأعراض، المشكلة الأكثر احتمالاً هي أن `testnet` flag غير مضبوط بشكل صحيح في قاعدة البيانات.

## التشخيص السريع

### 1. افتح Supabase SQL Editor ونفذ:

```sql
SELECT platform, testnet, is_active 
FROM api_keys 
WHERE platform = 'okx-demo';
```

### 2. تحقق من النتيجة:

**✅ الصحيح:**
```
platform: okx-demo
testnet: true    ← يجب أن يكون true
is_active: true
```

**❌ الخطأ:**
```
platform: okx-demo
testnet: false   ← هذه هي المشكلة!
is_active: true
```

## الحل

### إذا كان testnet = false:

نفذ هذا الأمر لإصلاحه:

```sql
UPDATE api_keys 
SET testnet = true 
WHERE platform = 'okx-demo';
```

ثم تحقق مرة أخرى:

```sql
SELECT platform, testnet FROM api_keys WHERE platform = 'okx-demo';
```

يجب أن ترى `testnet: true` الآن.

## لماذا هذا مهم؟

عندما يكون `testnet = true`، الكود يضيف:
```typescript
headers['x-simulated-trading'] = '1';
```

هذا الـ header يخبر OKX أن يستخدم Demo mode.

بدونه، OKX يحاول التداول الحقيقي ويفشل!

## الحل الدائم

عند إضافة API key جديد لـ "OKX Demo Trading"، النظام يجب أن يضبط `testnet = true` تلقائياً.

إذا لم يحدث ذلك، هناك bug في UI. لكن يمكنك إصلاحه يدوياً بالـ SQL أعلاه.

## التحقق النهائي

بعد الإصلاح:

1. احذف أي test trades قديمة
2. أنشئ signal جديد
3. يجب أن يعمل الآن! ✅

## إذا استمرت المشكلة

شارك معي:
1. نتيجة `SELECT platform, testnet FROM api_keys WHERE platform = 'okx-demo';`
2. رسالة الخطأ الكاملة من auto_trade_logs
3. screenshot من OKX Demo Trading

---

**الخلاصة**: تأكد أن `testnet = true` في قاعدة البيانات! 🎯
