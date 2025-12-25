-- Phase X.14 — Unified AI System Dashboard + Control Center
-- Database tables for system monitoring and control

-- 1. system_status table
create table if not exists public.system_status (
  id uuid primary key default gen_random_uuid(),
  service_name text not null unique,
  status text not null, -- OK / WARNING / ERROR
  last_run timestamptz,
  last_success timestamptz,
  error_message text,
  error_count integer default 0,
  success_count integer default 0,
  avg_response_time_ms numeric,
  metadata jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.system_status is 'System service status monitoring';

create index if not exists system_status_service_idx
  on public.system_status (service_name);

create index if not exists system_status_status_idx
  on public.system_status (status, updated_at desc);

-- 2. system_settings table
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.system_settings is 'Global system settings';

-- Insert default settings
insert into public.system_settings (setting_key, setting_value, description)
values
  ('ai_safety_mode', '{"enabled": false}', 'AI Safety Mode - reduces risk automatically'),
  ('ai_global_sensitivity', '{"value": 0.7}', 'AI Global Sensitivity (0-1)'),
  ('ai_signal_source_priority', '{"sources": ["ai", "technical", "volume", "pattern", "wave", "sentiment"]}', 'AI Signal Source Priority Order'),
  ('streams_enabled', '{"enabled": true}', 'Enable/Disable Live Streams'),
  ('auto_recovery_enabled', '{"enabled": true}', 'Enable/Disable Auto Recovery'),
  ('telegram_alerts_enabled', '{"enabled": true}', 'Enable/Disable Telegram Alerts'),
  ('max_leverage_safety', '{"value": 2}', 'Maximum leverage when safety mode is enabled'),
  ('risk_threshold_safety', '{"value": 0.6}', 'Risk threshold for safety mode (0-1)')
on conflict (setting_key) do nothing;

-- 3. system_logs table
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null, -- INFO / WARN / ERROR / CRITICAL
  source text not null, -- service name
  message text not null,
  metadata jsonb,
  stack_trace text,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.system_logs is 'Centralized system logs';

create index if not exists system_logs_level_idx
  on public.system_logs (level, created_at desc);

create index if not exists system_logs_source_idx
  on public.system_logs (source, created_at desc);

create index if not exists system_logs_created_idx
  on public.system_logs (created_at desc);

-- 4. recovery_events table
create table if not exists public.recovery_events (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  action text not null, -- restart, cleanup, reset, reconnect
  status text not null, -- SUCCESS / FAILED / IN_PROGRESS
  error_before text,
  logs jsonb,
  recovery_time_ms integer,
  triggered_by text, -- auto / manual
  triggered_by_user uuid references auth.users(id),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.recovery_events is 'System recovery events log';

create index if not exists recovery_events_service_idx
  on public.recovery_events (service_name, created_at desc);

create index if not exists recovery_events_status_idx
  on public.recovery_events (status, created_at desc);

-- Enable Row Level Security
alter table public.system_status enable row level security;
alter table public.system_settings enable row level security;
alter table public.system_logs enable row level security;
alter table public.recovery_events enable row level security;

-- RLS Policies: system_status
drop policy if exists "system_status_read" on public.system_status;
create policy "system_status_read"
  on public.system_status
  for select
  using (true); -- Everyone can read status

drop policy if exists "system_status_insert" on public.system_status;
create policy "system_status_insert"
  on public.system_status
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

drop policy if exists "system_status_update" on public.system_status;
create policy "system_status_update"
  on public.system_status
  for update
  using (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

-- RLS Policies: system_settings
drop policy if exists "system_settings_read" on public.system_settings;
create policy "system_settings_read"
  on public.system_settings
  for select
  using (true); -- Everyone can read settings

drop policy if exists "system_settings_insert" on public.system_settings;
create policy "system_settings_insert"
  on public.system_settings
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

drop policy if exists "system_settings_update" on public.system_settings;
create policy "system_settings_update"
  on public.system_settings
  for update
  using (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

-- RLS Policies: system_logs
drop policy if exists "system_logs_read" on public.system_logs;
create policy "system_logs_read"
  on public.system_logs
  for select
  using (true); -- Everyone can read logs

drop policy if exists "system_logs_insert" on public.system_logs;
create policy "system_logs_insert"
  on public.system_logs
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

-- RLS Policies: recovery_events
drop policy if exists "recovery_events_read" on public.recovery_events;
create policy "recovery_events_read"
  on public.recovery_events
  for select
  using (true); -- Everyone can read recovery events

drop policy if exists "recovery_events_insert" on public.recovery_events;
create policy "recovery_events_insert"
  on public.recovery_events
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role' or auth.uid() is not null);

-- Function to get system health summary
create or replace function get_system_health_summary()
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_object_agg(
    service_name,
    jsonb_build_object(
      'status', status,
      'last_run', last_run,
      'last_success', last_success,
      'error_message', error_message,
      'error_count', error_count,
      'success_count', success_count,
      'avg_response_time_ms', avg_response_time_ms,
      'updated_at', updated_at
    )
  ) into result
  from public.system_status;
  
  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql security definer;

-- Function to get latest logs
create or replace function get_latest_system_logs(p_limit integer default 200)
returns table (
  id uuid,
  level text,
  source text,
  message text,
  metadata jsonb,
  created_at timestamptz
) as $$
begin
  return query
  select
    sl.id,
    sl.level,
    sl.source,
    sl.message,
    sl.metadata,
    sl.created_at
  from public.system_logs sl
  order by sl.created_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- Function to get system statistics
create or replace function get_system_statistics(p_hours integer default 24)
returns jsonb as $$
declare
  result jsonb;
  start_time timestamptz;
begin
  start_time := timezone('utc', now()) - (p_hours || ' hours')::interval;
  
  select jsonb_build_object(
    'total_logs', (select count(*) from public.system_logs where created_at >= start_time),
    'error_logs', (select count(*) from public.system_logs where created_at >= start_time and level = 'ERROR'),
    'warning_logs', (select count(*) from public.system_logs where created_at >= start_time and level = 'WARN'),
    'critical_logs', (select count(*) from public.system_logs where created_at >= start_time and level = 'CRITICAL'),
    'recovery_events', (select count(*) from public.recovery_events where created_at >= start_time),
    'successful_recoveries', (select count(*) from public.recovery_events where created_at >= start_time and status = 'SUCCESS'),
    'failed_recoveries', (select count(*) from public.recovery_events where created_at >= start_time and status = 'FAILED'),
    'services_ok', (select count(*) from public.system_status where status = 'OK'),
    'services_warning', (select count(*) from public.system_status where status = 'WARNING'),
    'services_error', (select count(*) from public.system_status where status = 'ERROR')
  ) into result;
  
  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql security definer;

