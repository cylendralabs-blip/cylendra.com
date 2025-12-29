-- Subscription Expiry Notifications Cron Job
-- Phase Admin Billing: Email notifications for expiring subscriptions

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Function to check and send notifications for expiring subscriptions
CREATE OR REPLACE FUNCTION public.check_expiring_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expiring_user RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- Check subscriptions expiring in 7 days
  FOR expiring_user IN
    SELECT 
      up.user_id,
      u.email,
      p.code as plan_code,
      p.name as plan_name,
      up.expires_at,
      up.status,
      EXTRACT(DAY FROM (up.expires_at - now()))::INTEGER as days_remaining
    FROM public.user_plans up
    JOIN auth.users u ON u.id = up.user_id
    JOIN public.plans p ON p.id = up.plan_id
    WHERE up.status IN ('active', 'trial')
      AND up.expires_at IS NOT NULL
      AND up.expires_at > now()
      AND up.expires_at <= (now() + INTERVAL '7 days')
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_notifications sn
        WHERE sn.user_id = up.user_id
          AND sn.notification_type = 'expiring_7_days'
          AND sn.sent_at >= (now() - INTERVAL '1 day')
      )
  LOOP
    -- Insert notification record (will be sent by Edge Function)
    INSERT INTO public.subscription_notifications (
      user_id,
      notification_type,
      plan_code,
      expires_at,
      metadata
    ) VALUES (
      expiring_user.user_id,
      'expiring_7_days',
      expiring_user.plan_code,
      expiring_user.expires_at,
      jsonb_build_object(
        'days_remaining', expiring_user.days_remaining,
        'plan_name', expiring_user.plan_name
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Check subscriptions expiring in 3 days
  FOR expiring_user IN
    SELECT 
      up.user_id,
      u.email,
      p.code as plan_code,
      p.name as plan_name,
      up.expires_at,
      up.status,
      EXTRACT(DAY FROM (up.expires_at - now()))::INTEGER as days_remaining
    FROM public.user_plans up
    JOIN auth.users u ON u.id = up.user_id
    JOIN public.plans p ON p.id = up.plan_id
    WHERE up.status IN ('active', 'trial')
      AND up.expires_at IS NOT NULL
      AND up.expires_at > now()
      AND up.expires_at <= (now() + INTERVAL '3 days')
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_notifications sn
        WHERE sn.user_id = up.user_id
          AND sn.notification_type = 'expiring_3_days'
          AND sn.sent_at >= (now() - INTERVAL '1 day')
      )
  LOOP
    INSERT INTO public.subscription_notifications (
      user_id,
      notification_type,
      plan_code,
      expires_at,
      metadata
    ) VALUES (
      expiring_user.user_id,
      'expiring_3_days',
      expiring_user.plan_code,
      expiring_user.expires_at,
      jsonb_build_object(
        'days_remaining', expiring_user.days_remaining,
        'plan_name', expiring_user.plan_name
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Check subscriptions expiring today
  FOR expiring_user IN
    SELECT 
      up.user_id,
      u.email,
      p.code as plan_code,
      p.name as plan_name,
      up.expires_at,
      up.status,
      EXTRACT(DAY FROM (up.expires_at - now()))::INTEGER as days_remaining
    FROM public.user_plans up
    JOIN auth.users u ON u.id = up.user_id
    JOIN public.plans p ON p.id = up.plan_id
    WHERE up.status IN ('active', 'trial')
      AND up.expires_at IS NOT NULL
      AND up.expires_at > now()
      AND up.expires_at <= (now() + INTERVAL '1 day')
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_notifications sn
        WHERE sn.user_id = up.user_id
          AND sn.notification_type = 'expiring_today'
          AND sn.sent_at >= (now() - INTERVAL '1 day')
      )
  LOOP
    INSERT INTO public.subscription_notifications (
      user_id,
      notification_type,
      plan_code,
      expires_at,
      metadata
    ) VALUES (
      expiring_user.user_id,
      'expiring_today',
      expiring_user.plan_code,
      expiring_user.expires_at,
      jsonb_build_object(
        'days_remaining', expiring_user.days_remaining,
        'plan_name', expiring_user.plan_name
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Check expired subscriptions
  FOR expiring_user IN
    SELECT 
      up.user_id,
      u.email,
      p.code as plan_code,
      p.name as plan_name,
      up.expires_at,
      up.status
    FROM public.user_plans up
    JOIN auth.users u ON u.id = up.user_id
    JOIN public.plans p ON p.id = up.plan_id
    WHERE up.status IN ('active', 'trial')
      AND up.expires_at IS NOT NULL
      AND up.expires_at <= now()
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_notifications sn
        WHERE sn.user_id = up.user_id
          AND sn.notification_type = 'expired'
          AND sn.sent_at >= (now() - INTERVAL '1 day')
      )
  LOOP
    -- Update status to expired
    UPDATE public.user_plans
    SET status = 'expired'
    WHERE user_id = expiring_user.user_id;

    -- Insert notification
    INSERT INTO public.subscription_notifications (
      user_id,
      notification_type,
      plan_code,
      expires_at,
      metadata
    ) VALUES (
      expiring_user.user_id,
      'expired',
      expiring_user.plan_code,
      expiring_user.expires_at,
      jsonb_build_object(
        'plan_name', expiring_user.plan_name
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Create subscription_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'expiring_7_days', 'expiring_3_days', 'expiring_today', 'expired'
  plan_code TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(user_id, notification_type, expires_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user_id ON public.subscription_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_sent_at ON public.subscription_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_email_sent ON public.subscription_notifications(email_sent) WHERE email_sent = false;

-- Enable RLS
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.subscription_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.subscription_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage notifications" ON public.subscription_notifications;
CREATE POLICY "Service can manage notifications"
  ON public.subscription_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Schedule cron job to check expiring subscriptions (runs daily at 9 AM UTC)
DO $$
BEGIN
  -- Unschedule if exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-expiring-subscriptions') THEN
    PERFORM cron.unschedule('check-expiring-subscriptions');
  END IF;
  
  -- Schedule the job
  PERFORM cron.schedule(
    'check-expiring-subscriptions',
    '0 9 * * *', -- Every day at 9 AM UTC
    $cron1$SELECT public.check_expiring_subscriptions()$cron1$
  );
  
  RAISE NOTICE '✅ Cron job "check-expiring-subscriptions" scheduled (daily at 9 AM UTC)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling cron job: %', SQLERRM;
END $$;

-- Schedule cron job to send email notifications (runs every hour)
DO $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2ZyaGdqYmJzcXNtd2ZsanBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIyNTEyMywiZXhwIjoyMDgwODAxMTIzfQ.CDwMCqw-HNuVXzXqv6H2pfci_exeGGeYgVqGPsJhRh4';
  project_ref TEXT := 'pjgfrhgjbbsqsmwfljpg';
  base_url TEXT;
  job_exists BOOLEAN;
BEGIN
  base_url := 'https://' || project_ref || '.supabase.co';
  
  -- Check if job exists before unscheduling
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'subscription-email-notifier'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('subscription-email-notifier');
  END IF;
  
  -- Schedule the job with service_role_key embedded directly in the command
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
  
  RAISE NOTICE '✅ Cron job "subscription-email-notifier" scheduled (every hour)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error scheduling cron job: %', SQLERRM;
END $$;

-- Comments
COMMENT ON FUNCTION public.check_expiring_subscriptions IS 'Checks for expiring subscriptions and creates notification records';
COMMENT ON TABLE public.subscription_notifications IS 'Subscription expiry notifications queue';

