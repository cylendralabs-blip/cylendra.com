-- Phase Admin E: Support Ticketing System
-- Create tables for support tickets, messages, events, and canned responses

-- ============================================
-- 1. TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number text NOT NULL UNIQUE, -- Human-readable ticket ID (e.g., TKT-2025-001)
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'api_issue',
    'trading_issue',
    'signals',
    'billing',
    'technical',
    'other'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  assigned_admin_id uuid REFERENCES auth.users(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  sla_first_response_hours integer DEFAULT 24, -- SLA target for first response
  sla_resolution_hours integer DEFAULT 72, -- SLA target for resolution
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin ON public.tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  year_part text;
  seq_num integer;
  ticket_num text;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '(\d+)$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.tickets
  WHERE ticket_number LIKE 'TKT-' || year_part || '-%';
  
  ticket_num := 'TKT-' || year_part || '-' || LPAD(seq_num::text, 6, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- RLS Policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all tickets"
      ON public.tickets
      FOR SELECT
      USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can update all tickets"
      ON public.tickets
      FOR UPDATE
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all tickets"
      ON public.tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can update all tickets"
      ON public.tickets
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all tickets"
      ON public.tickets
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can update all tickets"
      ON public.tickets
      FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 2. TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message_text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb, -- Array of {url, filename, file_type}
  is_internal boolean DEFAULT false, -- Internal notes not visible to user
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_is_internal ON public.ticket_messages(is_internal);

-- RLS Policies
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own ticket messages (except internal ones)
CREATE POLICY "Users can view own ticket messages"
  ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
    AND is_internal = false
  );

-- Users can create messages for their own tickets
CREATE POLICY "Users can create messages for own tickets"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND sender_id = auth.uid()
  );

-- Admins can view all messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all messages"
      ON public.ticket_messages
      FOR SELECT
      USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can create messages"
      ON public.ticket_messages
      FOR INSERT
      WITH CHECK (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all messages"
      ON public.ticket_messages
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can create messages"
      ON public.ticket_messages
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all messages"
      ON public.ticket_messages
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can create messages"
      ON public.ticket_messages
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger to update ticket's first_response_at when admin replies
CREATE OR REPLACE FUNCTION update_ticket_first_response()
RETURNS trigger AS $$
BEGIN
  IF NEW.sender_type = 'admin' AND NEW.is_internal = false THEN
    UPDATE public.tickets
    SET first_response_at = COALESCE(first_response_at, NEW.created_at)
    WHERE id = NEW.ticket_id
    AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_first_response_trigger
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_first_response();

-- Trigger to update ticket's updated_at when message is added
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS trigger AS $$
BEGIN
  UPDATE public.tickets
  SET updated_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_on_message_trigger
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_message();

-- ============================================
-- 3. TICKET EVENTS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ticket_events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'ticket_created',
    'ticket_assigned',
    'ticket_unassigned',
    'priority_changed',
    'status_changed',
    'category_changed',
    'ticket_reopened',
    'ticket_closed',
    'ticket_escalated',
    'auto_assigned',
    'auto_escalated',
    'auto_closed',
    'sla_breached'
  )),
  performed_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON public.ticket_events_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_event_type ON public.ticket_events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_ticket_events_created_at ON public.ticket_events_log(created_at DESC);

-- RLS Policies
ALTER TABLE public.ticket_events_log ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own tickets
CREATE POLICY "Users can view own ticket events"
  ON public.ticket_events_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_events_log.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- System can insert events
CREATE POLICY "System can insert events"
  ON public.ticket_events_log
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view all events"
      ON public.ticket_events_log
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view all events"
      ON public.ticket_events_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view all events"
      ON public.ticket_events_log
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- 4. CANNED RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message_text text NOT NULL,
  category text, -- Optional: match ticket category
  created_by uuid NOT NULL REFERENCES auth.users(id),
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON public.canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_created_by ON public.canned_responses(created_by);

-- RLS Policies
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage canned responses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view canned responses"
      ON public.canned_responses
      FOR SELECT
      USING (public.is_admin(auth.uid()));
    
    CREATE POLICY "Admins can manage canned responses"
      ON public.canned_responses
      FOR ALL
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view canned responses"
      ON public.canned_responses
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can manage canned responses"
      ON public.canned_responses
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view canned responses"
      ON public.canned_responses
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can manage canned responses"
      ON public.canned_responses
      FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON public.canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. SUPPORT METRICS AGGREGATION TABLE (Optional for performance)
-- ============================================
CREATE TABLE IF NOT EXISTS public.support_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  open_tickets_count integer DEFAULT 0,
  tickets_by_category jsonb DEFAULT '{}'::jsonb,
  tickets_by_priority jsonb DEFAULT '{}'::jsonb,
  avg_response_time_hours numeric(10, 2) DEFAULT 0,
  avg_resolution_time_hours numeric(10, 2) DEFAULT 0,
  tickets_reopened_count integer DEFAULT 0,
  tickets_closed_count integer DEFAULT 0,
  sla_breaches_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_metrics_date ON public.support_metrics_daily(date DESC);

-- RLS Policies
ALTER TABLE public.support_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Only admins can view metrics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    CREATE POLICY "Admins can view metrics"
      ON public.support_metrics_daily
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    CREATE POLICY "Admins can view metrics"
      ON public.support_metrics_daily
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  ELSE
    CREATE POLICY "Admins can view metrics"
      ON public.support_metrics_daily
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER update_support_metrics_updated_at
  BEFORE UPDATE ON public.support_metrics_daily
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

