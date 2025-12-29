-- Payment History Table
-- Phase Admin Billing: Payment History & Stripe Integration

CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_plans(user_id) ON DELETE SET NULL,
  
  -- Payment Details
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- 'stripe', 'crypto', 'manual', 'trial'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Stripe Integration
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Transaction Details
  transaction_id TEXT,
  payment_reference TEXT,
  payment_gateway TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON public.payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_status ON public.payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own payment history" ON public.payment_history;
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment history" ON public.payment_history;
CREATE POLICY "Admins can view all payment history"
  ON public.payment_history
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

DROP POLICY IF EXISTS "Service can insert payment history" ON public.payment_history;
CREATE POLICY "Service can insert payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update payment history" ON public.payment_history;
CREATE POLICY "Service can update payment history"
  ON public.payment_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_history_updated ON public.payment_history;
CREATE TRIGGER trg_payment_history_updated
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_history_updated_at();

-- Comments
COMMENT ON TABLE public.payment_history IS 'Payment history for all subscriptions and transactions';
COMMENT ON COLUMN public.payment_history.stripe_payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN public.payment_history.stripe_subscription_id IS 'Stripe Subscription ID';
COMMENT ON COLUMN public.payment_history.stripe_customer_id IS 'Stripe Customer ID';
COMMENT ON COLUMN public.payment_history.stripe_invoice_id IS 'Stripe Invoice ID';

