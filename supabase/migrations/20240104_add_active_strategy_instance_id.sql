-- Migration: Add active_strategy_instance_id to bot_settings
-- Phase 3: Backend Implementation - Bot Start/Stop Logic
-- Date: 2024-12-23

-- Add active_strategy_instance_id column
-- This locks the exact strategy version used during the active run
alter table public.bot_settings
add column if not exists active_strategy_instance_id uuid references public.strategy_instances(id) on delete set null;

-- Add index for performance
create index if not exists idx_bot_settings_active_strategy_instance 
on public.bot_settings(active_strategy_instance_id);

-- Add error_message column for storing bot errors
alter table public.bot_settings
add column if not exists error_message text;

-- Add last_started_at and last_stopped_at for tracking
alter table public.bot_settings
add column if not exists last_started_at timestamptz;

alter table public.bot_settings
add column if not exists last_stopped_at timestamptz;

-- Add comments
comment on column public.bot_settings.active_strategy_instance_id is 'The exact strategy instance version locked during the current/last bot run';
comment on column public.bot_settings.error_message is 'Last error message if status is ERROR';
comment on column public.bot_settings.last_started_at is 'Timestamp when bot was last started';
comment on column public.bot_settings.last_stopped_at is 'Timestamp when bot was last stopped';

