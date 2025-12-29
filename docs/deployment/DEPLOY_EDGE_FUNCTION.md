# إعادة نشر Edge Function: exchange-portfolio

## المشكلة
الأخطاء الحالية في Console تشير إلى أن Edge Function `exchange-portfolio` لا يزال يحتوي على إعدادات CORS القديمة.

## الحل
تم إصلاح الكود في GitHub، لكن يجب إعادة نشر Edge Function على Supabase.

## خطوات إعادة النشر

### الطريقة 1: استخدام Supabase CLI (موصى به)
```bash
# التأكد من أنك في مجلد المشروع
cd "F:\NeuroTrade AI"

# نشر Edge Function
supabase functions deploy exchange-portfolio
```

### الطريقة 2: استخدام Supabase Dashboard
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Edge Functions** من القائمة الجانبية
4. ابحث عن `exchange-portfolio`
5. اضغط على **Deploy** أو **Update**
6. إذا لم يكن موجوداً، اضغط **Create new function** ثم انسخ الكود من `supabase/functions/exchange-portfolio/`

### الطريقة 3: استخدام Supabase CLI مع تحديد المشروع
```bash
# تسجيل الدخول (إذا لم تكن مسجلاً)
supabase login

# ربط المشروع
supabase link --project-ref YOUR_PROJECT_REF

# نشر Edge Function
supabase functions deploy exchange-portfolio
```

## التحقق من النشر
بعد النشر، تحقق من:
1. افتح Console في المتصفح
2. أعد تحميل الصفحة
3. يجب أن تختفي أخطاء CORS
4. يجب أن تعمل طلبات `exchange-portfolio` بنجاح

## ملاحظات
- تأكد من أن متغيرات البيئة (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) مضبوطة في Supabase Dashboard
- قد يستغرق النشر بضع دقائق
- بعد النشر، قد تحتاج إلى مسح الكاش في المتصفح (Ctrl+Shift+R)

---

# نشر Edge Function جديدة: telegram-alert

هذه الوظيفة مسؤولة عن إرسال تنبيهات التليجرام بأمان باستخدام متغير البيئة `TELEGRAM_BOT_TOKEN`.

## خطوات النشر

### 1) عبر Supabase CLI
```bash
cd "F:\NeuroTrade AI"
supabase functions deploy telegram-alert
```

### 2) عبر Supabase Dashboard
1. افتح Supabase Dashboard
2. انتقل إلى **Edge Functions**
3. أنشئ وظيفة جديدة باسم `telegram-alert` أو اخترها إن كانت موجودة
4. الصق الكود من `supabase/functions/telegram-alert/`
5. اضغط **Deploy**

## متغيرات البيئة المطلوبة
- `TELEGRAM_BOT_TOKEN`: توكن البوت الذي سيُستخدم لإرسال الرسائل

يمكن ضبطه من خلال Supabase Dashboard:
1. Database → Settings → **Secrets**
2. أضف المفتاح `TELEGRAM_BOT_TOKEN`
3. إعادة نشر الوظيفة بعد إضافة المتغير

## التحقق
- نفّذ طلب POST إلى `https://<PROJECT>.supabase.co/functions/v1/telegram-alert` مع البيانات:
```json
{
  "chatId": "123456789",
  "title": "Test Alert",
  "body": "Hello from NeuroTrade!",
  "level": "high"
}
```
- يجب أن تستقبل رسالة في التليجرام، وأي أخطاء ستظهر في سجلات الوظيفة

