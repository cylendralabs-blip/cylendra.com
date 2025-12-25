-- Phase 18: Create admin_activity_logs table
-- Log all sensitive admin operations (settings changes, kill switch, plan modifications, etc.)

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists admin_activity_logs_admin_id_idx on public.admin_activity_logs(admin_id);
create index if not exists admin_activity_logs_action_idx on public.admin_activity_logs(action);
create index if not exists admin_activity_logs_created_at_idx on public.admin_activity_logs(created_at desc);
create index if not exists admin_activity_logs_target_idx on public.admin_activity_logs(target_type, target_id);

-- Enable RLS (only admins can see logs)
alter table public.admin_activity_logs enable row level security;

-- RLS Policy: Only admins can view logs
-- Drop existing policy if it exists
drop policy if exists "Admins can view all activity logs" on public.admin_activity_logs;

-- Create policy using is_admin() function if available, otherwise check user_roles table
do $$
begin
  -- Check if is_admin function exists
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    -- Use is_admin() function
    execute 'create policy "Admins can view all activity logs" on public.admin_activity_logs for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    -- Use user_roles table
    execute 'create policy "Admins can view all activity logs" on public.admin_activity_logs for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    -- If neither exists, allow all authenticated users (will be restricted later)
    execute 'create policy "Admins can view all activity logs" on public.admin_activity_logs for select using (auth.uid() is not null)';
  end if;
end $$;

create policy "System can insert activity logs"
  on public.admin_activity_logs
  for insert
  with check (true);

