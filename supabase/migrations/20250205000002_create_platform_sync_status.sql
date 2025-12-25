-- Phase 18: Create platform_sync_status table
-- Track synchronization status with trading platforms (Binance/OKX) for each user

create table if not exists public.platform_sync_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange text not null check (exchange in ('binance', 'okx', 'bybit', 'kucoin')),
  last_portfolio_sync_at timestamptz,
  last_positions_sync_at timestamptz,
  last_orders_sync_at timestamptz,
  last_error text,
  status text not null default 'idle'
    check (status in ('idle', 'syncing', 'ok', 'error')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, exchange)
);

-- Indexes
create index if not exists platform_sync_status_user_id_idx on public.platform_sync_status(user_id);
create index if not exists platform_sync_status_exchange_idx on public.platform_sync_status(exchange);
create index if not exists platform_sync_status_status_idx on public.platform_sync_status(status);

-- Enable RLS
alter table public.platform_sync_status enable row level security;

-- RLS Policies
create policy "Users can see own sync status"
  on public.platform_sync_status
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own sync status"
  on public.platform_sync_status
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sync status"
  on public.platform_sync_status
  for update
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function update_platform_sync_status_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger platform_sync_status_updated_at
  before update on public.platform_sync_status
  for each row
  execute function update_platform_sync_status_updated_at();

