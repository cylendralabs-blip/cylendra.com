/**
 * Billing Service - Admin Subscription Management
 * 
 * Phase Admin Billing: Full Subscription & Payment Control Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { PlanCode, PlanStatus, PaymentMethod } from '@/core/plans/planTypes';

export interface UserSubscription {
  user_id: string;
  email: string;
  plan_code: PlanCode;
  plan_name: string;
  status: PlanStatus;
  activated_at: string;
  expires_at: string | null;
  days_remaining: number | null;
  payment_method: PaymentMethod | null;
  payment_reference?: string | null;
  transaction_id?: string | null;
  payment_gateway?: string | null;
}

export interface BillingAnalytics {
  total_active_subscriptions: number;
  active_pro_users: number;
  active_vip_users: number;
  expiring_in_7_days: number;
  total_manual_renewals: number;
  total_trials_active: number;
}

/**
 * Get all user subscriptions with details
 */
export async function getAllUserSubscriptions(): Promise<{
  subscriptions: UserSubscription[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { subscriptions: [], error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing?action=list`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { subscriptions: [], error: error.error || 'Failed to fetch subscriptions' };
    }

    const data = await response.json();
    return { subscriptions: data.subscriptions || [] };
  } catch (error) {
    console.error('Error in getAllUserSubscriptions:', error);
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(
  userId: string
): Promise<{ subscription: UserSubscription | null; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { subscription: null, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing?action=get-user&userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { subscription: null, error: error.error || 'Failed to fetch subscription' };
    }

    const data = await response.json();
    return { subscription: data.subscription || null };
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return {
      subscription: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Change user plan
 */
export async function changeUserPlan(
  userId: string,
  newPlanCode: PlanCode,
  paymentMethod: PaymentMethod = 'manual',
  expiresAt?: string | null,
  metadata?: {
    payment_reference?: string;
    transaction_id?: string;
    payment_gateway?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'change-plan',
          userId,
          planCode: newPlanCode,
          paymentMethod,
          expiresAt,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to change plan' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in changeUserPlan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Renew subscription
 */
export async function renewSubscription(
  userId: string,
  renewalPeriodMonths: number,
  paymentMethod: PaymentMethod = 'manual',
  metadata?: {
    payment_reference?: string;
    transaction_id?: string;
    payment_gateway?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renew',
          userId,
          renewalPeriodMonths,
          paymentMethod,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to renew subscription' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in renewSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extend subscription by days
 */
export async function extendSubscription(
  userId: string,
  days: number,
  metadata?: {
    payment_reference?: string;
    transaction_id?: string;
    payment_gateway?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'extend',
          userId,
          days,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to extend subscription' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in extendSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Activate free trial
 */
export async function activateTrial(
  userId: string,
  planCode: PlanCode,
  durationDays: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate-trial',
          userId,
          planCode,
          durationDays,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to activate trial' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in activateTrial:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          userId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to cancel subscription' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Downgrade to FREE plan
 */
export async function downgradeToFree(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'downgrade-free',
          userId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to downgrade to FREE' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in downgradeToFree:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark payment as received (manual payment)
 */
export async function markPaymentReceived(
  userId: string,
  paymentMethod: PaymentMethod,
  paymentReference?: string,
  transactionId?: string,
  paymentGateway?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-paid',
          userId,
          paymentMethod,
          paymentReference,
          transactionId,
          paymentGateway,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to mark payment' };
    }

    const data = await response.json();
    return { success: data.success || false };
  } catch (error) {
    console.error('Error in markPaymentReceived:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get billing analytics
 */
export async function getBillingAnalytics(): Promise<{
  analytics: BillingAnalytics;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        analytics: {
          total_active_subscriptions: 0,
          active_pro_users: 0,
          active_vip_users: 0,
          expiring_in_7_days: 0,
          total_manual_renewals: 0,
          total_trials_active: 0,
        },
        error: 'Not authenticated',
      };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-billing?action=analytics`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        analytics: {
          total_active_subscriptions: 0,
          active_pro_users: 0,
          active_vip_users: 0,
          expiring_in_7_days: 0,
          total_manual_renewals: 0,
          total_trials_active: 0,
        },
        error: error.error || 'Failed to fetch analytics',
      };
    }

    const data = await response.json();
    return { analytics: data.analytics || {
      total_active_subscriptions: 0,
      active_pro_users: 0,
      active_vip_users: 0,
      expiring_in_7_days: 0,
      total_manual_renewals: 0,
      total_trials_active: 0,
    } };
  } catch (error) {
    console.error('Error in getBillingAnalytics:', error);
    return {
      analytics: {
        total_active_subscriptions: 0,
        active_pro_users: 0,
        active_vip_users: 0,
        expiring_in_7_days: 0,
        total_manual_renewals: 0,
        total_trials_active: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

