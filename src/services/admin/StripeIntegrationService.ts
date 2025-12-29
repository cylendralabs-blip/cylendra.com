/**
 * Stripe Integration Service
 * 
 * Phase Admin C: Placeholder for Stripe integration
 * This service provides a structure for integrating Stripe payments
 * and calculating revenue metrics from subscription data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface StripeSubscription {
  id: string;
  customerId: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number; // in cents
  currency: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface StripeRevenue {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  arpu: number; // Average Revenue Per User
  ltv: number; // Customer Lifetime Value
  revenueByPlan: Record<string, number>;
  churnedRevenue: number;
  newRevenue: number;
}

/**
 * Get all active Stripe subscriptions from payment_history
 */
export async function getStripeSubscriptions(): Promise<{
  subscriptions: StripeSubscription[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { subscriptions: [], error: 'Not authenticated' };
    }

    // Get all Stripe subscriptions from user_plans with Stripe payment method
    const { data: userPlans, error: plansError } = await (supabase as any)
      .from('user_plans')
      .select(`
        *,
        plan:plans(code, name),
        user:auth.users(id, email)
      `)
      .eq('payment_method', 'stripe')
      .in('status', ['active', 'trial']);

    if (plansError) {
      return {
        subscriptions: [],
        error: plansError.message,
      };
    }

    const subscriptions: StripeSubscription[] = (userPlans || []).map((up: any) => ({
      id: up.metadata?.stripe_subscription_id || '',
      customerId: up.metadata?.stripe_customer_id || '',
      userId: up.user_id,
      planId: up.plan_id,
      planName: up.plan?.name || 'Unknown',
      status: up.status === 'trial' ? 'trialing' : (up.status as 'active' | 'canceled'),
      currentPeriodStart: up.activated_at,
      currentPeriodEnd: up.expires_at || '',
      amount: 0, // Will be calculated from payment_history
      currency: 'USD',
      cancelAtPeriodEnd: up.status === 'canceled',
      createdAt: up.activated_at,
    }));

    // Enrich with payment amounts from payment_history
    for (const sub of subscriptions) {
      const { data: payments } = await (supabase as any)
        .from('payment_history')
        .select('amount')
        .eq('user_id', sub.userId)
        .eq('payment_method', 'stripe')
        .eq('payment_status', 'completed')
        .order('paid_at', { ascending: false })
        .limit(1);

      if (payments && payments.length > 0) {
        sub.amount = Math.round(payments[0].amount * 100); // Convert to cents
      }
    }

    return { subscriptions };
  } catch (error) {
    console.error('Error fetching Stripe subscriptions:', error);
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate revenue metrics from payment_history
 */
export async function calculateStripeRevenue(): Promise<{
  revenue: StripeRevenue;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        revenue: {
          mrr: 0,
          arr: 0,
          arpu: 0,
          ltv: 0,
          revenueByPlan: {},
          churnedRevenue: 0,
          newRevenue: 0,
        },
        error: 'Not authenticated',
      };
    }

    // Get all completed Stripe payments from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: payments, error: paymentsError } = await (supabase as any)
      .from('payment_history')
      .select(`
        *,
        user_plan:user_plans!inner(
          plan:plans(code, name)
        )
      `)
      .eq('payment_method', 'stripe')
      .eq('payment_status', 'completed')
      .gte('paid_at', thirtyDaysAgo.toISOString());

    if (paymentsError) {
      return {
        revenue: {
          mrr: 0,
          arr: 0,
          arpu: 0,
          ltv: 0,
          revenueByPlan: {},
          churnedRevenue: 0,
          newRevenue: 0,
        },
        error: paymentsError.message,
      };
    }

    // Get active subscriptions for MRR calculation
    const { subscriptions } = await getStripeSubscriptions();
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');

    // Calculate MRR (average monthly payment from active subscriptions)
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.amount / 100); // Convert cents to dollars
    }, 0);

    // Calculate ARR
    const arr = mrr * 12;

    // Calculate ARPU
    const arpu = activeSubscriptions.length > 0
      ? mrr / activeSubscriptions.length
      : 0;

    // Calculate revenue by plan
    const revenueByPlan: Record<string, number> = {};
    (payments || []).forEach((payment: any) => {
      const planName = payment.user_plan?.plan?.name || 'unknown';
      revenueByPlan[planName] = (revenueByPlan[planName] || 0) + Number(payment.amount);
    });

    // Calculate churned revenue (canceled subscriptions in last 30 days)
    const { data: canceledPlans } = await (supabase as any)
      .from('user_plans')
      .select('*')
      .eq('payment_method', 'stripe')
      .eq('status', 'canceled')
      .gte('updated_at', thirtyDaysAgo.toISOString());

    const churnedRevenue = canceledPlans?.length > 0
      ? canceledPlans.reduce((sum: number, plan: any) => {
          // Get last payment amount for this user
          const lastPayment = (payments || []).find((p: any) => p.user_id === plan.user_id);
          return sum + (lastPayment ? Number(lastPayment.amount) : 0);
        }, 0)
      : 0;

    // Calculate new revenue (new subscriptions in last 30 days)
    const newRevenue = (payments || []).reduce((sum: number, payment: any) => {
      // Check if this is a new subscription (first payment for user)
      const isNew = new Date(payment.paid_at) >= thirtyDaysAgo;
      return sum + (isNew ? Number(payment.amount) : 0);
    }, 0);

    // Calculate LTV (simplified - average subscription value * average lifespan)
    const averageLifespanMonths = 12; // TODO: Calculate from historical data
    const ltv = arpu * averageLifespanMonths;

    return {
      revenue: {
        mrr,
        arr,
        arpu,
        ltv,
        revenueByPlan,
        churnedRevenue,
        newRevenue,
      },
    };
  } catch (error) {
    console.error('Error calculating Stripe revenue:', error);
    return {
      revenue: {
        mrr: 0,
        arr: 0,
        arpu: 0,
        ltv: 0,
        revenueByPlan: {},
        churnedRevenue: 0,
        newRevenue: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment history for a user
 */
export async function getUserPaymentHistory(userId: string): Promise<{
  payments: any[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { payments: [], error: 'Not authenticated' };
    }

    const { data: payments, error } = await (supabase as any)
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { payments: [], error: error.message };
    }

    return { payments: payments || [] };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return {
      payments: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create Stripe checkout session (to be called from frontend)
 * 
 * Note: This should be implemented in an Edge Function for security
 */
export async function createStripeCheckoutSession(
  userId: string,
  planCode: string,
  successUrl: string,
  cancelUrl: string
): Promise<{
  sessionId: string | null;
  error?: string;
}> {
  try {
    // This should be called from an Edge Function that has Stripe secret key
    // For now, return placeholder
    return {
      sessionId: null,
      error: 'Stripe checkout must be created server-side. Use Edge Function.',
    };
  } catch (error) {
    return {
      sessionId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

