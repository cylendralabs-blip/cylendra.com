/**
 * Copy Trading Premium Features
 * 
 * Phase X.17 - Premium Features
 * 
 * Premium features for copy trading
 */

import { supabase } from '@/integrations/supabase/client';
import { canUseFeature } from '@/core/plans/planManager';

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredPlan: string[];
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed performance analytics and insights',
    requiredPlan: ['PREMIUM', 'PRO', 'VIP'],
  },
  {
    id: 'priority_execution',
    name: 'Priority Execution',
    description: 'Faster trade execution priority',
    requiredPlan: ['PRO', 'VIP'],
  },
  {
    id: 'custom_risk_limits',
    name: 'Custom Risk Limits',
    description: 'Advanced risk management options',
    requiredPlan: ['PREMIUM', 'PRO', 'VIP'],
  },
  {
    id: 'multi_strategy',
    name: 'Multi-Strategy Following',
    description: 'Follow multiple strategies simultaneously',
    requiredPlan: ['PREMIUM', 'PRO', 'VIP'],
  },
  {
    id: 'master_strategy',
    name: 'Create Master Strategy',
    description: 'Create and publish your own strategy',
    requiredPlan: ['PRO', 'VIP'],
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to copy trading',
    requiredPlan: ['VIP'],
  },
];

/**
 * Check if user can use premium feature
 */
export async function canUsePremiumFeature(
  userId: string,
  featureId: string
): Promise<boolean> {
  try {
    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) {
      return false;
    }

    // Check plan access
    for (const plan of feature.requiredPlan) {
      const canUse = await canUseFeature(userId, `copy.${featureId}`);
      if (canUse) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking premium feature access:', error);
    return false;
  }
}

/**
 * Get available premium features for user
 */
export async function getAvailablePremiumFeatures(
  userId: string
): Promise<PremiumFeature[]> {
  try {
    const availableFeatures: PremiumFeature[] = [];

    for (const feature of PREMIUM_FEATURES) {
      const canUse = await canUsePremiumFeature(userId, feature.id);
      if (canUse) {
        availableFeatures.push(feature);
      }
    }

    return availableFeatures;
  } catch (error) {
    console.error('Error getting premium features:', error);
    return [];
  }
}

/**
 * Upgrade to premium
 */
export async function upgradeToPremium(
  userId: string,
  plan: 'PREMIUM' | 'PRO' | 'VIP'
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would typically integrate with payment system
    // For now, just update user plan
    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_name: plan,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

