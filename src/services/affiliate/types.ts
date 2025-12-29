/**
 * Affiliate System Types
 * 
 * Type definitions for Phase 11A: Influence Economy
 */

/**
 * Affiliate Status
 */
export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'banned';

/**
 * Affiliate Tier
 */
export type AffiliateTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * Referral Source
 */
export type ReferralSource = 'link' | 'code' | 'utm' | 'pixel' | 'qr';

/**
 * Reward Type
 */
export type RewardType = 'cpa' | 'revenue_share' | 'bonus' | 'mission' | 'leaderboard';

/**
 * LP Transaction Type
 */
export type LPTransactionType = 'earn' | 'spend' | 'expire' | 'transfer' | 'bonus';

/**
 * LP Source
 */
export type LPSource = 'referral' | 'subscription' | 'bot_activity' | 'volume' | 'mission' | 'leaderboard' | 'purchase' | 'redemption';

/**
 * Mission Type
 */
export type MissionType = 'weekly' | 'monthly' | 'special' | 'achievement';

/**
 * Affiliate Account
 */
export interface AffiliateAccount {
  id: string;
  user_id: string;
  affiliate_key: string;
  referral_code: string;
  status: AffiliateStatus;
  tier: AffiliateTier;
  influence_weight: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings_usd: number;
  pending_earnings_usd: number;
  total_lp_earned: number;
  total_cpu_units: number;
  total_tokens_earned: number;
  cpa_rate_usd: number;
  revenue_share_pct: number;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
}

/**
 * Referred User
 */
export interface ReferredUser {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  referral_source: ReferralSource;
  referral_link?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  fraud_score: number;
  fraud_flags: string[];
  status: 'pending' | 'verified' | 'active' | 'rejected' | 'fraud';
  is_premium: boolean;
  is_active: boolean;
  bot_activated: boolean;
  backtest_count: number;
  total_volume_usd: number;
  cpa_earned_usd: number;
  revenue_share_earned_usd: number;
  lp_earned: number;
  cpu_units_earned: number;
  created_at: string;
  verified_at?: string;
}

/**
 * Affiliate Reward
 */
export interface AffiliateReward {
  id: string;
  affiliate_id: string;
  affiliate_user_id?: string;
  reward_type: RewardType;
  amount_usd: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  period_start?: string;
  period_end?: string;
  description?: string;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
}

/**
 * LP Transaction
 */
export interface LPTransaction {
  id: string;
  user_id: string;
  affiliate_id?: string;
  transaction_type: LPTransactionType;
  lp_amount: number;
  balance_after: number;
  source: LPSource;
  source_id?: string;
  description?: string;
  expires_at?: string;
  created_at: string;
}

/**
 * CPU Unit
 */
export interface CPUUnit {
  id: string;
  affiliate_id: string;
  units: number;
  allocation_period: string;
  weight_at_allocation: number;
  total_weight_pool: number;
  profit_pool_usd: number;
  estimated_value_usd?: number;
  status: 'allocated' | 'vested' | 'claimed' | 'forfeited';
  vesting_schedule?: any;
  claimed_at?: string;
  created_at: string;
}

/**
 * Token Reward
 */
export type TokenRewardType =
  | 'airdrop'
  | 'staking'
  | 'farming'
  | 'mission'
  | 'leaderboard'
  | 'weight_bonus';

export type TokenRewardStatus =
  | 'pending'
  | 'allocated'
  | 'vested'
  | 'claimed'
  | 'forfeited';

export interface TokenReward {
  id: string;
  affiliate_id: string;
  token_amount: number;
  reward_type: TokenRewardType;
  status: TokenRewardStatus;
  source_id?: string;
  vesting_schedule?: Record<string, any>;
  claimed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Mission
 */
export interface Mission {
  id: string;
  mission_type: MissionType;
  title: string;
  description: string;
  requirements: Record<string, any>;
  rewards: {
    lp?: number;
    weight?: number;
    tokens?: number;
    cpu?: number;
    usd?: number;
  };
  start_date: string;
  end_date?: string;
  is_active: boolean;
  max_completions?: number;
}

/**
 * Mission Log
 */
export interface MissionLog {
  id: string;
  affiliate_id: string;
  mission_id: string;
  status: 'in_progress' | 'completed' | 'claimed' | 'expired';
  progress: Record<string, any>;
  completed_at?: string;
  claimed_at?: string;
  rewards_claimed?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  affiliate_id: string;
  rank: number;
  influence_weight: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings_usd: number;
  affiliate?: AffiliateAccount;
}

/**
 * Campaign
 */
export interface Campaign {
  id: string;
  affiliate_id: string;
  campaign_name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referral_link: string;
  qr_code_url?: string;
  pixel_code?: string;
  is_active: boolean;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  created_at: string;
}

/**
 * Weight Calculation Factors
 */
export interface WeightFactors {
  activeUsersMultiplier: number;
  registeredUsersMultiplier: number;
  botActiveUsersMultiplier: number;
  volumeMultiplier: number;
  backtestUsersMultiplier: number;
}

/**
 * Fraud Detection Result
 */
export interface FraudDetectionResult {
  fraud_score: number; // 0-100
  flags: string[];
  is_fraud: boolean;
  confidence: number; // 0-1
  details: Record<string, any>;
}

