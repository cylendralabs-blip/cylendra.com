-- ============================================
-- ترحيل جميع Cron Jobs من المشروع القديم إلى الجديد
-- ============================================
-- هذا الملف يحتوي على جميع الـ 12 Cron Job من المشروع القديم
-- المشروع الجديد: pjgfrhgjbbsqsmwfljpg
-- ============================================

-- تأكد من تفعيل Extensions
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- ============================================
-- Cron Job 1: auto-trader-worker
-- ============================================
-- Schedule: كل دقيقة (* * * * *)
-- Purpose: معالجة الإشارات المعلقة وتنفيذ الصفقات تلقائياً

DO $$
BEGIN
  -- إلغاء الجدولة السابقة إن وجدت
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-trader-worker') THEN
    PERFORM cron.unschedule('auto-trader-worker');
  END IF;
  
  -- إنشاء Cron Job جديد
  PERFORM cron.schedule(
    'auto-trader-worker',
    '* * * * *',  -- كل دقيقة
    $cron1$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/auto-trader-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron1$
  );
  
  RAISE NOTICE '✅ Cron job "auto-trader-worker" تم إنشاؤه بنجاح (كل دقيقة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء auto-trader-worker: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 2: strategy-runner-15m
-- ============================================
-- Schedule: كل 5 دقائق (*/5 * * * *)
-- Purpose: توليد إشارات للإطار الزمني 15m

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-15m') THEN
    PERFORM cron.unschedule('strategy-runner-15m');
  END IF;
  
  PERFORM cron.schedule(
    'strategy-runner-15m',
    '*/5 * * * *',  -- كل 5 دقائق
    $cron2$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '15m')
    );
    $cron2$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-15m" تم إنشاؤه بنجاح (كل 5 دقائق)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء strategy-runner-15m: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 3: strategy-runner-1h
-- ============================================
-- Schedule: كل 15 دقيقة (*/15 * * * *)
-- Purpose: توليد إشارات للإطار الزمني 1h

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-1h') THEN
    PERFORM cron.unschedule('strategy-runner-1h');
  END IF;
  
  PERFORM cron.schedule(
    'strategy-runner-1h',
    '*/15 * * * *',  -- كل 15 دقيقة
    $cron3$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1h')
    );
    $cron3$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-1h" تم إنشاؤه بنجاح (كل 15 دقيقة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء strategy-runner-1h: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 4: strategy-runner-4h
-- ============================================
-- Schedule: كل ساعة (0 * * * *)
-- Purpose: توليد إشارات للإطار الزمني 4h

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-4h') THEN
    PERFORM cron.unschedule('strategy-runner-4h');
  END IF;
  
  PERFORM cron.schedule(
    'strategy-runner-4h',
    '0 * * * *',  -- كل ساعة
    $cron4$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '4h')
    );
    $cron4$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-4h" تم إنشاؤه بنجاح (كل ساعة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء strategy-runner-4h: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 5: strategy-runner-1d
-- ============================================
-- Schedule: يومياً في منتصف الليل (0 0 * * *)
-- Purpose: توليد إشارات للإطار الزمني 1d

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'strategy-runner-1d') THEN
    PERFORM cron.unschedule('strategy-runner-1d');
  END IF;
  
  PERFORM cron.schedule(
    'strategy-runner-1d',
    '0 0 * * *',  -- يومياً في منتصف الليل
    $cron5$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/strategy-runner-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('timeframe', '1d')
    );
    $cron5$
  );
  
  RAISE NOTICE '✅ Cron job "strategy-runner-1d" تم إنشاؤه بنجاح (يومياً في منتصف الليل)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء strategy-runner-1d: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 6: position-monitor-worker
-- ============================================
-- Schedule: كل 5 دقائق (0,5,10,15,20,25,30,35,40,45,50,55 * * * *)
-- Purpose: مراقبة المراكز وإدارة المخاطر

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'position-monitor-worker') THEN
    PERFORM cron.unschedule('position-monitor-worker');
  END IF;
  
  PERFORM cron.schedule(
    'position-monitor-worker',
    '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',  -- كل 5 دقائق
    $cron6$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/position-monitor-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron6$
  );
  
  RAISE NOTICE '✅ Cron job "position-monitor-worker" تم إنشاؤه بنجاح (كل 5 دقائق)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء position-monitor-worker: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 7: portfolio-sync-worker
-- ============================================
-- Schedule: كل ساعة (0 * * * *)
-- Purpose: مزامنة بيانات المحفظة

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'portfolio-sync-worker') THEN
    PERFORM cron.unschedule('portfolio-sync-worker');
  END IF;
  
  PERFORM cron.schedule(
    'portfolio-sync-worker',
    '0 * * * *',  -- كل ساعة
    $cron7$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/portfolio-sync-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron7$
  );
  
  RAISE NOTICE '✅ Cron job "portfolio-sync-worker" تم إنشاؤه بنجاح (كل ساعة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء portfolio-sync-worker: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 8: daily-system-stats
