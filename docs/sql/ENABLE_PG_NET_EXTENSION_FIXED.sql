-- ========================================
-- تفعيل Extension pg_net (مصحح)
-- ========================================
-- هذا الملف يفعل Extension pg_net المطلوب لـ Cron Jobs
-- تم إصلاح المشكلة المحتملة مع IMMUTABLE indexes

-- 1. التحقق من Extensions الموجودة
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. تفعيل Extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. التحقق من تفعيل Extension
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 4. التحقق من أن schema "net" موجود
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'net';

-- 5. التحقق من أن دالة http_post موجودة
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'net'
  AND routine_name = 'http_post';

-- ========================================
-- إصلاح المشكلة المحتملة مع IMMUTABLE indexes
-- ========================================

-- إصلاح index في portfolio_history إذا كان موجوداً
DROP INDEX IF EXISTS public.idx_portfolio_history_user_date;

-- إعادة إنشاء index بدون DATE() function
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
  ON public.portfolio_history(user_id, timestamp DESC);

-- ملاحظة: للبحث حسب التاريخ، يمكنك استخدام:
-- WHERE DATE(timestamp) = '2025-01-18'
-- PostgreSQL سيستخدم index timestamp بكفاءة

