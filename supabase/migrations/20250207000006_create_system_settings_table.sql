-- System Settings Table
-- Admin-Controlled Beta Mode Configuration

-- Drop existing table if it has wrong structure
DO $$
BEGIN
  -- Check if table exists but doesn't have 'key' column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'system_settings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'system_settings' 
    AND column_name = 'key'
  ) THEN
    -- Drop the incorrectly structured table
    DROP TABLE IF EXISTS public.system_settings CASCADE;
  END IF;
END $$;

-- Create table with correct structure
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings(updated_at DESC);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service can manage system settings" ON public.system_settings;

-- RLS Policies
CREATE POLICY "Admins can view system settings"
  ON public.system_settings
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

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role can manage all settings
CREATE POLICY "Service can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_settings_updated ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();

-- Initialize default beta mode settings
DO $$
BEGIN
  -- Insert default settings only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'beta_mode_enabled') THEN
    INSERT INTO public.system_settings (key, value, description)
    VALUES ('beta_mode_enabled', 'false'::jsonb, 'Enable/disable Beta Free Mode');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'beta_duration_days') THEN
    INSERT INTO public.system_settings (key, value, description)
    VALUES ('beta_duration_days', '{"days": 60}'::jsonb, 'Beta subscription duration in days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'beta_end_date') THEN
    INSERT INTO public.system_settings (key, value, description)
    VALUES ('beta_end_date', 'null'::jsonb, 'Beta mode end date (auto-calculated)');
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings managed by admins';
COMMENT ON COLUMN public.system_settings.key IS 'Setting key (e.g., beta_mode_enabled)';
COMMENT ON COLUMN public.system_settings.value IS 'Setting value as JSONB';
COMMENT ON COLUMN public.system_settings.updated_by IS 'User who last updated this setting';
