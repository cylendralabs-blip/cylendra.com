-- Crypto Payments Integration Tables
-- Phase Crypto Payments: NOWPayments Integration

-- 1. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL, -- 'BASIC', 'PREMIUM', 'PRO', 'VIP'
  
  -- Payment Amount
  amount_usd NUMERIC NOT NULL,
  currency TEXT NOT NULL, -- 'USDT', 'USDC', 'BTC', etc.
  payment_method TEXT NOT NULL DEFAULT 'crypto',
  provider TEXT NOT NULL DEFAULT 'NOWPayments',
  
  -- Provider Details
  provider_payment_id TEXT UNIQUE, -- NOWPayments payment_id or invoice_id
  payment_url TEXT, -- URL to redirect user to
  pay_address TEXT, -- Crypto address to send payment to
  pay_amount NUMERIC, -- Amount in crypto currency
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirming', 'finished', 'failed', 'expired', 'refunded'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Store raw response, network, tx hash, etc.
  
  -- Constraints
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'confirming', 'finished', 'failed', 'expired', 'refunded'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- 2. Payment Events Table (for audit trail)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'created', 'status_update', 'webhook_received', 'error', 'plan_activated'
  provider_status TEXT, -- Raw status from NOWPayments
  raw_payload JSONB DEFAULT '{}'::jsonb, -- Raw NOWPayments payload
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON public.payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;
CREATE POLICY "Service can manage payments"
  ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment_events
DROP POLICY IF EXISTS "Users can view their own payment events" ON public.payment_events;
CREATE POLICY "Users can view their own payment events"
  ON public.payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_events.payment_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payment events" ON public.payment_events;
CREATE POLICY "Admins can view all payment events"
  ON public.payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Service can manage payment events" ON public.payment_events;
CREATE POLICY "Service can manage payment events"
  ON public.payment_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payments_updated_at();

-- Comments
COMMENT ON TABLE public.payments IS 'Crypto payments via NOWPayments and other providers';
COMMENT ON TABLE public.payment_events IS 'Audit trail for payment lifecycle events';
COMMENT ON COLUMN public.payments.provider_payment_id IS 'NOWPayments payment_id or invoice_id';
COMMENT ON COLUMN public.payments.payment_url IS 'URL to redirect user to for payment';
COMMENT ON COLUMN public.payments.pay_address IS 'Crypto address to send payment to';
COMMENT ON COLUMN public.payments.pay_amount IS 'Amount in crypto currency';

