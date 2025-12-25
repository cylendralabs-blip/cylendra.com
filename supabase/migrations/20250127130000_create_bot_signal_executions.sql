-- Bot Signal Executions Logging Table
-- Phase X.6 - Bot Execution Integration

create table if not exists public.bot_signal_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bot_id uuid references public.bot_settings(user_id) on delete set null,
  signal_id text not null,
  signal_source text not null check (signal_source in ('ai', 'tradingview', 'legacy')),
  symbol text not null,
  timeframe text not null,
  side text not null check (side in ('BUY', 'SELL')),
  confidence numeric,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  execution_status text not null check (execution_status in ('PENDING', 'FILTERED', 'EXECUTING', 'EXECUTED', 'FAILED', 'IGNORED')),
  execution_reason text,
  trade_id uuid,
  error_message text,
  risk_flags text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.bot_signal_executions is 'Logs all signal execution attempts for bots';

create index if not exists bot_signal_executions_user_id_idx on public.bot_signal_executions (user_id);
create index if not exists bot_signal_executions_signal_source_idx on public.bot_signal_executions (signal_source);
create index if not exists bot_signal_executions_execution_status_idx on public.bot_signal_executions (execution_status);
create index if not exists bot_signal_executions_created_at_idx on public.bot_signal_executions (created_at);
create index if not exists bot_signal_executions_symbol_idx on public.bot_signal_executions (symbol);

alter table public.bot_signal_executions
  enable row level security;

drop policy if exists "bot_signal_executions_self" on public.bot_signal_executions;

create policy "bot_signal_executions_self"
  on public.bot_signal_executions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_bot_signal_executions_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bot_signal_executions_updated on public.bot_signal_executions;

create trigger trg_bot_signal_executions_updated
  before update on public.bot_signal_executions
  for each row execute function public.update_bot_signal_executions_updated_at();

