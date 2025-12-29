-- Phase Admin A: Create feature_flags table
-- Enable/disable major features from admin panel

-- Create feature_flags table if not exists
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  feature_name text not null,
  is_enabled boolean not null default true,
  description text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.feature_flags enable row level security;

-- RLS Policy: Only admins can view and modify feature flags
drop policy if exists "Admins can view feature flags" on public.feature_flags;
drop policy if exists "Admins can modify feature flags" on public.feature_flags;

do $$
begin
  -- Check if is_admin function exists
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    -- Use is_admin() function
    execute 'create policy "Admins can view feature flags" on public.feature_flags for select using (public.is_admin(auth.uid()))';
    execute 'create policy "Admins can modify feature flags" on public.feature_flags for all using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    -- Use user_roles table
    execute 'create policy "Admins can view feature flags" on public.feature_flags for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
    execute 'create policy "Admins can modify feature flags" on public.feature_flags for all using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    -- If neither exists, allow all authenticated users (will be restricted later)
    execute 'create policy "Admins can view feature flags" on public.feature_flags for select using (auth.uid() is not null)';
    execute 'create policy "Admins can modify feature flags" on public.feature_flags for all using (auth.uid() is not null)';
  end if;
end $$;

-- Create index
create index if not exists feature_flags_key_idx on public.feature_flags(feature_key);
create index if not exists feature_flags_enabled_idx on public.feature_flags(is_enabled);

-- Create update_updated_at_column function if not exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
drop trigger if exists feature_flags_updated_at on public.feature_flags;
create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row
  execute function update_updated_at_column();

-- Insert default feature flags
insert into public.feature_flags (feature_key, feature_name, is_enabled, description) values
  ('copy_trading', 'Copy Trading', true, 'Enable copy trading functionality'),
  ('ultra_signals', 'Ultra Signals', true, 'Enable ultra signals feature'),
  ('backtesting', 'Backtesting', true, 'Enable backtesting engine'),
  ('affiliate', 'Affiliate System', true, 'Enable affiliate program'),
  ('ai_assistant', 'AI Assistant', true, 'Enable AI assistant chat'),
  ('advanced_analytics', 'Advanced Analytics', true, 'Enable advanced analytics dashboard')
on conflict (feature_key) do nothing;

