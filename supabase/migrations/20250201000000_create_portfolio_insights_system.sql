-- Phase X.13 — AI Portfolio Insights + Smart Risk Advisor
-- Database tables for portfolio analysis and risk management

-- 1. portfolio_snapshots table
create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_balance numeric not null,
  spot_balance jsonb,        -- { BTC: { amount: x, value_usd: y }, ETH: {...} }
  futures_positions jsonb,  -- [{ symbol: "BTCUSDT", side: "LONG", size: x, entry_price: y, leverage: z, unrealized_pnl: w }]
  exposure jsonb,          -- { BTC: 0.45, ETH: 0.30, USDT: 0.25 } (percentages)
  total_exposure numeric,   -- Total exposure percentage (0-100)
  leverage_used numeric,   -- Average leverage across positions
  unrealized_pnl numeric,  -- Total unrealized PnL
  realized_pnl numeric,    -- Total realized PnL (from closed positions)
  spot_value numeric,      -- Total spot value in USD
  futures_value numeric,   -- Total futures value in USD
  metadata jsonb,          -- Additional data
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.portfolio_snapshots is 'Portfolio snapshots for analysis';

create index if not exists portfolio_snapshots_user_idx
  on public.portfolio_snapshots (user_id, created_at desc);

create index if not exists portfolio_snapshots_created_idx
  on public.portfolio_snapshots (created_at desc);

-- 2. portfolio_risk_scores table
create table if not exists public.portfolio_risk_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid references public.portfolio_snapshots(id) on delete set null,
  risk_level text not null, -- LOW / MEDIUM / HIGH / CRITICAL
  volatility_score numeric, -- 0-100
  leverage_risk numeric,    -- 0-100
  exposure_risk numeric,    -- 0-100
  diversification_score numeric, -- 0-100 (higher is better)
  liquidation_risk numeric, -- 0-100
  funding_risk numeric,     -- 0-100
  sentiment_risk numeric,   -- 0-100
  overall_score numeric,    -- 0-100 (higher = more risky)
  ai_comment text,
  risk_factors jsonb,      -- Array of risk factors identified
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.portfolio_risk_scores is 'Risk analysis scores for portfolios';

create index if not exists portfolio_risk_scores_user_idx
  on public.portfolio_risk_scores (user_id, created_at desc);

create index if not exists portfolio_risk_scores_level_idx
  on public.portfolio_risk_scores (risk_level, created_at desc);

-- 3. portfolio_recommendations table
create table if not exists public.portfolio_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid references public.portfolio_snapshots(id) on delete set null,
  risk_score_id uuid references public.portfolio_risk_scores(id) on delete set null,
  recommendation_type text not null, -- "rebalance", "reduce_leverage", "increase_usdt_buffer", "close_position", "diversify", etc.
  priority text not null default 'MEDIUM', -- LOW / MEDIUM / HIGH / URGENT
  title text not null,
  description text,
  details jsonb,          -- { action: "...", current_value: x, recommended_value: y, reason: "..." }
  is_applied boolean default false,
  applied_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.portfolio_recommendations is 'AI-generated portfolio recommendations';

create index if not exists portfolio_recommendations_user_idx
  on public.portfolio_recommendations (user_id, created_at desc);

create index if not exists portfolio_recommendations_type_idx
  on public.portfolio_recommendations (recommendation_type, priority);

create index if not exists portfolio_recommendations_applied_idx
  on public.portfolio_recommendations (is_applied, created_at desc);

-- 4. portfolio_forecasts table
create table if not exists public.portfolio_forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid references public.portfolio_snapshots(id) on delete set null,
  forecast_period text not null, -- "7d", "30d", "90d"
  expected_growth numeric,        -- Expected percentage growth
  risk_adjusted_growth numeric,  -- Risk-adjusted expected growth
  best_asset text,               -- Asset expected to perform best
  worst_asset text,              -- Asset expected to perform worst
  momentum_direction text,       -- "BULLISH", "BEARISH", "NEUTRAL"
  confidence_score numeric,      -- 0-100
  forecast_details jsonb,        -- Detailed breakdown
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.portfolio_forecasts is 'Portfolio performance forecasts';

create index if not exists portfolio_forecasts_user_idx
  on public.portfolio_forecasts (user_id, created_at desc);

create index if not exists portfolio_forecasts_period_idx
  on public.portfolio_forecasts (forecast_period, created_at desc);

-- 5. portfolio_alerts table (for Telegram notifications)
create table if not exists public.portfolio_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null, -- "risk_critical", "daily_report", "recommendation", "forecast_update"
  alert_level text not null, -- "INFO", "WARNING", "CRITICAL"
  title text not null,
  message text not null,
  data jsonb,              -- Additional alert data
  sent_to_telegram boolean default false,
  telegram_sent_at timestamptz,
  read boolean default false,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Add missing columns if table exists but columns don't
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'portfolio_alerts') then
    -- Add alert_level column if missing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'alert_level') then
      alter table public.portfolio_alerts add column alert_level text not null default 'INFO';
    end if;
    -- Add read column if missing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'read') then
      alter table public.portfolio_alerts add column read boolean default false;
    end if;
    -- Add read_at column if missing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'read_at') then
      alter table public.portfolio_alerts add column read_at timestamptz;
    end if;
    -- Add sent_to_telegram column if missing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'sent_to_telegram') then
      alter table public.portfolio_alerts add column sent_to_telegram boolean default false;
    end if;
    -- Add telegram_sent_at column if missing
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'telegram_sent_at') then
      alter table public.portfolio_alerts add column telegram_sent_at timestamptz;
    end if;
  end if;
