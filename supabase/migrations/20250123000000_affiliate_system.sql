-- ============================================
-- Phase 11A: Cylendra Influence Economy
-- Referral + Loyalty + Token + CPU System
-- ============================================

-- ============================================
-- 1. Affiliates Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  affiliate_key text UNIQUE NOT NULL,
  referral_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  influence_weight numeric(12, 2) DEFAULT 0 NOT NULL,
  total_referrals integer DEFAULT 0 NOT NULL,
  active_referrals integer DEFAULT 0 NOT NULL,
  total_earnings_usd numeric(12, 2) DEFAULT 0 NOT NULL,
  pending_earnings_usd numeric(12, 2) DEFAULT 0 NOT NULL,
  total_lp_earned bigint DEFAULT 0 NOT NULL,
  total_cpu_units numeric(12, 4) DEFAULT 0 NOT NULL,
  total_tokens_earned numeric(12, 4) DEFAULT 0 NOT NULL,
  cpa_rate_usd numeric(5, 2) DEFAULT 5.00 NOT NULL,
  revenue_share_pct numeric(5, 2) DEFAULT 15.00 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_key ON public.affiliates(affiliate_key);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_influence_weight ON public.affiliates(influence_weight DESC);

-- ============================================
-- 2. Affiliate Users (Referrals)
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_source text NOT NULL CHECK (referral_source IN ('link', 'code', 'utm', 'pixel', 'qr')),
  referral_link text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address inet,
  device_id text,
  browser_fingerprint text,
  fraud_score numeric(3, 2) DEFAULT 0.00,
  fraud_flags jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'rejected', 'fraud')),
  is_premium boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  first_activity_at timestamptz,
  last_activity_at timestamptz,
  bot_activated boolean DEFAULT false NOT NULL,
  backtest_count integer DEFAULT 0 NOT NULL,
  total_volume_usd numeric(12, 2) DEFAULT 0 NOT NULL,
  cpa_earned_usd numeric(10, 2) DEFAULT 0 NOT NULL,
  revenue_share_earned_usd numeric(10, 2) DEFAULT 0 NOT NULL,
  lp_earned bigint DEFAULT 0 NOT NULL,
  cpu_units_earned numeric(12, 4) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_affiliate_users_affiliate_id ON public.affiliate_users(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_referred_user_id ON public.affiliate_users(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_status ON public.affiliate_users(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_is_active ON public.affiliate_users(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_created_at ON public.affiliate_users(created_at DESC);

-- ============================================
-- 3. Affiliate Rewards (Earnings History)
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  affiliate_user_id uuid REFERENCES public.affiliate_users(id) ON DELETE SET NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('cpa', 'revenue_share', 'bonus', 'mission', 'leaderboard')),
  amount_usd numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  period_start date,
  period_end date,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  approved_at timestamptz,
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_affiliate_rewards_affiliate_id ON public.affiliate_rewards(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_rewards_status ON public.affiliate_rewards(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_rewards_created_at ON public.affiliate_rewards(created_at DESC);

-- ============================================
-- 4. LP Transactions (Loyalty Points)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'expire', 'transfer', 'bonus')),
  lp_amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  source text NOT NULL CHECK (source IN ('referral', 'subscription', 'bot_activity', 'volume', 'mission', 'leaderboard', 'purchase', 'redemption')),
  source_id uuid,
  description text,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lp_transactions_user_id ON public.lp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_affiliate_id ON public.lp_transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_created_at ON public.lp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_source ON public.lp_transactions(source);

-- ============================================
-- 5. CPU Units (Profit Sharing Units)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cpu_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  units numeric(12, 4) NOT NULL,
  allocation_period date NOT NULL,
  weight_at_allocation numeric(12, 2) NOT NULL,
  total_weight_pool numeric(12, 2) NOT NULL,
  profit_pool_usd numeric(12, 2) NOT NULL,
  estimated_value_usd numeric(12, 2),
  status text NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'vested', 'claimed', 'forfeited')),
  vesting_schedule jsonb,
  claimed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cpu_units_affiliate_id ON public.cpu_units(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cpu_units_allocation_period ON public.cpu_units(allocation_period DESC);
CREATE INDEX IF NOT EXISTS idx_cpu_units_status ON public.cpu_units(status);

-- ============================================
-- 6. Token Rewards (Future Token Integration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.token_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  token_amount numeric(12, 4) NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('airdrop', 'staking', 'farming', 'mission', 'leaderboard', 'weight_bonus')),
  source_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'vested', 'claimed', 'forfeited')),
  vesting_schedule jsonb,
  claimed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_rewards_affiliate_id ON public.token_rewards(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_token_rewards_status ON public.token_rewards(status);
CREATE INDEX IF NOT EXISTS idx_token_rewards_created_at ON public.token_rewards(created_at DESC);

-- ============================================
-- 7. Weight History (Influence Weight Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  weight_before numeric(12, 2) NOT NULL,
  weight_after numeric(12, 2) NOT NULL,
  weight_change numeric(12, 2) NOT NULL,
  change_reason text NOT NULL,
  change_source text NOT NULL CHECK (change_source IN ('referral', 'activity', 'volume', 'mission', 'manual', 'decay')),
  source_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_history_affiliate_id ON public.weight_history(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_created_at ON public.weight_history(created_at DESC);

-- ============================================
-- 8. Missions (Gamification Tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_type text NOT NULL CHECK (mission_type IN ('weekly', 'monthly', 'special', 'achievement')),
  title text NOT NULL,
  description text NOT NULL,
  requirements jsonb NOT NULL,
  rewards jsonb NOT NULL, -- {lp: 100, weight: 10, tokens: 50, cpu: 0.5}
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true NOT NULL,
  max_completions integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missions_mission_type ON public.missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_is_active ON public.missions(is_active);
CREATE INDEX IF NOT EXISTS idx_missions_start_date ON public.missions(start_date);

-- ============================================
-- 9. Mission Logs (User Mission Completions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'claimed', 'expired')),
  progress jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  claimed_at timestamptz,
  rewards_claimed jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(affiliate_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_logs_affiliate_id ON public.mission_logs(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_mission_id ON public.mission_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_status ON public.mission_logs(status);

-- ============================================
-- 10. Leaderboard Snapshots (Monthly Rankings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period date NOT NULL, -- YYYY-MM-01 (first day of month)
  period_type text NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  rank integer NOT NULL,
  influence_weight numeric(12, 2) NOT NULL,
  total_referrals integer NOT NULL,
  active_referrals integer NOT NULL,
  total_earnings_usd numeric(12, 2) NOT NULL,
  rewards jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(period, period_type, affiliate_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period ON public.leaderboard_snapshots(period DESC, period_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_rank ON public.leaderboard_snapshots(period DESC, period_type, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_affiliate_id ON public.leaderboard_snapshots(affiliate_id);

-- ============================================
-- 11. Affiliate Campaigns (UTM Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  campaign_name text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referral_link text NOT NULL,
  qr_code_url text,
  pixel_code text,
  is_active boolean DEFAULT true NOT NULL,
  clicks integer DEFAULT 0 NOT NULL,
  conversions integer DEFAULT 0 NOT NULL,
  conversion_rate numeric(5, 2) DEFAULT 0.00,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_affiliate_id ON public.affiliate_campaigns(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_is_active ON public.affiliate_campaigns(is_active);

-- ============================================
-- 12. LP Redemptions (Spending LP)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lp_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redemption_type text NOT NULL CHECK (redemption_type IN ('discount', 'subscription', 'service', 'backtest', 'ai_tool', 'token', 'cpu')),
  lp_cost bigint NOT NULL,
  value_usd numeric(10, 2),
  item_id uuid,
  item_details jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'redeemed', 'cancelled', 'expired')),
  expires_at timestamptz,
  redeemed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lp_redemptions_user_id ON public.lp_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_redemptions_status ON public.lp_redemptions(status);

-- ============================================
-- RLS Policies
-- ============================================

-- Affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate account"
  ON public.affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate account"
  ON public.affiliates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate account"
  ON public.affiliates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Affiliate Users
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their referrals"
  ON public.affiliate_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = affiliate_users.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- Affiliate Rewards
ALTER TABLE public.affiliate_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their rewards"
  ON public.affiliate_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = affiliate_rewards.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- LP Transactions
ALTER TABLE public.lp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own LP transactions"
  ON public.lp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- CPU Units
ALTER TABLE public.cpu_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their CPU units"
  ON public.cpu_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = cpu_units.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- Token Rewards
ALTER TABLE public.token_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their token rewards"
  ON public.token_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = token_rewards.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- Weight History
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their weight history"
  ON public.weight_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = weight_history.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- Mission Logs
ALTER TABLE public.mission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their mission logs"
  ON public.mission_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = mission_logs.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- Leaderboard (public read)
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Missions (public read)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active missions"
  ON public.missions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Affiliate Campaigns
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can manage their campaigns"
  ON public.affiliate_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = affiliate_campaigns.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- LP Redemptions
ALTER TABLE public.lp_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.lp_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_users_updated_at
  BEFORE UPDATE ON public.affiliate_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mission_logs_updated_at
  BEFORE UPDATE ON public.mission_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_campaigns_updated_at
  BEFORE UPDATE ON public.affiliate_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate affiliate key and referral code
CREATE OR REPLACE FUNCTION public.generate_affiliate_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.affiliate_key IS NULL THEN
    NEW.affiliate_key = 'AFF-' || upper(substring(md5(random()::text || NEW.user_id::text) from 1 for 8));
  END IF;
  
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = upper(substring(md5(random()::text || NEW.user_id::text) from 1 for 6));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_affiliate_codes_trigger
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_affiliate_codes();

-- Comments
COMMENT ON TABLE public.affiliates IS 'Affiliate accounts with referral tracking and earnings';
COMMENT ON TABLE public.affiliate_users IS 'Users referred by affiliates with fraud detection';
COMMENT ON TABLE public.affiliate_rewards IS 'Earnings history for affiliates (CPA + Revenue Share)';
COMMENT ON TABLE public.lp_transactions IS 'Loyalty Points transactions (earn/spend)';
COMMENT ON TABLE public.cpu_units IS 'CPU Units for profit sharing allocation';
COMMENT ON TABLE public.token_rewards IS 'Token rewards for future token integration';
COMMENT ON TABLE public.weight_history IS 'Influence Weight change history';
COMMENT ON TABLE public.missions IS 'Gamification missions/tasks';
COMMENT ON TABLE public.mission_logs IS 'User mission completion tracking';
COMMENT ON TABLE public.leaderboard_snapshots IS 'Monthly leaderboard rankings';
COMMENT ON TABLE public.affiliate_campaigns IS 'UTM campaign tracking for affiliates';
COMMENT ON TABLE public.lp_redemptions IS 'LP redemption/spending records';

