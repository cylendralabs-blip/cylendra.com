-- ========================================
-- تفعيل Extension pg_net
-- ========================================
-- هذا الملف يفعل Extension pg_net المطلوب لـ Cron Jobs

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

