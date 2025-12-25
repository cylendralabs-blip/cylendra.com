-- Phase 18: Create strategy_trades table
-- This table enables strategy pages/hooks to work with real data instead of placeholders

-- Check if table exists, if not create it
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'strategy_trades') then
    create table public.strategy_trades (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      strategy_id uuid not null,
      position_id uuid,
      exchange text not null check (exchange in ('binance', 'okx', 'bybit', 'kucoin')),
      symbol text not null,
      side text not null check (side in ('long', 'short', 'buy', 'sell')),
      volume numeric(30, 10) not null,
      entry_price numeric(30, 10) not null,
      exit_price numeric(30, 10),
      pnl_amount numeric(30, 10),
      pnl_percentage numeric(10, 4),
      opened_at timestamptz not null,
      closed_at timestamptz,
      status text not null check (status in ('open', 'closed', 'stopped', 'liquidated')),
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    -- Add foreign key to positions table only if it exists
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'positions') then
      alter table public.strategy_trades add constraint strategy_trades_position_id_fkey foreign key (position_id) references public.positions(id);
    end if;
  else
    -- Table exists, add missing columns if they don't exist
    -- Add all required columns one by one
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'strategy_id') then
      alter table public.strategy_trades add column strategy_id uuid not null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'position_id') then
      alter table public.strategy_trades add column position_id uuid;
      -- Add foreign key only if positions table exists
      if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'positions') then
        alter table public.strategy_trades add constraint strategy_trades_position_id_fkey foreign key (position_id) references public.positions(id);
      end if;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'exchange') then
      alter table public.strategy_trades add column exchange text;
      alter table public.strategy_trades add constraint strategy_trades_exchange_check check (exchange in ('binance', 'okx', 'bybit', 'kucoin'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'symbol') then
      alter table public.strategy_trades add column symbol text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'side') then
      alter table public.strategy_trades add column side text;
      alter table public.strategy_trades add constraint strategy_trades_side_check check (side in ('long', 'short', 'buy', 'sell'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'volume') then
      alter table public.strategy_trades add column volume numeric(30, 10);
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'entry_price') then
      alter table public.strategy_trades add column entry_price numeric(30, 10);
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'exit_price') then
      alter table public.strategy_trades add column exit_price numeric(30, 10);
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'pnl_amount') then
      alter table public.strategy_trades add column pnl_amount numeric(30, 10);
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'pnl_percentage') then
      alter table public.strategy_trades add column pnl_percentage numeric(10, 4);
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'opened_at') then
      alter table public.strategy_trades add column opened_at timestamptz;
      -- Set default value for existing rows
      update public.strategy_trades set opened_at = created_at where opened_at is null;
      -- Make it not null after setting defaults
      alter table public.strategy_trades alter column opened_at set not null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'closed_at') then
      alter table public.strategy_trades add column closed_at timestamptz;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'status') then
      alter table public.strategy_trades add column status text;
      alter table public.strategy_trades add constraint strategy_trades_status_check check (status in ('open', 'closed', 'stopped', 'liquidated'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'strategy_trades' and column_name = 'updated_at') then
      alter table public.strategy_trades add column updated_at timestamptz default now();
    end if;
    
    -- Create indexes after ensuring columns exist
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'strategy_trades' and indexname = 'strategy_trades_user_id_idx') then
      create index strategy_trades_user_id_idx on public.strategy_trades(user_id);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'strategy_trades' and indexname = 'strategy_trades_strategy_id_idx') then
      create index strategy_trades_strategy_id_idx on public.strategy_trades(strategy_id);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'strategy_trades' and indexname = 'strategy_trades_status_idx') then
      create index strategy_trades_status_idx on public.strategy_trades(status);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'strategy_trades' and indexname = 'strategy_trades_opened_at_idx') then
      create index strategy_trades_opened_at_idx on public.strategy_trades(opened_at);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'strategy_trades' and indexname = 'strategy_trades_symbol_idx') then
      create index strategy_trades_symbol_idx on public.strategy_trades(symbol);
    end if;
  end if;
end $$;

-- Indexes for performance (if table was just created)
create index if not exists strategy_trades_user_id_idx on public.strategy_trades(user_id);
create index if not exists strategy_trades_strategy_id_idx on public.strategy_trades(strategy_id);
create index if not exists strategy_trades_status_idx on public.strategy_trades(status);
create index if not exists strategy_trades_opened_at_idx on public.strategy_trades(opened_at);
create index if not exists strategy_trades_symbol_idx on public.strategy_trades(symbol);

-- Enable RLS
alter table public.strategy_trades enable row level security;

-- RLS Policies (drop and recreate to ensure they're correct)
drop policy if exists "Users can see own strategy trades" on public.strategy_trades;
create policy "Users can see own strategy trades"
  on public.strategy_trades
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own strategy trades" on public.strategy_trades;
create policy "Users can insert own strategy trades"
  on public.strategy_trades
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own strategy trades" on public.strategy_trades;
create policy "Users can update own strategy trades"
  on public.strategy_trades
  for update
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function update_strategy_trades_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists strategy_trades_updated_at on public.strategy_trades;
create trigger strategy_trades_updated_at
  before update on public.strategy_trades
  for each row
  execute function update_strategy_trades_updated_at();

