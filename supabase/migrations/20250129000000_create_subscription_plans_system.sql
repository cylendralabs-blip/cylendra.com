-- Subscription Plans Engine + Feature Access Control
-- Phase X.10 - Subscription Plans Engine

-- 1. Plans Table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- "FREE", "BASIC", "PREMIUM", "PRO", "VIP"
  name text not null,                     -- الاسم المعروض
  price_usd numeric not null,             -- السعر الشهري بالدولار (0 للـ Free)
  billing_period text not null default 'monthly', -- "monthly" أو "yearly"
  features jsonb not null,                -- تعريف الميزات
  limits jsonb not null,                 -- حدود الاستعمال
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.plans is 'Subscription plans with features and limits';

-- 2. User Plans Table
create table if not exists public.user_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'active',  -- "active", "expired", "canceled", "trial"
  activated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,                 -- null للباقات المجانية الدائمة
  payment_method text,                    -- "manual", "stripe", "crypto", "trial"
  metadata jsonb,
  primary key (user_id)
);

comment on table public.user_plans is 'User subscription plans';

create index if not exists user_plans_plan_id_idx on public.user_plans (plan_id);
create index if not exists user_plans_status_idx on public.user_plans (status);
create index if not exists user_plans_expires_at_idx on public.user_plans (expires_at) where expires_at is not null;

-- 3. Telegram Channels Table
create table if not exists public.telegram_channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- "FREE_SIGNALS", "PREMIUM_SIGNALS", "PRO_REALTIME"
  plan_code text not null,                -- "FREE", "BASIC", "PREMIUM", "PRO", "VIP"
  chat_id text not null,                  -- معرف القناة / الجروب
  type text not null,                     -- "basic", "ai", "realtime"
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.telegram_channels is 'Telegram channels linked to subscription plans';

create index if not exists telegram_channels_plan_code_idx on public.telegram_channels (plan_code);
create index if not exists telegram_channels_type_idx on public.telegram_channels (type);

-- 4. Telegram Access Table
create table if not exists public.telegram_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_code text not null,             -- يرتبط بـ telegram_channels.code
  status text not null default 'active',  -- "active", "revoked"
  granted_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  metadata jsonb
);

comment on table public.telegram_access is 'User access to telegram channels';

create index if not exists telegram_access_user_idx on public.telegram_access (user_id, channel_code);
create index if not exists telegram_access_status_idx on public.telegram_access (status);

-- 5. Usage Counters Table (Optional - for tracking usage limits)
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  counter_type text not null,            -- "signals_per_day", "ai_calls_per_day", "trades_per_day"
  date date not null,                     -- تاريخ اليوم
  count integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, counter_type, date)
);

comment on table public.usage_counters is 'Daily usage counters for plan limits';

create index if not exists usage_counters_user_date_idx on public.usage_counters (user_id, date desc);
create index if not exists usage_counters_type_date_idx on public.usage_counters (counter_type, date desc);

-- Enable Row Level Security
alter table public.plans enable row level security;
alter table public.user_plans enable row level security;
alter table public.telegram_channels enable row level security;
alter table public.telegram_access enable row level security;
alter table public.usage_counters enable row level security;

-- RLS Policies: Plans (public read, service write)
drop policy if exists "plans_read" on public.plans;
create policy "plans_read"
  on public.plans
  for select
  using (true);

drop policy if exists "plans_write" on public.plans;
create policy "plans_write"
  on public.plans
  for all
  using (true)
  with check (true);

-- RLS Policies: User Plans (users can read their own, service can write)
drop policy if exists "user_plans_read" on public.user_plans;
create policy "user_plans_read"
  on public.user_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_plans_write" on public.user_plans;
create policy "user_plans_write"
  on public.user_plans
  for all
  using (true)
  with check (true);

-- RLS Policies: Telegram Channels (public read, service write)
drop policy if exists "telegram_channels_read" on public.telegram_channels;
create policy "telegram_channels_read"
  on public.telegram_channels
  for select
  using (true);

drop policy if exists "telegram_channels_write" on public.telegram_channels;
create policy "telegram_channels_write"
  on public.telegram_channels
  for all
  using (true)
  with check (true);

-- RLS Policies: Telegram Access (users can read their own, service can write)
drop policy if exists "telegram_access_read" on public.telegram_access;
create policy "telegram_access_read"
  on public.telegram_access
  for select
  using (auth.uid() = user_id);

