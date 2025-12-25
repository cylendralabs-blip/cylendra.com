-- Phase X.12 — Community Signals Dashboard + Influencers Ranking System
-- Database tables for community signals and influencers

-- 1. community_signals table
create table if not exists public.community_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  side text not null, -- BUY/SELL
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  confidence numeric, -- 0-100 (user input)
  analysis_text text, -- Analysis description
  source text not null default 'manual', -- manual/twitter/telegram/ai-assisted
  ai_assisted boolean not null default false,
  ai_verification jsonb, -- AI analysis result if verified
  status text not null default 'OPEN', -- OPEN/CLOSED
  result text, -- WIN/LOSS/BREAKEVEN
  pnl_percentage numeric,
  attachments jsonb, -- images/links to Twitter/Telegram
  upvotes integer default 0,
  downvotes integer default 0,
  total_votes integer default 0,
  views integer default 0,
  metadata jsonb, -- Additional data
  created_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.community_signals is 'Community trading signals shared by users';

create index if not exists community_signals_user_idx
  on public.community_signals (user_id, created_at desc);

create index if not exists community_signals_symbol_idx
  on public.community_signals (symbol, created_at desc);

create index if not exists community_signals_status_idx
  on public.community_signals (status, created_at desc);

create index if not exists community_signals_votes_idx
  on public.community_signals (total_votes desc, created_at desc);

-- 2. community_signal_votes table
create table if not exists public.community_signal_votes (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.community_signals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote integer not null, -- +1 (upvote) or -1 (downvote)
  created_at timestamptz not null default timezone('utc', now()),
  unique(signal_id, user_id) -- Prevent duplicate votes
);

comment on table public.community_signal_votes is 'Votes on community signals';

create index if not exists community_signal_votes_signal_idx
  on public.community_signal_votes (signal_id);

create index if not exists community_signal_votes_user_idx
  on public.community_signal_votes (user_id);

-- 3. community_trader_stats table
create table if not exists public.community_trader_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_signals integer default 0,
  closed_signals integer default 0,
  win_count integer default 0,
  loss_count integer default 0,
  breakeven_count integer default 0,
  win_rate numeric default 0, -- percentage
  avg_return numeric default 0, -- average PnL percentage
  total_return numeric default 0, -- sum of all PnL
  reputation_score numeric default 0, -- 0-1000
  lp_points numeric default 0, -- Loyalty Points
  weight numeric default 0, -- Weight for ranking (0-100)
  rank text default 'Newbie', -- Newbie/Skilled/Pro/Elite/Master/Legend
  followers_count integer default 0,
  following_count integer default 0,
  verified boolean default false,
  influencer_level text, -- Bronze/Silver/Gold/Elite (if verified influencer)
  metadata jsonb, -- Additional stats
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.community_trader_stats is 'Statistics and rankings for community traders';

create index if not exists community_trader_stats_reputation_idx
  on public.community_trader_stats (reputation_score desc);

create index if not exists community_trader_stats_rank_idx
  on public.community_trader_stats (rank, reputation_score desc);

create index if not exists community_trader_stats_lp_idx
  on public.community_trader_stats (lp_points desc);

-- 4. verified_influencers table
create table if not exists public.verified_influencers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level text not null, -- Bronze/Silver/Gold/Elite
  verification_date timestamptz not null default timezone('utc', now()),
  social_links jsonb, -- {twitter: "...", telegram: "...", youtube: "..."}
  bio text,
  total_followers integer default 0,
  total_views integer default 0,
  verified_by uuid references auth.users(id), -- Admin who verified
  is_active boolean default true,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.verified_influencers is 'Verified influencers in the community';

create index if not exists verified_influencers_level_idx
  on public.verified_influencers (level, total_followers desc);

create index if not exists verified_influencers_active_idx
  on public.verified_influencers (is_active, level);

-- 5. user_follows table (for following traders)
create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(follower_id, following_id),
  check (follower_id != following_id) -- Can't follow yourself
);

comment on table public.user_follows is 'User follow relationships';

