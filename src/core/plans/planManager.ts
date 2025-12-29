/**
 * Plan Manager - Core functions for plan management
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { supabase } from '@/integrations/supabase/client';
import type { Plan, UserPlan, PlanCode, PlanFeatures, PlanLimits, FeaturePath } from './planTypes';
import { DEFAULT_PLAN_FEATURES, DEFAULT_PLAN_LIMITS, getDefaultPlanCode } from './planDefaults';

/**
 * Get plan by code
 */
export async function getPlanByCode(code: PlanCode): Promise<Plan | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('plans')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const plan = data as any;

    return {
      id: plan.id,
      code: plan.code as PlanCode,
      name: plan.name,
      price_usd: Number(plan.price_usd),
      billing_period: plan.billing_period as "monthly" | "yearly",
      features: plan.features as PlanFeatures,
      limits: plan.limits as PlanLimits,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    };
  } catch (error) {
    console.error('Error in getPlanByCode:', error);
    return null;
  }
}

/**
 * Get user's current plan
 */
export async function getUserPlan(userId: string): Promise<{
  code: PlanCode;
  features: PlanFeatures;
  limits: PlanLimits;
  status: string;
  expires_at: string | null;
  payment_method?: string | null;
} | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_plans')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user plan:', error);
    }

    // If user has no plan, return FREE plan
    if (!data || !data.plan) {
      const defaultCode = getDefaultPlanCode();
      return {
        code: defaultCode,
        features: DEFAULT_PLAN_FEATURES[defaultCode],
        limits: DEFAULT_PLAN_LIMITS[defaultCode],
        status: 'active',
        expires_at: null,
        payment_method: null,
      };
    }

    const userPlanData = data as any;
    const plan = userPlanData.plan as any;

    // Check if plan is expired
    if (userPlanData.expires_at && new Date(userPlanData.expires_at) < new Date()) {
      // Return FREE plan if expired
      const defaultCode = getDefaultPlanCode();
      return {
        code: defaultCode,
        features: DEFAULT_PLAN_FEATURES[defaultCode],
        limits: DEFAULT_PLAN_LIMITS[defaultCode],
        status: 'expired',
        expires_at: userPlanData.expires_at,
        payment_method: userPlanData.payment_method || null,
      };
    }

    return {
      code: plan.code as PlanCode,
      features: plan.features as PlanFeatures,
      limits: plan.limits as PlanLimits,
      status: userPlanData.status,
      expires_at: userPlanData.expires_at,
      payment_method: userPlanData.payment_method || null,
    };
  } catch (error) {
    console.error('Error in getUserPlan:', error);
    // Return FREE plan on error
    const defaultCode = getDefaultPlanCode();
    return {
      code: defaultCode,
      features: DEFAULT_PLAN_FEATURES[defaultCode],
      limits: DEFAULT_PLAN_LIMITS[defaultCode],
      status: 'active',
      expires_at: null,
      payment_method: null,
    };
  }
}

/**
 * Check if user has a specific feature
 */
export async function canUseFeature(
  userId: string,
  featurePath: FeaturePath | string
): Promise<boolean> {
  try {
    const userPlan = await getUserPlan(userId);
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
 * Check if features object has a specific feature (synchronous)
 */
export function hasFeature(features: PlanFeatures, featurePath: FeaturePath | string): boolean {
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
 * Get user plan limits
 */
export async function getUserLimits(userId: string): Promise<PlanLimits | null> {
  try {
    const userPlan = await getUserPlan(userId);
    return userPlan?.limits || null;
  } catch (error) {
    console.error('Error in getUserLimits:', error);
    return null;
  }
}

/**
 * Assign plan to user (service role only)
 */
export async function assignPlanToUser(
  userId: string,
  planCode: PlanCode,
  paymentMethod: string = 'manual',
  expiresAt?: string | null
): Promise<boolean> {
  try {
    const plan = await getPlanByCode(planCode);
    if (!plan) {
      throw new Error(`Plan ${planCode} not found`);
    }

    const { error } = await (supabase as any)
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        payment_method: paymentMethod,
        expires_at: expiresAt || null,
        activated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error assigning plan:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in assignPlanToUser:', error);
    return false;
  }
}

/**
 * Get all available plans
 */
export async function getAllPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      code: p.code as PlanCode,
      name: p.name,
      price_usd: Number(p.price_usd),
      billing_period: p.billing_period as "monthly" | "yearly",
      features: p.features as PlanFeatures,
      limits: p.limits as PlanLimits,
      is_active: p.is_active,
      sort_order: p.sort_order,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  } catch (error) {
    console.error('Error in getAllPlans:', error);
    return [];
  }
}