drop policy if exists "telegram_access_write" on public.telegram_access;
create policy "telegram_access_write"
  on public.telegram_access
  for all
  using (true)
  with check (true);

-- RLS Policies: Usage Counters (users can read their own, service can write)
drop policy if exists "usage_counters_read" on public.usage_counters;
create policy "usage_counters_read"
  on public.usage_counters
  for select
  using (auth.uid() = user_id);

drop policy if exists "usage_counters_write" on public.usage_counters;
create policy "usage_counters_write"
  on public.usage_counters
  for all
  using (true)
  with check (true);

-- Triggers for updated_at
create or replace function public.update_plans_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_plans_updated on public.plans;
create trigger trg_plans_updated
  before update on public.plans
  for each row execute function public.update_plans_updated_at();

create or replace function public.update_usage_counters_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_usage_counters_updated on public.usage_counters;
create trigger trg_usage_counters_updated
  before update on public.usage_counters
  for each row execute function public.update_usage_counters_updated_at();

-- Insert default plans
insert into public.plans (code, name, price_usd, billing_period, features, limits, sort_order) values
('FREE', 'Free', 0, 'monthly', 
 '{"signals": {"web_basic": true, "web_ai_ultra": false, "web_realtime": false, "telegram_basic": false, "telegram_ai": false, "telegram_realtime": false}, "bots": {"enabled": false, "spot": false, "futures": false, "max_active_bots": 0}, "ai": {"advanced_indicators": false, "smart_defaults": false, "live_center": false}, "access": {"heatmap": false, "risk_map": false, "backtesting": false}}',
 '{"signals_per_day": 10, "ai_calls_per_day": 20, "max_pairs": 2, "max_telegram_channels": 0}',
 0),
('BASIC', 'Basic', 9.99, 'monthly',
 '{"signals": {"web_basic": true, "web_ai_ultra": true, "web_realtime": false, "telegram_basic": true, "telegram_ai": false, "telegram_realtime": false}, "bots": {"enabled": true, "spot": true, "futures": false, "max_active_bots": 1}, "ai": {"advanced_indicators": true, "smart_defaults": true, "live_center": false}, "access": {"heatmap": true, "risk_map": false, "backtesting": false}}',
 '{"signals_per_day": 50, "ai_calls_per_day": 100, "max_pairs": 5, "max_telegram_channels": 1}',
 1),
('PREMIUM', 'Premium', 29.99, 'monthly',
 '{"signals": {"web_basic": true, "web_ai_ultra": true, "web_realtime": true, "telegram_basic": true, "telegram_ai": true, "telegram_realtime": false}, "bots": {"enabled": true, "spot": true, "futures": true, "max_active_bots": 3}, "ai": {"advanced_indicators": true, "smart_defaults": true, "live_center": true}, "access": {"heatmap": true, "risk_map": true, "backtesting": true}}',
 '{"signals_per_day": 200, "ai_calls_per_day": 500, "max_pairs": 20, "max_telegram_channels": 2}',
 2),
('PRO', 'Pro', 79.99, 'monthly',
 '{"signals": {"web_basic": true, "web_ai_ultra": true, "web_realtime": true, "telegram_basic": true, "telegram_ai": true, "telegram_realtime": true}, "bots": {"enabled": true, "spot": true, "futures": true, "max_active_bots": 10}, "ai": {"advanced_indicators": true, "smart_defaults": true, "live_center": true}, "access": {"heatmap": true, "risk_map": true, "backtesting": true}}',
 '{"signals_per_day": 1000, "ai_calls_per_day": 5000, "max_pairs": 100, "max_telegram_channels": 5}',
 3),
('VIP', 'VIP', 199.99, 'monthly',
 '{"signals": {"web_basic": true, "web_ai_ultra": true, "web_realtime": true, "telegram_basic": true, "telegram_ai": true, "telegram_realtime": true}, "bots": {"enabled": true, "spot": true, "futures": true, "max_active_bots": -1}, "ai": {"advanced_indicators": true, "smart_defaults": true, "live_center": true}, "access": {"heatmap": true, "risk_map": true, "backtesting": true}}',
 '{"signals_per_day": -1, "ai_calls_per_day": -1, "max_pairs": -1, "max_telegram_channels": -1}',
 4)
on conflict (code) do nothing;

