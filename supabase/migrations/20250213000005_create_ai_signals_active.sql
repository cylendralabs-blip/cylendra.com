-- Create AI Signals Active table for upsert-based signal management
-- This table maintains the latest active signal per symbol + timeframe
-- Updated on every run, even if signal doesn't change

CREATE TABLE IF NOT EXISTS public.ai_signals_active (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  timeframe text NOT NULL,
  side text NOT NULL,
  final_confidence numeric NOT NULL,
  risk_level text NOT NULL,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  rr_ratio numeric,
  ai_score numeric,
  technical_score numeric,
  volume_score numeric,
  pattern_score numeric,
  wave_score numeric,
  sentiment_score numeric,
  sources_used jsonb,
  metadata jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cooling', 'no-signal')),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  -- Unique constraint: one active signal per symbol + timeframe
  UNIQUE(symbol, timeframe)
);

COMMENT ON TABLE public.ai_signals_active IS 'Stores the latest active signal per symbol+timeframe. Updated on every run via UPSERT.';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS ai_signals_active_symbol_idx ON public.ai_signals_active (symbol);
CREATE INDEX IF NOT EXISTS ai_signals_active_timeframe_idx ON public.ai_signals_active (timeframe);
CREATE INDEX IF NOT EXISTS ai_signals_active_status_idx ON public.ai_signals_active (status);
CREATE INDEX IF NOT EXISTS ai_signals_active_updated_at_idx ON public.ai_signals_active (updated_at DESC);

-- RLS Policies
ALTER TABLE public.ai_signals_active ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_signals_active read" ON public.ai_signals_active;
DROP POLICY IF EXISTS "ai_signals_active insert" ON public.ai_signals_active;
DROP POLICY IF EXISTS "ai_signals_active update" ON public.ai_signals_active;

CREATE POLICY "ai_signals_active read"
  ON public.ai_signals_active
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ai_signals_active insert"
  ON public.ai_signals_active
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "ai_signals_active update"
  ON public.ai_signals_active
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_signals_active_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS ai_signals_active_updated_at_trigger ON public.ai_signals_active;
CREATE TRIGGER ai_signals_active_updated_at_trigger
  BEFORE UPDATE ON public.ai_signals_active
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_signals_active_updated_at();