end $$;

comment on table public.portfolio_alerts is 'Portfolio alerts and notifications';

create index if not exists portfolio_alerts_user_idx
  on public.portfolio_alerts (user_id, created_at desc);

-- Create index only if alert_level column exists
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'alert_level') then
    create index if not exists portfolio_alerts_type_idx
      on public.portfolio_alerts (alert_type, alert_level);
  end if;
end $$;

-- Create unread index only if read column exists
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'portfolio_alerts' and column_name = 'read') then
    create index if not exists portfolio_alerts_unread_idx
      on public.portfolio_alerts (user_id, read, created_at desc);
  end if;
end $$;

-- Enable Row Level Security
alter table public.portfolio_snapshots enable row level security;
alter table public.portfolio_risk_scores enable row level security;
alter table public.portfolio_recommendations enable row level security;
alter table public.portfolio_forecasts enable row level security;
alter table public.portfolio_alerts enable row level security;

-- RLS Policies: portfolio_snapshots
drop policy if exists "portfolio_snapshots_read" on public.portfolio_snapshots;
create policy "portfolio_snapshots_read"
  on public.portfolio_snapshots
  for select
  using (auth.uid() = user_id);

drop policy if exists "portfolio_snapshots_insert" on public.portfolio_snapshots;
create policy "portfolio_snapshots_insert"
  on public.portfolio_snapshots
  for insert
  with check (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies: portfolio_risk_scores
drop policy if exists "portfolio_risk_scores_read" on public.portfolio_risk_scores;
create policy "portfolio_risk_scores_read"
  on public.portfolio_risk_scores
  for select
  using (auth.uid() = user_id);

drop policy if exists "portfolio_risk_scores_insert" on public.portfolio_risk_scores;
create policy "portfolio_risk_scores_insert"
  on public.portfolio_risk_scores
  for insert
  with check (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies: portfolio_recommendations
drop policy if exists "portfolio_recommendations_read" on public.portfolio_recommendations;
create policy "portfolio_recommendations_read"
  on public.portfolio_recommendations
  for select
  using (auth.uid() = user_id);

drop policy if exists "portfolio_recommendations_insert" on public.portfolio_recommendations;
create policy "portfolio_recommendations_insert"
  on public.portfolio_recommendations
  for insert
  with check (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "portfolio_recommendations_update" on public.portfolio_recommendations;
create policy "portfolio_recommendations_update"
  on public.portfolio_recommendations
  for update
  using (auth.uid() = user_id);

-- RLS Policies: portfolio_forecasts
drop policy if exists "portfolio_forecasts_read" on public.portfolio_forecasts;
create policy "portfolio_forecasts_read"
  on public.portfolio_forecasts
  for select
  using (auth.uid() = user_id);

drop policy if exists "portfolio_forecasts_insert" on public.portfolio_forecasts;
create policy "portfolio_forecasts_insert"
  on public.portfolio_forecasts
  for insert
  with check (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies: portfolio_alerts
drop policy if exists "portfolio_alerts_read" on public.portfolio_alerts;
create policy "portfolio_alerts_read"
  on public.portfolio_alerts
  for select
  using (auth.uid() = user_id);

drop policy if exists "portfolio_alerts_insert" on public.portfolio_alerts;
create policy "portfolio_alerts_insert"
  on public.portfolio_alerts
  for insert
  with check (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "portfolio_alerts_update" on public.portfolio_alerts;
create policy "portfolio_alerts_update"
  on public.portfolio_alerts
  for update
  using (auth.uid() = user_id);

-- Function to get latest portfolio snapshot for a user
create or replace function get_latest_portfolio_snapshot(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  total_balance numeric,
  spot_balance jsonb,
  futures_positions jsonb,
  exposure jsonb,
  total_exposure numeric,
  leverage_used numeric,
  unrealized_pnl numeric,
  created_at timestamptz
) as $$
begin
  return query
  select
    ps.id,
    ps.user_id,
    ps.total_balance,
    ps.spot_balance,
    ps.futures_positions,
    ps.exposure,
    ps.total_exposure,
    ps.leverage_used,
    ps.unrealized_pnl,
    ps.created_at
  from public.portfolio_snapshots ps
  where ps.user_id = p_user_id
  order by ps.created_at desc
  limit 1;
end;
$$ language plpgsql security definer;

-- Function to get latest risk score for a user
create or replace function get_latest_risk_score(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  risk_level text,
  overall_score numeric,
  ai_comment text,
  created_at timestamptz
) as $$
begin
  return query
  select
    prs.id,
    prs.user_id,
    prs.risk_level,
    prs.overall_score,
    prs.ai_comment,
    prs.created_at
  from public.portfolio_risk_scores prs
  where prs.user_id = p_user_id
  order by prs.created_at desc
  limit 1;
end;
$$ language plpgsql security definer;

