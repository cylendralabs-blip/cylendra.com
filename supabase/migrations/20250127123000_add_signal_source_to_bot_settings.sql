-- Add signal_source column to bot_settings
alter table public.bot_settings
  add column if not exists signal_source text not null default 'ai';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bot_settings_signal_source_check'
  ) then
    alter table public.bot_settings
      add constraint bot_settings_signal_source_check
      check (signal_source in ('ai', 'tradingview', 'legacy'));
  end if;
end $$;

