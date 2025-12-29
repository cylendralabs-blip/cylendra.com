/**
 * Key Rotation System
 * 
 * Phase X.15 - Security Hardening
 * Enables automatic rotation of API keys for enhanced security
 */

-- Table to track API key rotation history
CREATE TABLE IF NOT EXISTS public.api_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_api_key_hash TEXT, -- Hashed version of old key (for audit)
  new_api_key_hash TEXT, -- Hashed version of new key
  rotation_reason TEXT, -- 'scheduled', 'security_breach', 'manual', 'expired'
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  rotated_by UUID REFERENCES auth.users(id), -- Admin or system
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS api_key_rotations_api_key_id_idx 
  ON public.api_key_rotations(api_key_id);
CREATE INDEX IF NOT EXISTS api_key_rotations_user_id_idx 
  ON public.api_key_rotations(user_id);
CREATE INDEX IF NOT EXISTS api_key_rotations_rotated_at_idx 
  ON public.api_key_rotations(rotated_at DESC);

-- Add rotation tracking fields to api_keys table
DO $$ 
BEGIN
  -- Add last_rotated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_keys' 
    AND column_name = 'last_rotated_at'
  ) THEN
    ALTER TABLE public.api_keys 
    ADD COLUMN last_rotated_at TIMESTAMPTZ;
  END IF;

  -- Add rotation_schedule_days if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_keys' 
    AND column_name = 'rotation_schedule_days'
  ) THEN
    ALTER TABLE public.api_keys 
    ADD COLUMN rotation_schedule_days INTEGER DEFAULT 90; -- Default: rotate every 90 days
  END IF;

  -- Add auto_rotate_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'api_keys' 
    AND column_name = 'auto_rotate_enabled'
  ) THEN
    ALTER TABLE public.api_keys 
    ADD COLUMN auto_rotate_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to check if key needs rotation
CREATE OR REPLACE FUNCTION public.check_key_rotation_needed()
RETURNS TABLE (
  api_key_id UUID,
  user_id UUID,
  platform TEXT,
  days_since_rotation INTEGER,
  rotation_schedule_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.user_id,
    ak.platform,
    COALESCE(
      EXTRACT(DAY FROM (timezone('utc', now()) - ak.last_rotated_at))::INTEGER,
      EXTRACT(DAY FROM (timezone('utc', now()) - ak.created_at))::INTEGER
    ) AS days_since_rotation,
    ak.rotation_schedule_days
  FROM public.api_keys ak
  WHERE 
    ak.is_active = true
    AND ak.auto_rotate_enabled = true
    AND (
      ak.last_rotated_at IS NULL 
      OR (timezone('utc', now()) - ak.last_rotated_at) > (ak.rotation_schedule_days || 90 || INTERVAL '90 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.api_key_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own key rotations"
  ON public.api_key_rotations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all rotations"
  ON public.api_key_rotations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

