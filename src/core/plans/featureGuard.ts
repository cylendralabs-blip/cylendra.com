/**
 * Feature Guard - Guard functions for protecting features
 * 
 * Phase X.10 - Subscription Plans Engine
 */

import { canUseFeature, getUserPlan } from './planManager';
import type { FeaturePath } from './planTypes';

/**
 * Feature guard result
 */
export interface FeatureGuardResult {
  allowed: boolean;
  reason?: string;
  planCode?: string;
  requiredPlan?: string;
}

/**
 * Check if user can access a feature with detailed result
 */
export async function checkFeatureAccess(
  userId: string,
  featurePath: FeaturePath | string
): Promise<FeatureGuardResult> {
  try {
    const userPlan = await getUserPlan(userId);
    if (!userPlan) {
      return {
        allowed: false,
        reason: 'USER_PLAN_NOT_FOUND',
      };
    }

    const hasAccess = await canUseFeature(userId, featurePath);
    
    if (!hasAccess) {
      // Determine required plan
      const requiredPlan = getRequiredPlanForFeature(featurePath);
      
      return {
        allowed: false,
        reason: 'FEATURE_NOT_IN_PLAN',
        planCode: userPlan.code,
        requiredPlan,
      };
    }

    return {
      allowed: true,
      planCode: userPlan.code,
    };
  } catch (error) {
    console.error('Error in checkFeatureAccess:', error);
    return {
      allowed: false,
      reason: 'ERROR_CHECKING_ACCESS',
    };
  }
}

/**
 * Get required plan for a feature (helper function)
 */
function getRequiredPlanForFeature(featurePath: FeaturePath | string): string {
  // Map features to minimum required plans
  const featurePlanMap: Record<string, string> = {
    'signals.web_basic': 'FREE',
    'signals.web_ai_ultra': 'BASIC',
    'signals.web_realtime': 'PREMIUM',
    'signals.telegram_basic': 'BASIC',
    'signals.telegram_ai': 'PREMIUM',
    'signals.telegram_realtime': 'PRO',
    'bots.enabled': 'BASIC',
    'bots.spot': 'BASIC',
    'bots.futures': 'PREMIUM',
    'ai.advanced_indicators': 'BASIC',
    'ai.smart_defaults': 'BASIC',
    'ai.live_center': 'PREMIUM',
    'access.heatmap': 'BASIC',
    'access.risk_map': 'PREMIUM',
    'access.backtesting': 'PREMIUM',
  };

  return featurePlanMap[featurePath] || 'PREMIUM';
}

/**
 * Throw error if feature is not allowed
 */
export async function requireFeature(
  userId: string,
  featurePath: FeaturePath | string,
  customMessage?: string
): Promise<void> {
  const result = await checkFeatureAccess(userId, featurePath);
  
  if (!result.allowed) {
    const message = customMessage || 
      `Feature "${featurePath}" requires ${result.requiredPlan || 'PREMIUM'} plan. Your current plan: ${result.planCode || 'FREE'}`;
    
    throw new Error(`PLAN_LIMIT:${result.reason || 'FEATURE_NOT_ALLOWED'} - ${message}`);
  }
}

/**
 * Get user-friendly error message for feature access denial
 */
export function getFeatureErrorMessage(result: FeatureGuardResult): string {
  if (result.allowed) {
    return '';
  }

  switch (result.reason) {
    case 'USER_PLAN_NOT_FOUND':
      return 'خطة المستخدم غير موجودة. يرجى الاتصال بالدعم.';
    
    case 'FEATURE_NOT_IN_PLAN':
      return `هذه الميزة متاحة فقط في خطة ${result.requiredPlan || 'PREMIUM'} أو أعلى. خطتك الحالية: ${result.planCode || 'FREE'}`;
    
    case 'ERROR_CHECKING_ACCESS':
      return 'حدث خطأ في التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.';
    
    default:
      return 'هذه الميزة غير متاحة في خطتك الحالية.';
  }
}

