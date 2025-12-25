-- ============================================
-- Phase 11: AI Assistant Integration - Task 11
-- AI Interactions Logging Table
-- ============================================

-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('trade_explainer', 'risk_advisor', 'settings_optimizer', 'backtest_summarizer', 'user_support')),
  input text NOT NULL,
  output text NOT NULL,
  context_summary jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_mode ON public.ai_interactions(mode);

-- Enable Row Level Security
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI interactions"
  ON public.ai_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI interactions"
  ON public.ai_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all interactions
CREATE POLICY "Admins can view all AI interactions"
  ON public.ai_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_ai_interactions_updated_at
  BEFORE UPDATE ON public.ai_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.ai_interactions IS 'Logs all AI assistant interactions for monitoring and improvement';
COMMENT ON COLUMN public.ai_interactions.mode IS 'Type of AI interaction: trade_explainer, risk_advisor, settings_optimizer, backtest_summarizer, user_support';
COMMENT ON COLUMN public.ai_interactions.context_summary IS 'Summary of context data used (no sensitive info)';
COMMENT ON COLUMN public.ai_interactions.metadata IS 'Additional metadata (confidence, tokens used, etc.)';

