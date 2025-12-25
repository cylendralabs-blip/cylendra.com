/**
 * Community Types
 * 
 * Phase X.12 - Community Signals Dashboard + Influencers Ranking System
 */

export interface CommunitySignal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  side: 'BUY' | 'SELL';
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  confidence?: number;
  analysis_text?: string;
  source: 'manual' | 'twitter' | 'telegram' | 'ai-assisted';
  ai_assisted: boolean;
  ai_verification?: any;
  status: 'OPEN' | 'CLOSED';
  result?: 'WIN' | 'LOSS' | 'BREAKEVEN';
  pnl_percentage?: number;
  attachments?: Record<string, any>;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  views: number;
  metadata?: Record<string, any>;
  created_at: string;
  closed_at?: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  user_stats?: CommunityTraderStats;
  is_verified_influencer?: boolean;
  influencer_level?: string;
  user_vote?: number; // Current user's vote (-1, 0, or 1)
  is_following?: boolean;
}

export interface CommunitySignalVote {
  id: string;
  signal_id: string;
  user_id: string;
  vote: number; // +1 or -1
  created_at: string;
}

export interface CommunityTraderStats {
  user_id: string;
  total_signals: number;
  closed_signals: number;
  win_count: number;
  loss_count: number;
  breakeven_count: number;
  win_rate: number;
  avg_return: number;
  total_return: number;
  reputation_score: number;
  lp_points: number;
  weight: number;
  rank: 'Newbie' | 'Skilled' | 'Pro' | 'Elite' | 'Master' | 'Legend';
  followers_count: number;
  following_count: number;
  verified: boolean;
  influencer_level?: 'Bronze' | 'Silver' | 'Gold' | 'Elite';
  metadata?: Record<string, any>;
  updated_at: string;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
}

export interface VerifiedInfluencer {
  user_id: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Elite';
  verification_date: string;
  social_links?: {
    twitter?: string;
    telegram?: string;
    youtube?: string;
    instagram?: string;
  };
  bio?: string;
  total_followers: number;
  total_views: number;
  verified_by?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  stats?: CommunityTraderStats;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type RankLevel = 'Newbie' | 'Skilled' | 'Pro' | 'Elite' | 'Master' | 'Legend';
export type InfluencerLevel = 'Bronze' | 'Silver' | 'Gold' | 'Elite';

export interface SignalFilters {
  symbol?: string;
  timeframe?: string;
  side?: 'BUY' | 'SELL';
  status?: 'OPEN' | 'CLOSED';
  top_rated?: boolean;
  verified_only?: boolean;
  ai_verified?: boolean;
  following_only?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'newest' | 'votes' | 'reputation' | 'win_rate';
}

export interface RankingFilters {
  rank?: RankLevel;
  min_reputation?: number;
  min_win_rate?: number;
  influencer_only?: boolean;
  limit?: number;
  offset?: number;
}

