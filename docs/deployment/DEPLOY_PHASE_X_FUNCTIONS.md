# نشر Edge Functions الخاصة بـ Phase X

## الأوامر اليدوية

إذا كنت تفضل نشر كل function على حدة، استخدم الأوامر التالية:

### Phase X.5 - AI User Settings

```powershell
supabase functions deploy ai-user-settings
```

### Phase X.7 - AI Indicator Analytics

```powershell
supabase functions deploy ai-indicator-analytics
```

---

## النشر التلقائي (Script)

يمكنك استخدام الـ script المرفق:

```powershell
.\scripts\deploy-phase-x-functions.ps1
```

---

## التحقق من النشر

بعد النشر، يمكنك التحقق من أن الـ functions تعمل:

1. افتح Supabase Dashboard
2. اذهب إلى Edge Functions
3. تحقق من وجود:
   - `ai-user-settings`
   - `ai-indicator-analytics`

---

## ملاحظات مهمة

1. **تأكد من ربط المشروع أولاً:**
   ```powershell
   supabase link --project-ref <your-project-ref>
   ```

2. **تأكد من تشغيل Migrations:**
   ```powershell
   supabase db push
   ```

3. **الـ Functions تحتاج إلى Environment Variables:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   
   (عادة ما تكون موجودة تلقائياً في Supabase)

---

## اختبار الـ Functions

### اختبار ai-user-settings:

```bash
curl -X GET "https://<your-project-ref>.supabase.co/functions/v1/ai-user-settings" \
  -H "Authorization: Bearer <anon-key>"
```

### اختبار ai-indicator-analytics:

```bash
curl -X GET "https://<your-project-ref>.supabase.co/functions/v1/ai-indicator-analytics?period=7d" \
  -H "Authorization: Bearer <anon-key>"
```

