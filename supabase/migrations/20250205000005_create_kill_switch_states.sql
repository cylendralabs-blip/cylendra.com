-- Phase 18: Create kill_switch_states table
-- Track kill switch state for each user and risk type

-- Check if table exists, if not create it
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'kill_switch_states') then
    create table public.kill_switch_states (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      exchange text not null,
      symbol text,
      is_active boolean not null default false,
      reason text,
      triggered_at timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(user_id, exchange, symbol)
    );
  else
    -- Table exists, add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kill_switch_states' and column_name = 'exchange') then
      alter table public.kill_switch_states add column exchange text;
      -- Set default value for existing rows
      update public.kill_switch_states set exchange = 'binance' where exchange is null;
      -- Make it not null after setting defaults
      alter table public.kill_switch_states alter column exchange set not null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kill_switch_states' and column_name = 'symbol') then
      alter table public.kill_switch_states add column symbol text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kill_switch_states' and column_name = 'updated_at') then
      alter table public.kill_switch_states add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- Indexes (create inside DO block if table was just created, or outside as backup)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'kill_switch_states') then
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'kill_switch_states' and indexname = 'kill_switch_states_user_id_idx') then
      create index kill_switch_states_user_id_idx on public.kill_switch_states(user_id);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'kill_switch_states' and indexname = 'kill_switch_states_is_active_idx') then
      create index kill_switch_states_is_active_idx on public.kill_switch_states(is_active);
    end if;
    
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'kill_switch_states' and indexname = 'kill_switch_states_exchange_idx') then
      create index kill_switch_states_exchange_idx on public.kill_switch_states(exchange);
    end if;
  end if;
end $$;

-- Indexes (backup - will be skipped if already created)
create index if not exists kill_switch_states_user_id_idx on public.kill_switch_states(user_id);
create index if not exists kill_switch_states_is_active_idx on public.kill_switch_states(is_active);
create index if not exists kill_switch_states_exchange_idx on public.kill_switch_states(exchange);

-- Enable RLS
alter table public.kill_switch_states enable row level security;

-- RLS Policies (drop and recreate to ensure they're correct)
drop policy if exists "Users can see own kill switch" on public.kill_switch_states;
create policy "Users can see own kill switch"
  on public.kill_switch_states
  for select
  using (auth.uid() = user_id);

drop policy if exists "System can insert kill switch states" on public.kill_switch_states;
create policy "System can insert kill switch states"
  on public.kill_switch_states
  for insert
  with check (true);

drop policy if exists "System can update kill switch states" on public.kill_switch_states;
create policy "System can update kill switch states"
  on public.kill_switch_states
  for update
  using (true);

-- Trigger to update updated_at
create or replace function update_kill_switch_states_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kill_switch_states_updated_at on public.kill_switch_states;
create trigger kill_switch_states_updated_at
  before update on public.kill_switch_states
  for each row
  execute function update_kill_switch_states_updated_at();

