-- Market Intelligence Layer Tables
-- Phase X.9 - AI Market Intelligence Layer

-- 1. Market Sentiment Snapshots Table
create table if not exists public.market_sentiment_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,             -- e.g. "fear_greed", "social_index", "funding_bias"
  value numeric not null,            -- 0-100
  label text,                        -- e.g. "Extreme Fear", "Greed", "Neutral"
  metadata jsonb,                    -- raw payload from API
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.market_sentiment_snapshots is 'Stores market sentiment snapshots from various sources';

create index if not exists market_sentiment_created_idx
  on public.market_sentiment_snapshots (created_at desc);

create index if not exists market_sentiment_source_idx
  on public.market_sentiment_snapshots (source, created_at desc);

-- 2. Funding Rates Table
create table if not exists public.funding_rates (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,            -- "binance", "okx"
  symbol text not null,              -- "BTCUSDT", "ETHUSDT"
  funding_rate numeric not null,     -- e.g. 0.0001 (0.01%)
  next_funding_time timestamptz,
  mark_price numeric,
  open_interest numeric,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.funding_rates is 'Stores funding rates for perpetual futures contracts';

create index if not exists funding_rates_symbol_idx
  on public.funding_rates (symbol, created_at desc);

create index if not exists funding_rates_exchange_symbol_idx
  on public.funding_rates (exchange, symbol, created_at desc);

-- 3. Market Heatmap Metrics Table
create table if not exists public.market_heatmap_metrics (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  timeframe text not null,           -- "1h", "4h", "1d"
  price_change_24h numeric,          -- percentage change
  volume_24h numeric,
  volatility_score numeric,          -- 0-100
  trend_score numeric,               -- 0-100
  activity_score numeric,            -- volume + open interest + volatility combined
  heat_label text,                   -- "HOT", "WARM", "COOL", "COLD"
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.market_heatmap_metrics is 'Stores market heatmap metrics for symbols';

create index if not exists market_heatmap_symbol_idx
  on public.market_heatmap_metrics (symbol, timeframe, created_at desc);

create index if not exists market_heatmap_heat_label_idx
  on public.market_heatmap_metrics (heat_label, created_at desc);

-- 4. Asset Risk Profiles Table
create table if not exists public.asset_risk_profiles (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  base_risk_level text not null,     -- "LOW", "MEDIUM", "HIGH", "EXTREME"
  volatility_score numeric,          -- 0-100
  liquidity_score numeric,           -- 0-100
  leverage_recommendation numeric,  -- recommended max leverage (e.g. 3, 5, 10)
  position_size_factor numeric,      -- factor to scale bet size (0.1-1.0)
  sentiment_bias text,              -- "BULLISH", "BEARISH", "NEUTRAL"
  data_window jsonb,                -- summary of last X days
  metadata jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.asset_risk_profiles is 'Stores risk profiles for each asset/symbol';

create unique index if not exists asset_risk_profiles_symbol_uniq
  on public.asset_risk_profiles (symbol);

create index if not exists asset_risk_profiles_risk_level_idx
  on public.asset_risk_profiles (base_risk_level);

-- Enable Row Level Security
alter table public.market_sentiment_snapshots enable row level security;
alter table public.funding_rates enable row level security;
alter table public.market_heatmap_metrics enable row level security;
alter table public.asset_risk_profiles enable row level security;

-- RLS Policies: All users can read market intelligence data (public data)
-- Only service role can write

-- Market Sentiment Snapshots
drop policy if exists "market_sentiment_read" on public.market_sentiment_snapshots;
create policy "market_sentiment_read"
  on public.market_sentiment_snapshots
  for select
  using (true);

drop policy if exists "market_sentiment_insert" on public.market_sentiment_snapshots;
create policy "market_sentiment_insert"
  on public.market_sentiment_snapshots
  for insert
  with check (true);

-- Funding Rates
drop policy if exists "funding_rates_read" on public.funding_rates;
create policy "funding_rates_read"
  on public.funding_rates
  for select
  using (true);

drop policy if exists "funding_rates_insert" on public.funding_rates;
create policy "funding_rates_insert"
  on public.funding_rates
  for insert
  with check (true);

-- Market Heatmap Metrics
drop policy if exists "market_heatmap_read" on public.market_heatmap_metrics;
create policy "market_heatmap_read"
  on public.market_heatmap_metrics
  for select
  using (true);

drop policy if exists "market_heatmap_insert" on public.market_heatmap_metrics;
create policy "market_heatmap_insert"
  on public.market_heatmap_metrics
  for insert
  with check (true);

-- Asset Risk Profiles
drop policy if exists "asset_risk_profiles_read" on public.asset_risk_profiles;
create policy "asset_risk_profiles_read"
  on public.asset_risk_profiles
  for select
  using (true);

drop policy if exists "asset_risk_profiles_upsert" on public.asset_risk_profiles;
create policy "asset_risk_profiles_upsert"
  on public.asset_risk_profiles
  for all
  using (true)
  with check (true);

-- Trigger to update updated_at for asset_risk_profiles
create or replace function public.update_asset_risk_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_asset_risk_profiles_updated on public.asset_risk_profiles;

create trigger trg_asset_risk_profiles_updated
  before update on public.asset_risk_profiles
  for each row execute function public.update_asset_risk_profiles_updated_at();

