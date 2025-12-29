-- Phase X.11 — AI Trade Forecasting Engine
-- Database tables for forecasting layer

-- 1. signal_outcomes table (Historical signal results)
create table if not exists public.signal_outcomes (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid,                     -- Reference to trading_signals/ai_signals_history
  user_id uuid references auth.users(id) on delete set null,
  symbol text not null,
  timeframe text not null,
  side text not null,                 -- BUY / SELL
  ai_score numeric,
  technical_score numeric,
  volume_score numeric,
  pattern_score numeric,
  wave_score numeric,
  sentiment_score numeric,
  risk_level text,                    -- LOW, MEDIUM, HIGH, EXTREME
  entered_at timestamptz,             -- Trade entry time
  exited_at timestamptz,              -- Trade exit time
  holding_duration_seconds integer,  -- Trade duration
  entry_price numeric,
  exit_price numeric,
  max_favorable_excursion numeric,    -- Max profit % during trade (optional)
  max_adverse_excursion numeric,      -- Max drawdown % during trade (optional)
  profit_loss_percentage numeric not null, -- Final result %
  result_label text not null,         -- "WIN", "LOSS", "BREAKEVEN"
  signal_source text,                 -- "ai", "tradingview", "legacy", "realtime_ai"
  metadata jsonb,                     -- Additional data
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.signal_outcomes is 'Historical signal execution results for forecasting model training';

create index if not exists signal_outcomes_signal_idx
  on public.signal_outcomes (signal_id);

create index if not exists signal_outcomes_symbol_idx
  on public.signal_outcomes (symbol, timeframe, created_at desc);

create index if not exists signal_outcomes_user_idx
  on public.signal_outcomes (user_id, created_at desc);

create index if not exists signal_outcomes_result_idx
  on public.signal_outcomes (result_label, created_at desc);

-- 2. signal_forecasts table (Forecast outputs)
create table if not exists public.signal_forecasts (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid,                      -- Reference to trading_signals/ai_signals_history
  user_id uuid references auth.users(id) on delete set null,
  symbol text not null,
  timeframe text not null,
  side text not null,
  forecast_model_version text not null default 'v1.0',
  success_probability numeric not null,      -- 0-100
  expected_return_pct numeric,               -- Expected return %
  expected_holding_seconds integer,          -- Expected trade duration
  risk_adjusted_score numeric,               -- Composite risk-adjusted score
  forecast_label text not null,              -- "HIGH", "MEDIUM", "LOW"
  features_snapshot jsonb,                   -- Snapshot of features used
  metadata jsonb,                            -- Additional forecast data
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.signal_forecasts is 'AI forecast predictions for signals';

create index if not exists signal_forecasts_signal_idx
  on public.signal_forecasts (signal_id);

create index if not exists signal_forecasts_symbol_idx
  on public.signal_forecasts (symbol, timeframe, created_at desc);

create index if not exists signal_forecasts_user_idx
  on public.signal_forecasts (user_id, created_at desc);

create index if not exists signal_forecasts_label_idx
  on public.signal_forecasts (forecast_label, created_at desc);

-- Enable Row Level Security
alter table public.signal_outcomes enable row level security;
alter table public.signal_forecasts enable row level security;

-- RLS Policies: signal_outcomes
drop policy if exists "signal_outcomes_read" on public.signal_outcomes;
create policy "signal_outcomes_read"
  on public.signal_outcomes
  for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "signal_outcomes_write" on public.signal_outcomes;
create policy "signal_outcomes_write"
  on public.signal_outcomes
  for all
  using (true)
  with check (true);

-- RLS Policies: signal_forecasts
drop policy if exists "signal_forecasts_read" on public.signal_forecasts;
create policy "signal_forecasts_read"
  on public.signal_forecasts
  for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "signal_forecasts_write" on public.signal_forecasts;
create policy "signal_forecasts_write"
  on public.signal_forecasts
  for all
  using (true)
  with check (true);

