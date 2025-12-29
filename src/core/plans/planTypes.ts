/**
 * Plan Types and Interfaces
 * 
 * Phase X.10 - Subscription Plans Engine
 */

export type PlanCode = "FREE" | "BASIC" | "PREMIUM" | "PRO" | "VIP";

export type PlanStatus = "active" | "expired" | "canceled" | "trial";

export type PaymentMethod = "manual" | "stripe" | "crypto" | "trial" | "beta_free";

export interface PlanFeatures {
  signals: {
    web_basic: boolean;
    web_ai_ultra: boolean;
    web_realtime: boolean;
    telegram_basic: boolean;
    telegram_ai: boolean;
    telegram_realtime: boolean;
  };
  bots: {
    enabled: boolean;
    spot: boolean;
    futures: boolean;
    max_active_bots: number; // -1 for unlimited
  };
  ai: {
    advanced_indicators: boolean;
    smart_defaults: boolean;
    live_center: boolean;
  };
  access: {
    heatmap: boolean;
    risk_map: boolean;
    backtesting: boolean;
    portfolio_insights?: boolean;
    portfolio_forecast?: boolean;
    portfolio_recommendations?: boolean;
  };
  // Phase X.12: Community Features
  community: {
    view_signals: boolean;
    publish_signals: boolean;
    view_rankings: boolean;
    view_influencers: boolean;
    daily_signal_limit: number; // -1 for unlimited
  };
  // Phase X.17: Copy Trading Features
  copy: {
    follow_enabled: boolean;
    can_be_master: boolean;
    max_strategies: number; // -1 for unlimited
    max_copiers?: number; // For master strategies, -1 for unlimited
  };
}

export interface PlanLimits {
  signals_per_day: number; // -1 for unlimited
  ai_calls_per_day: number; // -1 for unlimited
  max_pairs: number; // -1 for unlimited
  max_telegram_channels: number; // -1 for unlimited
  copy?: {
    max_strategies?: number; // -1 for unlimited
    max_copiers?: number; // For master strategies
  };
}

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  price_usd: number;
  billing_period: "monthly" | "yearly";
  features: PlanFeatures;
  limits: PlanLimits;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserPlan {
  user_id: string;
  plan_id: string;
  status: PlanStatus;
  activated_at: string;
  expires_at: string | null;
  payment_method: PaymentMethod | null;
  metadata: Record<string, any> | null;
  // Joined plan data
  plan?: Plan;
}

export interface TelegramChannel {
  id: string;
  code: string;
  plan_code: PlanCode;
  chat_id: string;
  type: "basic" | "ai" | "realtime";
  is_active: boolean;
  created_at: string;
}

export interface TelegramAccess {
  id: string;
  user_id: string;
  channel_code: string;
  status: "active" | "revoked";
  granted_at: string;
  revoked_at: string | null;
  metadata: Record<string, any> | null;
}

export interface UsageCounter {
  id: string;
  user_id: string;
  counter_type: string;
  date: string;
  count: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Feature path type for type-safe feature checking
 */
export type FeaturePath =
  | "signals.web_basic"
  | "signals.web_ai_ultra"
  | "signals.web_realtime"
  | "signals.telegram_basic"
  | "signals.telegram_ai"
  | "signals.telegram_realtime"
  | "bots.enabled"
  | "bots.spot"
  | "bots.futures"
  | "ai.advanced_indicators"
  | "ai.smart_defaults"
  | "ai.live_center"
  | "access.heatmap"
  | "access.risk_map"
  | "access.backtesting"
  | "community.view_signals"
  | "community.publish_signals"
  | "community.view_rankings"
  | "community.view_influencers"
  | "copy.follow_enabled"
  | "copy.can_be_master";

