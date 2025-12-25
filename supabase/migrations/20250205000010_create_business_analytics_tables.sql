-- Phase Admin C: Business & Revenue Analytics Tables
-- Create tables for business metrics, revenue tracking, and feature usage

-- ============================================
-- 1. FEATURE USAGE LOGS
-- ============================================
create table if not exists public.feature_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature_key text not null,
  usage_count integer not null default 1,
  last_used_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.feature_usage_logs enable row level security;

-- RLS Policies
drop policy if exists "Users can view own usage logs" on public.feature_usage_logs;
create policy "Users can view own usage logs"
  on public.feature_usage_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "System can insert usage logs" on public.feature_usage_logs;
create policy "System can insert usage logs"
  on public.feature_usage_logs
  for insert
  with check (true);

drop policy if exists "System can update usage logs" on public.feature_usage_logs;
create policy "System can update usage logs"
  on public.feature_usage_logs
  for update
  using (true);

-- Indexes
create index if not exists feature_usage_logs_user_id_idx on public.feature_usage_logs(user_id);
create index if not exists feature_usage_logs_feature_key_idx on public.feature_usage_logs(feature_key);
create index if not exists feature_usage_logs_last_used_at_idx on public.feature_usage_logs(last_used_at desc);

-- ============================================
-- 2. DAILY USER METRICS (Aggregated)
-- ============================================
create table if not exists public.daily_user_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  total_users integer not null default 0,
  active_users_24h integer not null default 0,
  active_users_7d integer not null default 0,
  active_users_30d integer not null default 0,
  new_users integer not null default 0,
  users_by_plan jsonb default '{}'::jsonb,
  retention_rate_7d numeric(5, 2),
  retention_rate_30d numeric(5, 2),
  churn_rate numeric(5, 2),
  conversion_rate_free_to_paid numeric(5, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.daily_user_metrics enable row level security;

-- RLS Policy: Admins can view
drop policy if exists "Admins can view daily user metrics" on public.daily_user_metrics;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    execute 'create policy "Admins can view daily user metrics" on public.daily_user_metrics for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    execute 'create policy "Admins can view daily user metrics" on public.daily_user_metrics for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    execute 'create policy "Admins can view daily user metrics" on public.daily_user_metrics for select using (auth.uid() is not null)';
  end if;
end $$;

drop policy if exists "System can insert daily user metrics" on public.daily_user_metrics;
create policy "System can insert daily user metrics"
  on public.daily_user_metrics
  for insert
  with check (true);

drop policy if exists "System can update daily user metrics" on public.daily_user_metrics;
create policy "System can update daily user metrics"
  on public.daily_user_metrics
  for update
  using (true);

-- Indexes
create index if not exists daily_user_metrics_date_idx on public.daily_user_metrics(date desc);

-- ============================================
-- 3. DAILY REVENUE METRICS (Aggregated)
-- ============================================
create table if not exists public.daily_revenue_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  mrr numeric(30, 2) not null default 0,
  arr numeric(30, 2) not null default 0,
  arpu numeric(30, 2) not null default 0,
  ltv numeric(30, 2) not null default 0,
  revenue_by_plan jsonb default '{}'::jsonb,
  churned_revenue numeric(30, 2) not null default 0,
  new_revenue numeric(30, 2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.daily_revenue_metrics enable row level security;

-- RLS Policy: Admins can view
drop policy if exists "Admins can view daily revenue metrics" on public.daily_revenue_metrics;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    execute 'create policy "Admins can view daily revenue metrics" on public.daily_revenue_metrics for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    execute 'create policy "Admins can view daily revenue metrics" on public.daily_revenue_metrics for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    execute 'create policy "Admins can view daily revenue metrics" on public.daily_revenue_metrics for select using (auth.uid() is not null)';
  end if;
end $$;

drop policy if exists "System can insert daily revenue metrics" on public.daily_revenue_metrics;
create policy "System can insert daily revenue metrics"
  on public.daily_revenue_metrics
  for insert
  with check (true);

drop policy if exists "System can update daily revenue metrics" on public.daily_revenue_metrics;
create policy "System can update daily revenue metrics"
  on public.daily_revenue_metrics
  for update
  using (true);

-- Indexes
create index if not exists daily_revenue_metrics_date_idx on public.daily_revenue_metrics(date desc);

-- ============================================
-- 4. FEATURE USAGE DAILY (Aggregated)
-- ============================================
create table if not exists public.feature_usage_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  feature_key text not null,
  total_usage_count integer not null default 0,
  unique_users_count integer not null default 0,
  usage_by_plan jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(date, feature_key)
);

-- Enable RLS
alter table public.feature_usage_daily enable row level security;

-- RLS Policy: Admins can view
drop policy if exists "Admins can view feature usage daily" on public.feature_usage_daily;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    execute 'create policy "Admins can view feature usage daily" on public.feature_usage_daily for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    execute 'create policy "Admins can view feature usage daily" on public.feature_usage_daily for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    execute 'create policy "Admins can view feature usage daily" on public.feature_usage_daily for select using (auth.uid() is not null)';
  end if;
end $$;

drop policy if exists "System can insert feature usage daily" on public.feature_usage_daily;
create policy "System can insert feature usage daily"
  on public.feature_usage_daily
  for insert
  with check (true);

drop policy if exists "System can update feature usage daily" on public.feature_usage_daily;
create policy "System can update feature usage daily"
  on public.feature_usage_daily
  for update
  using (true);

-- Indexes
create index if not exists feature_usage_daily_date_idx on public.feature_usage_daily(date desc);
create index if not exists feature_usage_daily_feature_key_idx on public.feature_usage_daily(feature_key);

-- ============================================
-- 5. USER FUNNEL STAGES
-- ============================================
create table if not exists public.user_funnel_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  registered_at timestamptz,
  api_connected_at timestamptz,
  first_feature_used_at timestamptz,
  first_trade_at timestamptz,
  converted_to_paid_at timestamptz,
  retention_d1 boolean default false,
  retention_d7 boolean default false,
  retention_d30 boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_funnel_stages enable row level security;

-- RLS Policies
drop policy if exists "Users can view own funnel data" on public.user_funnel_stages;
create policy "Users can view own funnel data"
  on public.user_funnel_stages
  for select
  using (auth.uid() = user_id);

drop policy if exists "System can insert funnel data" on public.user_funnel_stages;
create policy "System can insert funnel data"
  on public.user_funnel_stages
  for insert
  with check (true);

drop policy if exists "System can update funnel data" on public.user_funnel_stages;
create policy "System can update funnel data"
  on public.user_funnel_stages
  for update
  using (true);

-- Indexes
create index if not exists user_funnel_stages_user_id_idx on public.user_funnel_stages(user_id);
create index if not exists user_funnel_stages_registered_at_idx on public.user_funnel_stages(registered_at);

-- ============================================
-- 6. USER COHORTS
-- ============================================
create table if not exists public.user_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_month date not null, -- First day of signup month
  total_users integer not null default 0,
  retention_by_month jsonb default '{}'::jsonb, -- { "month_1": 0.85, "month_2": 0.72, ... }
  arpu numeric(30, 2) not null default 0,
  conversion_rate numeric(5, 2),
  churn_rate numeric(5, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(cohort_month)
);

-- Enable RLS
alter table public.user_cohorts enable row level security;

-- RLS Policy: Admins can view
drop policy if exists "Admins can view user cohorts" on public.user_cohorts;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'is_admin') then
    execute 'create policy "Admins can view user cohorts" on public.user_cohorts for select using (public.is_admin(auth.uid()))';
  elsif exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    execute 'create policy "Admins can view user cohorts" on public.user_cohorts for select using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = ''admin''::public.app_role))';
  else
    execute 'create policy "Admins can view user cohorts" on public.user_cohorts for select using (auth.uid() is not null)';
  end if;
end $$;

drop policy if exists "System can insert user cohorts" on public.user_cohorts;
create policy "System can insert user cohorts"
  on public.user_cohorts
  for insert
  with check (true);

drop policy if exists "System can update user cohorts" on public.user_cohorts;
create policy "System can update user cohorts"
  on public.user_cohorts
  for update
  using (true);

-- Indexes
create index if not exists user_cohorts_cohort_month_idx on public.user_cohorts(cohort_month desc);

