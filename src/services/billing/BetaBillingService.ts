/**
 * Beta Billing Service
 * 
 * Beta Free Billing Mode: Activate plans for free during beta
 */

import { supabase } from '@/integrations/supabase/client';
import type { PlanCode } from '@/core/plans/planTypes';

export interface BetaActivationResponse {
  success: boolean;
  message: string;
  payment: {
    id: string;
    plan_code: PlanCode;
    amount_usd: number;
    payment_method: string;
    status: string;
  };
  subscription: {
    plan_code: PlanCode;
    plan_name: string;
    status: string;
    expires_at: string;
    payment_method: string;
  };
}

/**
 * Activate a plan for free in beta mode
 */
export async function activateBetaPlan(
  planCode: PlanCode
): Promise<{ success: boolean; data?: BetaActivationResponse; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beta-activate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planCode,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to activate plan' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error activating beta plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

