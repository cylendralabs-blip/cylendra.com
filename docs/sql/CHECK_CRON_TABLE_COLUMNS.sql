-- ========================================
-- التحقق من أعمدة جدول cron.job_run_details
-- ========================================
-- نفذ هذا الاستعلام أولاً لمعرفة الأعمدة الفعلية

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'cron'
  AND table_name = 'job_run_details'
ORDER BY ordinal_position;