create index if not exists user_follows_follower_idx
  on public.user_follows (follower_id);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id);

-- Enable Row Level Security
alter table public.community_signals enable row level security;
alter table public.community_signal_votes enable row level security;
alter table public.community_trader_stats enable row level security;
alter table public.verified_influencers enable row level security;
alter table public.user_follows enable row level security;

-- RLS Policies: community_signals
drop policy if exists "community_signals_read" on public.community_signals;
create policy "community_signals_read"
  on public.community_signals
  for select
  using (true); -- Everyone can read

drop policy if exists "community_signals_insert" on public.community_signals;
create policy "community_signals_insert"
  on public.community_signals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "community_signals_update" on public.community_signals;
create policy "community_signals_update"
  on public.community_signals
  for update
  using (auth.uid() = user_id);

-- RLS Policies: community_signal_votes
drop policy if exists "community_signal_votes_read" on public.community_signal_votes;
create policy "community_signal_votes_read"
  on public.community_signal_votes
  for select
  using (true);

drop policy if exists "community_signal_votes_insert" on public.community_signal_votes;
create policy "community_signal_votes_insert"
  on public.community_signal_votes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "community_signal_votes_delete" on public.community_signal_votes;
create policy "community_signal_votes_delete"
  on public.community_signal_votes
  for delete
  using (auth.uid() = user_id);

-- RLS Policies: community_trader_stats
drop policy if exists "community_trader_stats_read" on public.community_trader_stats;
create policy "community_trader_stats_read"
  on public.community_trader_stats
  for select
  using (true); -- Everyone can read stats

drop policy if exists "community_trader_stats_update" on public.community_trader_stats;
create policy "community_trader_stats_update"
  on public.community_trader_stats
  for update
  using (auth.uid() = user_id or auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies: verified_influencers
drop policy if exists "verified_influencers_read" on public.verified_influencers;
create policy "verified_influencers_read"
  on public.verified_influencers
  for select
  using (true);

drop policy if exists "verified_influencers_insert" on public.verified_influencers;
create policy "verified_influencers_insert"
  on public.verified_influencers
  for insert
  with check (auth.jwt() ->> 'role' = 'service_role' or auth.uid() = user_id);

-- RLS Policies: user_follows
drop policy if exists "user_follows_read" on public.user_follows;
create policy "user_follows_read"
  on public.user_follows
  for select
  using (true);

drop policy if exists "user_follows_insert" on public.user_follows;
create policy "user_follows_insert"
  on public.user_follows
  for insert
  with check (auth.uid() = follower_id);

drop policy if exists "user_follows_delete" on public.user_follows;
create policy "user_follows_delete"
  on public.user_follows
  for delete
  using (auth.uid() = follower_id);

-- Function to update signal vote counts
create or replace function update_signal_vote_counts()
returns trigger as $$
begin
  update public.community_signals
  set
    upvotes = (
      select count(*)::integer
      from public.community_signal_votes
      where signal_id = new.signal_id and vote = 1
    ),
    downvotes = (
      select count(*)::integer
      from public.community_signal_votes
      where signal_id = new.signal_id and vote = -1
    ),
    total_votes = (
      select count(*)::integer
      from public.community_signal_votes
      where signal_id = new.signal_id
    ),
    updated_at = timezone('utc', now())
  where id = new.signal_id;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger update_signal_vote_counts_trigger
  after insert or update or delete on public.community_signal_votes
  for each row
  execute function update_signal_vote_counts();

-- Function to update follower counts
create or replace function update_follower_counts()
returns trigger as $$
begin
  -- Update following_id's followers_count
  update public.community_trader_stats
  set followers_count = (
    select count(*)::integer
    from public.user_follows
    where following_id = new.following_id
  )
  where user_id = new.following_id;
  
  -- Update follower_id's following_count
  update public.community_trader_stats
  set following_count = (
    select count(*)::integer
    from public.user_follows
    where follower_id = new.follower_id
  )
  where user_id = new.follower_id;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger update_follower_counts_trigger
  after insert or delete on public.user_follows
  for each row
  execute function update_follower_counts();

