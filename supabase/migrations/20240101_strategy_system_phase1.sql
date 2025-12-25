-- ============================================================================
-- Orbitra AI - Strategy System Phase 1
-- ============================================================================
-- This migration creates the foundation for a professional strategy system
-- with versioning, template-instance separation, and multi-bot support.
-- ============================================================================

-- ============================================================================
-- 1. STRATEGY TEMPLATES TABLE
-- ============================================================================
-- System-level strategy definitions (Grid, DCA, Momentum, etc.)
-- These are owned by the system, not by users
-- ============================================================================

create table if not exists public.strategy_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                    -- e.g. "grid_classic", "dca_basic"
  name text not null,                          -- Display name: "Grid Trading Classic"
  category text not null,                      -- DCA, GRID, MOMENTUM, ARBITRAGE, etc
  description text,
  icon text,                                   -- Icon name for UI
  risk_level text not null default 'medium',  -- low, medium, high
  
  -- Schema defines the configuration fields for this strategy type
  schema jsonb not null default '{}'::jsonb,
  
  -- Default configuration values
  default_config jsonb not null default '{}'::jsonb,
  
  -- Feature flags
  supports_spot boolean not null default true,
  supports_futures boolean not null default false,
  supports_leverage boolean not null default false,
  
  -- Status
  is_active boolean not null default true,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_strategy_templates_key on public.strategy_templates(key);
create index if not exists idx_strategy_templates_category on public.strategy_templates(category);
create index if not exists idx_strategy_templates_active on public.strategy_templates(is_active);

-- ============================================================================
-- 2. STRATEGY INSTANCES TABLE
-- ============================================================================
-- User-created strategy configurations with versioning support
-- Each edit creates a new version instead of overwriting
-- ============================================================================

create table if not exists public.strategy_instances (
  id uuid primary key default gen_random_uuid(),
  
  -- Ownership
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Template reference
  template_id uuid not null references public.strategy_templates(id) on delete restrict,
  
  -- Instance details
  name text not null,
  description text,
  
  -- Versioning
  version int not null default 1,
  parent_id uuid references public.strategy_instances(id) on delete set null,
  
  -- Configuration (specific to this instance)
  config jsonb not null,
  
  -- Status
  status text not null default 'active',  -- active, archived, draft
  
  -- Usage tracking
  is_in_use boolean not null default false,  -- Is this instance assigned to any bot?
  last_used_at timestamptz,
  
  -- Performance tracking (optional, for future use)
  performance_data jsonb default '{}'::jsonb,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint valid_status check (status in ('active', 'archived', 'draft'))
);

-- Indexes for performance
create index if not exists idx_strategy_instances_user on public.strategy_instances(user_id);
create index if not exists idx_strategy_instances_template on public.strategy_instances(template_id);
create index if not exists idx_strategy_instances_parent on public.strategy_instances(parent_id);
create index if not exists idx_strategy_instances_status on public.strategy_instances(status);
create index if not exists idx_strategy_instances_in_use on public.strategy_instances(is_in_use);

-- ============================================================================
-- 3. UPDATE BOT SETTINGS TABLE
-- ============================================================================
-- Add strategy_instance_id to link bots to strategy instances
-- Keep strategy_type for backward compatibility (will be deprecated later)
-- ============================================================================

alter table public.bot_settings
add column if not exists strategy_instance_id uuid references public.strategy_instances(id) on delete set null;

create index if not exists idx_bot_settings_strategy_instance on public.bot_settings(strategy_instance_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Strategy Templates: Public read access (all users can see templates)
alter table public.strategy_templates enable row level security;

create policy "strategy_templates_read"
on public.strategy_templates
for select
using (true);

-- Only admins can modify templates (future enhancement)
-- For now, templates are managed via migrations

-- Strategy Instances: User-specific access
alter table public.strategy_instances enable row level security;

create policy "strategy_instances_read"
on public.strategy_instances
for select
using (auth.uid() = user_id);

create policy "strategy_instances_insert"
on public.strategy_instances
for insert
with check (auth.uid() = user_id);

create policy "strategy_instances_update"
on public.strategy_instances
for update
using (auth.uid() = user_id);

create policy "strategy_instances_delete"
on public.strategy_instances
for delete
using (auth.uid() = user_id);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_strategy_templates_updated_at
  before update on public.strategy_templates
  for each row
  execute function public.update_updated_at_column();

create trigger update_strategy_instances_updated_at
  before update on public.strategy_instances
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

