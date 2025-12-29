-- Phase 18: Create system_stats table
-- Aggregate daily/real-time system statistics for System Control Center

-- Check if table exists, if not create it
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'system_stats') then
    create table public.system_stats (
      id uuid primary key default gen_random_uuid(),
      date date not null,
      active_users integer not null default 0,
      total_trades integer not null default 0,
      total_volume_usd numeric(30, 2) not null default 0,
      avg_latency_ms integer,
      failed_jobs integer not null default 0,
      created_at timestamptz default now(),
      unique(date)
    );
  else
    -- Table exists, add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'date') then
      alter table public.system_stats add column date date not null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'active_users') then
      alter table public.system_stats add column active_users integer not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'total_trades') then
      alter table public.system_stats add column total_trades integer not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'total_volume_usd') then
      alter table public.system_stats add column total_volume_usd numeric(30, 2) not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'avg_latency_ms') then
      alter table public.system_stats add column avg_latency_ms integer;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'failed_jobs') then
      alter table public.system_stats add column failed_jobs integer not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'system_stats' and column_name = 'created_at') then
      alter table public.system_stats add column created_at timestamptz default now();
    end if;
  end if;
end $$;

-- Index for date lookups
create unique index if not exists system_stats_date_idx on public.system_stats(date);
create index if not exists system_stats_date_desc_idx on public.system_stats(date desc);

-- Enable RLS (only admins can view stats)
alter table public.system_stats enable row level security;

-- RLS Policy: Only admins can view stats
-- Drop existing policy if it exists
drop policy if exists "Admins can view system stats" on public.system_stats;

-- Create policy using is_admin() function if available, otherwise check user_roles table
do $$
begin
  -- Check if is_admin function exists
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    -- Use is_admin() function
    execute 'create policy "Admins can view system stats" on public.system_stats for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    -- Use user_roles table
    execute 'create policy "Admins can view system stats" on public.system_stats for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    -- If neither exists, allow all authenticated users (will be restricted later)
    execute 'create policy "Admins can view system stats" on public.system_stats for select using (auth.uid() is not null)';
  end if;
end $$;

-- Drop existing policies if they exist
drop policy if exists "System can insert stats" on public.system_stats;
drop policy if exists "System can update stats" on public.system_stats;

-- Create policies
create policy "System can insert stats"
  on public.system_stats
  for insert
  with check (true);

create policy "System can update stats"
  on public.system_stats
  for update
  using (true);

