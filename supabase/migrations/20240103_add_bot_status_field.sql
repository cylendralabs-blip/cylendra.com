-- ============================================================================
-- Phase 2: Add Bot Status Field
-- ============================================================================
-- Add status field to bot_settings for better runtime state tracking
-- This enables safe strategy switching (Stop/Restart only)
-- ============================================================================

-- Add status column
alter table public.bot_settings
add column if not exists status text not null default 'STOPPED';

-- Add constraint for status values
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bot_settings_status_check'
  ) then
    alter table public.bot_settings
      add constraint bot_settings_status_check
      check (status in ('STOPPED', 'RUNNING', 'PAUSED', 'ERROR'));
  end if;
end $$;

-- Create index for status queries
create index if not exists idx_bot_settings_status on public.bot_settings(status);

-- Sync status with is_active for existing records
-- RUNNING if is_active = true, STOPPED if is_active = false
update public.bot_settings
set status = case
  when is_active = true then 'RUNNING'
  else 'STOPPED'
end
where status = 'STOPPED'; -- Only update if not already set

-- Add comment
comment on column public.bot_settings.status is 'Bot runtime status: STOPPED, RUNNING, PAUSED, ERROR';

