-- Phase Admin A: Create user_trading_status table
-- Track trading enable/disable status for each user

-- Create user_trading_status table if not exists
create table if not exists public.user_trading_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  trading_enabled boolean not null default true,
  disabled_reason text,
  disabled_by uuid references auth.users(id),
  disabled_at timestamptz,
  enabled_by uuid references auth.users(id),
  enabled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_trading_status enable row level security;

-- RLS Policy: Users can see own status, admins can see all
drop policy if exists "Users can view own trading status" on public.user_trading_status;
create policy "Users can view own trading status"
  on public.user_trading_status
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all trading status" on public.user_trading_status;
drop policy if exists "Admins can modify trading status" on public.user_trading_status;

do $$
begin
  -- Check if is_admin function exists
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    -- Use is_admin() function
    execute 'create policy "Admins can view all trading status" on public.user_trading_status for select using (public.is_admin(auth.uid()))';
    execute 'create policy "Admins can modify trading status" on public.user_trading_status for all using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    -- Use user_roles table
    execute 'create policy "Admins can view all trading status" on public.user_trading_status for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
    execute 'create policy "Admins can modify trading status" on public.user_trading_status for all using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    -- If neither exists, allow all authenticated users (will be restricted later)
    execute 'create policy "Admins can view all trading status" on public.user_trading_status for select using (auth.uid() is not null)';
    execute 'create policy "Admins can modify trading status" on public.user_trading_status for all using (auth.uid() is not null)';
  end if;
end $$;

-- Create indexes
create index if not exists user_trading_status_user_id_idx on public.user_trading_status(user_id);
create index if not exists user_trading_status_enabled_idx on public.user_trading_status(trading_enabled);

-- Create update_updated_at_column function if not exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
drop trigger if exists user_trading_status_updated_at on public.user_trading_status;
create trigger user_trading_status_updated_at
  before update on public.user_trading_status
  for each row
  execute function update_updated_at_column();

