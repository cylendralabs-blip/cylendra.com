/**
 * Default Plan Definitions
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import type { PlanFeatures, PlanLimits, PlanCode } from './planTypes';

/**
 * Default features for each plan
 */
export const DEFAULT_PLAN_FEATURES: Record<PlanCode, PlanFeatures> = {
  FREE: {
    signals: {
      web_basic: true,
      web_ai_ultra: false,
      web_realtime: false,
      telegram_basic: false,
      telegram_ai: false,
      telegram_realtime: false,
    },
    bots: {
      enabled: false,
      spot: false,
      futures: false,
      max_active_bots: 0,
    },
    ai: {
      advanced_indicators: false,
      smart_defaults: false,
      live_center: false,
    },
    access: {
      heatmap: false,
      risk_map: false,
      backtesting: false,
      portfolio_insights: true, // Basic view only
      portfolio_forecast: false,
      portfolio_recommendations: false,
    },
    community: {
      view_signals: true,
      publish_signals: true,
      view_rankings: true,
      view_influencers: false,
      daily_signal_limit: 3,
    },
    copy: {
      follow_enabled: true,
      can_be_master: false,
      max_strategies: 1,
    },
  },
  BASIC: {
    signals: {
      web_basic: true,
      web_ai_ultra: true,
      web_realtime: false,
      telegram_basic: true,
      telegram_ai: false,
      telegram_realtime: false,
    },
    bots: {
      enabled: true,
      spot: true,
      futures: false,
      max_active_bots: 1,
    },
    ai: {
      advanced_indicators: true,
      smart_defaults: true,
      live_center: false,
    },
    access: {
      heatmap: true,
      risk_map: false,
      backtesting: false,
      portfolio_insights: true,
      portfolio_forecast: false,
      portfolio_recommendations: false,
    },
    community: {
      view_signals: true,
      publish_signals: true,
      view_rankings: true,
      view_influencers: true,
      daily_signal_limit: 10,
    },
    copy: {
      follow_enabled: true,
      can_be_master: false,
      max_strategies: 3,
    },
  },
  PREMIUM: {
    signals: {
      web_basic: true,
      web_ai_ultra: true,
      web_realtime: true,
      telegram_basic: true,
      telegram_ai: true,
      telegram_realtime: false,
    },
    bots: {
      enabled: true,
      spot: true,
      futures: true,
      max_active_bots: 3,
    },
    ai: {
      advanced_indicators: true,
      smart_defaults: true,
      live_center: true,
    },
    access: {
      heatmap: true,
      risk_map: true,
      backtesting: true,
      portfolio_insights: true,
      portfolio_forecast: true,
      portfolio_recommendations: false,
    },
    community: {
      view_signals: true,
      publish_signals: true,
      view_rankings: true,
      view_influencers: true,
      daily_signal_limit: 50,
    },
    copy: {
      follow_enabled: true,
      can_be_master: true,
      max_strategies: 10,
      max_copiers: 50,
    },
  },
  PRO: {
    signals: {
      web_basic: true,
      web_ai_ultra: true,
      web_realtime: true,
      telegram_basic: true,
      telegram_ai: true,
      telegram_realtime: true,
    },
    bots: {
      enabled: true,
      spot: true,
      futures: true,
      max_active_bots: 10,
    },
    ai: {
      advanced_indicators: true,
      smart_defaults: true,
      live_center: true,
    },
    access: {
      heatmap: true,
      risk_map: true,
      backtesting: true,
      portfolio_insights: true,
      portfolio_forecast: true,
      portfolio_recommendations: true,
    },
    community: {
      view_signals: true,
      publish_signals: true,
      view_rankings: true,
      view_influencers: true,
      daily_signal_limit: 200,
    },
    copy: {
      follow_enabled: true,
      can_be_master: true,
      max_strategies: -1, // Unlimited
      max_copiers: 200,
    },
  },
  VIP: {
    signals: {
      web_basic: true,
      web_ai_ultra: true,
      web_realtime: true,
      telegram_basic: true,
      telegram_ai: true,
      telegram_realtime: true,
    },
    bots: {
      enabled: true,
      spot: true,
      futures: true,
      max_active_bots: -1, // Unlimited
    },
    ai: {
      advanced_indicators: true,
      smart_defaults: true,
      live_center: true,
    },
    access: {
      heatmap: true,
      risk_map: true,
      backtesting: true,
      portfolio_insights: true,
      portfolio_forecast: true,
      portfolio_recommendations: true,
    },
    community: {
      view_signals: true,
      publish_signals: true,
      view_rankings: true,
      view_influencers: true,
      daily_signal_limit: -1, // Unlimited
    },
    copy: {
      follow_enabled: true,
      can_be_master: true,
      max_strategies: -1, // Unlimited
      max_copiers: -1, // Unlimited
    },
  },
};

/**
 * Default limits for each plan
 */
export const DEFAULT_PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    signals_per_day: 10,
    ai_calls_per_day: 20,
    max_pairs: 2,
    max_telegram_channels: 0,
    copy: {
      max_strategies: 1,
    },
  },
  BASIC: {
    signals_per_day: 50,
    ai_calls_per_day: 100,
    max_pairs: 5,
    max_telegram_channels: 1,
    copy: {
      max_strategies: 3,
    },
  },
  PREMIUM: {
    signals_per_day: 200,
    ai_calls_per_day: 500,
    max_pairs: 20,
    max_telegram_channels: 2,
    copy: {
      max_strategies: 10,
      max_copiers: 50,
    },
  },
  PRO: {
    signals_per_day: 1000,
    ai_calls_per_day: 5000,
    max_pairs: 100,
    max_telegram_channels: 5,
    copy: {
      max_strategies: -1, // Unlimited
      max_copiers: 200,
    },
  },
  VIP: {
    signals_per_day: -1, // Unlimited
    ai_calls_per_day: -1, // Unlimited
    max_pairs: -1, // Unlimited
    max_telegram_channels: -1, // Unlimited
    copy: {
      max_strategies: -1, // Unlimited
      max_copiers: -1, // Unlimited
    },
  },
};

/**
 * Get default plan code (FREE)
 */
export function getDefaultPlanCode(): PlanCode {
  return 'FREE';
}

/**
 * Check if a limit value means unlimited
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

