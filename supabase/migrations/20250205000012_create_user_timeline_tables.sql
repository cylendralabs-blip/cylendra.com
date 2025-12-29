-- Phase Admin D: User Timeline and Support Tools
-- Create tables for user activity timeline, error logs, and support notes

-- ============================================
-- 1. USER TIMELINE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_category text NOT NULL CHECK (event_category IN (
    'authentication',
    'api_connection',
    'trading_activity',
    'risk_event',
    'admin_action',
    'system_issue'
  )),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source text, -- e.g., 'bot', 'api', 'worker', 'admin'
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_timeline_events_user_id ON public.user_timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_timeline_events_created_at ON public.user_timeline_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_timeline_events_event_type ON public.user_timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_timeline_events_category ON public.user_timeline_events(event_category);

-- RLS Policies
ALTER TABLE public.user_timeline_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own timeline
CREATE POLICY "Users can view own timeline"
  ON public.user_timeline_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert timeline events
CREATE POLICY "System can insert timeline events"
  ON public.user_timeline_events
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all timelines
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all timelines"
      ON public.user_timeline_events
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all timelines"
      ON public.user_timeline_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all timelines"
      ON public.user_timeline_events
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 2. USER ERROR LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  source text NOT NULL, -- 'bot', 'api', 'worker', 'trade_execution', 'risk_engine'
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata jsonb DEFAULT '{}'::jsonb,
  suggested_action text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_error_logs_user_id ON public.user_error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_error_logs_created_at ON public.user_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_error_logs_error_type ON public.user_error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_user_error_logs_severity ON public.user_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_user_error_logs_resolved ON public.user_error_logs(resolved);

-- RLS Policies
ALTER TABLE public.user_error_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own errors
CREATE POLICY "Users can view own errors"
  ON public.user_error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert errors
CREATE POLICY "System can insert errors"
  ON public.user_error_logs
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all errors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all errors"
      ON public.user_error_logs
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all errors"
      ON public.user_error_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all errors"
      ON public.user_error_logs
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Admins can update errors (mark as resolved)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can update errors"
      ON public.user_error_logs
      FOR UPDATE
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can update errors"
      ON public.user_error_logs
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can update errors"
      ON public.user_error_logs
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 3. API KEY HEALTH STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_key_health_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE,
  platform text NOT NULL,
  status text NOT NULL CHECK (status IN ('valid', 'invalid', 'expired', 'permission_error', 'rate_limited')),
  last_successful_request_at timestamptz,
  last_successful_endpoint text,
  error_rate_percentage numeric(5, 2) DEFAULT 0,
  last_10_errors jsonb DEFAULT '[]'::jsonb,
  security_flags jsonb DEFAULT '{}'::jsonb,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_key_health_user_id ON public.api_key_health_status(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_health_api_key_id ON public.api_key_health_status(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_health_status ON public.api_key_health_status(status);
CREATE INDEX IF NOT EXISTS idx_api_key_health_last_checked ON public.api_key_health_status(last_checked_at DESC);

-- Unique constraint: one health record per api_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_health_unique ON public.api_key_health_status(api_key_id) WHERE api_key_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.api_key_health_status ENABLE ROW LEVEL SECURITY;

-- Users can view their own API health
CREATE POLICY "Users can view own API health"
  ON public.api_key_health_status
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update API health
CREATE POLICY "System can manage API health"
  ON public.api_key_health_status
  FOR ALL
  WITH CHECK (true);

-- Admins can view all API health
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all API health"
      ON public.api_key_health_status
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all API health"
      ON public.api_key_health_status
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all API health"
      ON public.api_key_health_status
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_api_key_health_updated_at
  BEFORE UPDATE ON public.api_key_health_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. USER SUPPORT NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_support_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  note_text text NOT NULL,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_support_notes_user_id ON public.user_support_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_support_notes_admin_id ON public.user_support_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_support_notes_created_at ON public.user_support_notes(created_at DESC);

-- RLS Policies
ALTER TABLE public.user_support_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view notes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all notes"
      ON public.user_support_notes
      FOR SELECT
      USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can insert notes"
      ON public.user_support_notes
      FOR INSERT
      WITH CHECK (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can update notes"
      ON public.user_support_notes
      FOR UPDATE
      USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can delete notes"
      ON public.user_support_notes
      FOR DELETE
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all notes"
      ON public.user_support_notes
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can insert notes"
      ON public.user_support_notes
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can update notes"
      ON public.user_support_notes
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can delete notes"
      ON public.user_support_notes
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all notes"
      ON public.user_support_notes
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can insert notes"
      ON public.user_support_notes
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can update notes"
      ON public.user_support_notes
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can delete notes"
      ON public.user_support_notes
      FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_user_support_notes_updated_at
  BEFORE UPDATE ON public.user_support_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

