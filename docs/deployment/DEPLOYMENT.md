
# دليل نشر المشروع على Netlify

## المتطلبات الأساسية

1. حساب Netlify مجاني
2. مشروع منشور على GitHub
3. إعدادات Supabase للإنتاج

## خطوات النشر

### 1. ربط المشروع بـ GitHub

```bash
git add .
git commit -m "Add Netlify deployment configuration"
git push origin main
```

### 2. إنشاء موقع جديد على Netlify

1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط "New site from Git"
4. اختر GitHub واختر المستودع الخاص بك
5. أضف إعدادات البناء:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. إضافة متغيرات البيئة

في لوحة تحكم Netlify، اذهب إلى Site settings > Environment variables وأضف:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. إعداد Supabase للإنتاج

في لوحة تحكم Supabase:

1. اذهب إلى Settings > API
2. أضف URL موقع Netlify إلى "Site URL"
3. أضف URL موقع Netlify إلى "Redirect URLs"

مثال:
```
Site URL: https://your-app-name.netlify.app
Redirect URLs: https://your-app-name.netlify.app/**
```

### 5. إعداد Authentication

في Supabase Authentication settings:

1. أضف Provider settings إذا كنت تستخدم OAuth
2. تأكد من أن "Email confirmations" مفعلة
3. تحديث "Email templates" حسب الحاجة

### 6. اختبار النشر

1. ادفع تغييراتك إلى GitHub
2. Netlify سيبني ويرفع الموقع تلقائياً
3. اختبر جميع الوظائف على الموقع المباشر

## نصائح مهمة

### أمان قاعدة البيانات

تأكد من إعداد Row Level Security (RLS) لجميع الجداول:

```sql
-- مثال على تفعيل RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة أمان
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
```

### تحسين الأداء

1. تأكد من أن جميع الصور محسنة
2. استخدم lazy loading للمكونات الكبيرة
3. فعل caching للبيانات المناسبة

### مراقبة الأخطاء

1. راقب console logs في المتصفح
2. استخدم Netlify Analytics لمراقبة الأداء
3. اختبر على أجهزة مختلفة

## استكشاف الأخطاء

### مشاكل شائعة:

1. **Build failures**: تحقق من dependencies في package.json
2. **404 errors**: تأكد من إعداد redirects في netlify.toml
3. **Environment variables**: تأكد من أن جميع المتغيرات مضافة في Netlify
4. **CORS errors**: تحقق من إعدادات Supabase URLs

### رسائل خطأ مفيدة:

- `Failed to fetch`: مشكلة في إعدادات CORS أو URL
- `Invalid API key`: تحقق من VITE_SUPABASE_ANON_KEY
- `403 Forbidden`: مشكلة في أذونات قاعدة البيانات

## الصيانة

### تحديثات منتظمة:

1. راقب أداء الموقع
2. حدث dependencies بانتظام
3. راجع security logs في Supabase
4. اختبر backup و restore procedures

### النسخ الاحتياطي:

1. صدر قاعدة البيانات بانتظام
2. احتفظ بنسخة من environment variables
3. وثق جميع التغييرات المهمة

## خطوات ما بعد النشر

1. اختبر جميع الوظائف
2. راقب performance metrics
3. إعداد monitoring alerts
4. وثق URL الموقع المباشر
5. شارك الموقع مع المستخدمين للاختبار

للمساعدة أو الاستفسارات، راجع:
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
