-- Phase Admin B: Create risk_event_logs table
-- System-wide risk event logging for auditing and debugging

-- Create risk_event_logs table if not exists
create table if not exists public.risk_event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  metadata jsonb,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.risk_event_logs enable row level security;

-- RLS Policy: Users can see own logs, admins can see all
drop policy if exists "Users can view own risk logs" on public.risk_event_logs;
create policy "Users can view own risk logs"
  on public.risk_event_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all risk logs" on public.risk_event_logs;

do $$
begin
  -- Check if is_admin function exists
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    -- Use is_admin() function
    execute 'create policy "Admins can view all risk logs" on public.risk_event_logs for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    -- Use user_roles table
    execute 'create policy "Admins can view all risk logs" on public.risk_event_logs for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    -- If neither exists, allow all authenticated users (will be restricted later)
    execute 'create policy "Admins can view all risk logs" on public.risk_event_logs for select using (auth.uid() is not null)';
  end if;
end $$;

-- Create indexes
create index if not exists risk_event_logs_user_id_idx on public.risk_event_logs(user_id);
create index if not exists risk_event_logs_event_type_idx on public.risk_event_logs(event_type);
create index if not exists risk_event_logs_severity_idx on public.risk_event_logs(severity);
create index if not exists risk_event_logs_created_at_idx on public.risk_event_logs(created_at desc);