-- ============================================
-- Schedule: يومياً في منتصف الليل (0 0 * * *)
-- Purpose: تسجيل إحصائيات النظام اليومية

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-system-stats') THEN
    PERFORM cron.unschedule('daily-system-stats');
  END IF;
  
  PERFORM cron.schedule(
    'daily-system-stats',
    '0 0 * * *',  -- يومياً في منتصف الليل
    $cron8$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/system-health-check',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'record_daily_stats')
    );
    $cron8$
  );
  
  RAISE NOTICE '✅ Cron job "daily-system-stats" تم إنشاؤه بنجاح (يومياً في منتصف الليل)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء daily-system-stats: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 9: business-analytics-aggregator
-- ============================================
-- Schedule: يومياً في الساعة 1 صباحاً (0 1 * * *)
-- Purpose: تجميع بيانات التحليلات التجارية

DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'business-analytics-aggregator') THEN
    PERFORM cron.unschedule('business-analytics-aggregator');
  END IF;
  
  PERFORM cron.schedule(
    'business-analytics-aggregator',
    '0 1 * * *',  -- يومياً في الساعة 1 صباحاً
    $cron9$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/business-analytics-aggregator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron9$
  );
  
  RAISE NOTICE '✅ Cron job "business-analytics-aggregator" تم إنشاؤه بنجاح (يومياً في الساعة 1 صباحاً)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء business-analytics-aggregator: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 10: ticket-automation-worker
-- ============================================
-- Schedule: كل ساعة (0 * * * *)
-- Purpose: أتمتة معالجة التذاكر

DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ticket-automation-worker') THEN
    PERFORM cron.unschedule('ticket-automation-worker');
  END IF;
  
  PERFORM cron.schedule(
    'ticket-automation-worker',
    '0 * * * *',  -- كل ساعة
    $cron10$
    SELECT net.http_post(
      url := 'https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/ticket-automation-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron10$
  );
  
  RAISE NOTICE '✅ Cron job "ticket-automation-worker" تم إنشاؤه بنجاح (كل ساعة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء ticket-automation-worker: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 11: check-expiring-subscriptions
-- ============================================
-- Schedule: يومياً في الساعة 9 صباحاً (0 9 * * *)
-- Purpose: فحص الاشتراكات المنتهية الصلاحية

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-expiring-subscriptions') THEN
    PERFORM cron.unschedule('check-expiring-subscriptions');
  END IF;
  
  PERFORM cron.schedule(
    'check-expiring-subscriptions',
    '0 9 * * *',  -- يومياً في الساعة 9 صباحاً
    $cron11$SELECT public.check_expiring_subscriptions()$cron11$
  );
  
  RAISE NOTICE '✅ Cron job "check-expiring-subscriptions" تم إنشاؤه بنجاح (يومياً في الساعة 9 صباحاً)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء check-expiring-subscriptions: %', SQLERRM;
END $$;

-- ============================================
-- Cron Job 12: subscription-email-notifier
-- ============================================
-- Schedule: كل ساعة (0 * * * *)
-- Purpose: إرسال إشعارات البريد الإلكتروني للاشتراكات

DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  -- Check if job exists before unscheduling
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'subscription-email-notifier'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('subscription-email-notifier');
  END IF;
  
  -- Schedule the job with service_role_key embedded directly in the command string
  -- Note: We use single quotes and escape them by doubling them ('')
  PERFORM cron.schedule(
    'subscription-email-notifier',
    '0 * * * *', -- Every hour
    'SELECT net.http_post(
      url := ''https://pjgfrhgjbbsqsmwfljpg.supabase.co/functions/v1/subscription-email-notifier'',
      headers := jsonb_build_object(
        ''Authorization'', ''Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4'',
        ''Content-Type'', ''application/json''
      ),
      body := ''{}''::jsonb
    );'
  );
  
  RAISE NOTICE '✅ Cron job "subscription-email-notifier" تم إنشاؤه بنجاح (كل ساعة)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ خطأ في إنشاء subscription-email-notifier: %', SQLERRM;
END $$;

-- ============================================
-- التحقق من جميع Cron Jobs
-- ============================================
-- قم بتشغيل هذا الاستعلام للتحقق من جميع Cron Jobs:

SELECT 
  jobid,
  jobname,
  active,
  schedule,
  CASE 
    WHEN active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM cron.job
WHERE jobname IN (
  'auto-trader-worker',
  'strategy-runner-15m',
  'strategy-runner-1h',
  'strategy-runner-4h',
  'strategy-runner-1d',
  'position-monitor-worker',
  'portfolio-sync-worker',
  'daily-system-stats',
  'business-analytics-aggregator',
  'ticket-automation-worker',
  'check-expiring-subscriptions',
  'subscription-email-notifier'
)
ORDER BY jobname;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. جميع Cron Jobs تستخدم المفاتيح الجديدة للمشروع: pjgfrhgjbbsqsmwfljpg
-- 2. جميع URLs محدثة للمشروع الجديد
-- 3. تأكد من تفعيل pg_net و pg_cron extensions
-- 4. جميع الأوقات بتوقيت UTC
-- 5. يمكنك مراقبة التنفيذ من خلال جدول cron.job_run_details
