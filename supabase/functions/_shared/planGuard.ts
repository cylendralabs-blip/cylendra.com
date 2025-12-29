/**
 * Plan Guard for Edge Functions (Deno-compatible)
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type PlanCode = "FREE" | "BASIC" | "PREMIUM" | "PRO" | "VIP";

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
  | "access.backtesting";

interface PlanFeatures {
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
    max_active_bots: number;
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
  };
}

/**
 * Get user plan from database
 */
async function getUserPlanFromDB(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ code: PlanCode; features: PlanFeatures; status: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from('user_plans')
      .select(`
        status,
        expires_at,
        plan:plans(code, features)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user plan:', error);
      return null;
    }

    // If user has no plan, return FREE plan
    if (!data || !data.plan) {
      return {
        code: 'FREE',
        features: getDefaultFeatures('FREE'),
        status: 'active',
      };
    }

    // Check if plan is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return {
        code: 'FREE',
        features: getDefaultFeatures('FREE'),
        status: 'expired',
      };
    }

    const plan = data.plan as any;
    return {
      code: plan.code as PlanCode,
      features: plan.features as PlanFeatures,
      status: data.status,
    };
  } catch (error) {
    console.error('Error in getUserPlanFromDB:', error);
    return null;
  }
}

/**
 * Get default features for a plan code
 */
function getDefaultFeatures(code: PlanCode): PlanFeatures {
  const defaults: Record<PlanCode, PlanFeatures> = {
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
        max_active_bots: -1,
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
      },
    },
  };

  return defaults[code];
}

/**
 * Check if features object has a specific feature
 */
function hasFeature(features: PlanFeatures, featurePath: FeaturePath | string): boolean {
  const parts = featurePath.split('.');
  let current: any = features;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return false;
    }
    current = current[part];
  }

  return Boolean(current);
}

/**
 * Check if user can use a feature (for Edge Functions)
 */
export async function canUseFeature(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  featurePath: FeaturePath | string
): Promise<boolean> {
  try {
    const userPlan = await getUserPlanFromDB(supabaseClient, userId);
    if (!userPlan) {
      return false;
    }

    return hasFeature(userPlan.features, featurePath);
  } catch (error) {
    console.error('Error in canUseFeature:', error);
    return false;
  }
}

/**
 * Require feature or throw error
 */
export async function requireFeature(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  featurePath: FeaturePath | string,
  customMessage?: string
): Promise<void> {
  const allowed = await canUseFeature(supabaseClient, userId, featurePath);
  
  if (!allowed) {
    const message = customMessage || 
      `Feature "${featurePath}" is not available in your current plan`;
    
    throw new Error(`PLAN_LIMIT:FEATURE_NOT_ALLOWED - ${message}`);
  }
}

