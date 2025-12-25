/**
 * Limits Enforcer - Enforce plan usage limits
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { supabase } from '@/integrations/supabase/client';
import { getUserLimits, getUserPlan } from './planManager';
import { isUnlimited } from './planDefaults';
import type { PlanLimits } from './planTypes';

/**
 * Counter types
 */
export type CounterType = 
  | 'signals_per_day'
  | 'ai_calls_per_day'
  | 'trades_per_day'
  | 'telegram_messages_per_day';

/**
 * Get usage counter for today
 */
export async function getUsageCounter(
  userId: string,
  counterType: CounterType
): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await (supabase as any)
      .from('usage_counters')
      .select('count')
      .eq('user_id', userId)
      .eq('counter_type', counterType)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage counter:', error);
      return 0;
    }

    return data?.count || 0;
  } catch (error) {
    console.error('Error in getUsageCounter:', error);
    return 0;
  }
}

/**
 * Increment usage counter
 */
export async function incrementUsageCounter(
  userId: string,
  counterType: CounterType,
  amount: number = 1
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await (supabase as any)
      .from('usage_counters')
      .select('id, count')
      .eq('user_id', userId)
      .eq('counter_type', counterType)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      // Update existing counter
      const { error } = await (supabase as any)
        .from('usage_counters')
        .update({ count: (existing as any).count + amount })
        .eq('id', (existing as any).id);

      if (error) {
        console.error('Error updating usage counter:', error);
        return false;
      }
    } else {
      // Create new counter
      const { error } = await (supabase as any)
        .from('usage_counters')
        .insert({
          user_id: userId,
          counter_type: counterType,
          date: today,
          count: amount,
        });

      if (error) {
        console.error('Error creating usage counter:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in incrementUsageCounter:', error);
    return false;
  }
}

/**
 * Check if user can perform an action based on limits
 */
export async function checkLimit(
  userId: string,
  limitKey: keyof PlanLimits,
  counterType: CounterType
): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
  try {
    const limits = await getUserLimits(userId);
    if (!limits) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        reason: 'LIMITS_NOT_FOUND',
      };
    }

    const limit = limits[limitKey];
    
    // Ensure limit is a number
    const limitValue = typeof limit === 'number' ? limit : 0;
    
    // Unlimited
    if (isUnlimited(limitValue)) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
      };
    }

    const current = await getUsageCounter(userId, counterType);

    if (current >= limitValue) {
      return {
        allowed: false,
        current,
        limit: limitValue,
        reason: 'LIMIT_EXCEEDED',
      };
    }

    return {
      allowed: true,
      current,
      limit: limitValue,
    };
  } catch (error) {
    console.error('Error in checkLimit:', error);
    return {
      allowed: false,
      current: 0,
      limit: 0,
      reason: 'ERROR_CHECKING_LIMIT',
    };
  }
}

/**
 * Check active bots limit
 */
export async function checkActiveBotsLimit(
  userId: string,
  currentActiveBots: number
): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
  try {
    const userPlan = await getUserPlan(userId);
    if (!userPlan) {
      return {
        allowed: false,
        current: currentActiveBots,
        limit: 0,
        reason: 'USER_PLAN_NOT_FOUND',
      };
    }

    const limit = userPlan.features.bots.max_active_bots;

    // Unlimited
    if (isUnlimited(limit)) {
      return {
        allowed: true,
        current: currentActiveBots,
        limit: -1,
      };
    }

    if (currentActiveBots >= limit) {
      return {
        allowed: false,
        current: currentActiveBots,
        limit,
        reason: 'MAX_ACTIVE_BOTS_REACHED',
      };
    }

    return {
      allowed: true,
      current: currentActiveBots,
      limit,
    };
  } catch (error) {
    console.error('Error in checkActiveBotsLimit:', error);
    return {
      allowed: false,
      current: currentActiveBots,
      limit: 0,
      reason: 'ERROR_CHECKING_LIMIT',
    };
  }
}

/**
 * Throw error if limit is exceeded
 */
export async function requireLimit(
  userId: string,
  limitKey: keyof PlanLimits,
  counterType: CounterType,
  customMessage?: string
): Promise<void> {
  const result = await checkLimit(userId, limitKey, counterType);
  
  if (!result.allowed) {
    const message = customMessage || 
      `Limit exceeded: ${result.current}/${result.limit} ${counterType}`;
    
    throw new Error(`PLAN_LIMIT:${result.reason || 'LIMIT_EXCEEDED'} - ${message}`);
  }
}

/**
 * Get user-friendly error message for limit exceeded
 */
export function getLimitErrorMessage(result: { reason?: string; current: number; limit: number }): string {
  if (result.reason === 'LIMIT_EXCEEDED') {
    return `تم تجاوز الحد المسموح: ${result.current}/${result.limit}. يرجى ترقية خطتك.`;
  }
  
  if (result.reason === 'MAX_ACTIVE_BOTS_REACHED') {
    return `تم الوصول إلى الحد الأقصى للبوتات النشطة: ${result.limit}. يرجى إيقاف بوت آخر أو ترقية خطتك.`;
  }

  return 'تم تجاوز الحد المسموح في خطتك الحالية.';
}

