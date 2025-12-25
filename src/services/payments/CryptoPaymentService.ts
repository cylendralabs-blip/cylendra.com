/**
 * Crypto Payment Service
 * 
 * Phase Crypto Payments: NOWPayments Integration
 */

import { supabase } from '@/integrations/supabase/client';
import { assignPlanToUser } from '@/core/plans/planManager';
import type { PlanCode } from '@/core/plans/planTypes';

export interface CryptoPayment {
  id: string;
  user_id: string;
  plan_code: PlanCode;
  amount_usd: number;
  currency: string;
  payment_method: string;
  provider: string;
  provider_payment_id: string | null;
  payment_url: string | null;
  pay_address: string | null;
  pay_amount: number | null;
  status: 'pending' | 'confirming' | 'finished' | 'failed' | 'expired' | 'refunded';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  provider_status: string | null;
  raw_payload: Record<string, any>;
  created_at: string;
}

export interface CreatePaymentRequest {
  userId: string;
  planCode: PlanCode;
  currency?: string; // Default: 'USDTTRC20'
}

export interface CreatePaymentResponse {
  payment: CryptoPayment;
  payment_url: string;
}

/**
 * Create a crypto payment via NOWPayments
 */
export async function createCryptoPayment(
  request: CreatePaymentRequest
): Promise<{ payment: CryptoPayment | null; payment_url: string | null; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { payment: null, payment_url: null, error: 'Not authenticated' };
    }

    // Call Edge Function to create payment
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-payment-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          planCode: request.planCode,
          currency: request.currency || 'USDTTRC20',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { payment: null, payment_url: null, error: error.error || 'Failed to create payment' };
    }

    const data = await response.json();
    return {
      payment: data.payment,
      payment_url: data.payment_url,
    };
  } catch (error) {
    console.error('Error creating crypto payment:', error);
    return {
      payment: null,
      payment_url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user payments
 */
export async function getUserPayments(userId: string): Promise<{
  payments: CryptoPayment[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { payments: [], error: 'Not authenticated' };
    }

    const { data: payments, error } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { payments: [], error: error.message };
    }

    return { payments: (payments || []).map(formatPayment) };
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return {
      payments: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId: string): Promise<{
  payment: CryptoPayment | null;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { payment: null, error: 'Not authenticated' };
    }

    const { data: payment, error } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      return { payment: null, error: error.message };
    }

    return { payment: formatPayment(payment) };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return {
      payment: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment by provider payment ID
 */
export async function getPaymentByProviderId(providerPaymentId: string): Promise<{
  payment: CryptoPayment | null;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { payment: null, error: 'Not authenticated' };
    }

    const { data: payment, error } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('provider_payment_id', providerPaymentId)
      .maybeSingle();

    if (error) {
      return { payment: null, error: error.message };
    }

    return { payment: payment ? formatPayment(payment) : null };
  } catch (error) {
    console.error('Error fetching payment by provider ID:', error);
    return {
      payment: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format payment from database row
 */
function formatPayment(row: any): CryptoPayment {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_code: row.plan_code as PlanCode,
    amount_usd: Number(row.amount_usd),
    currency: row.currency,
    payment_method: row.payment_method,
    provider: row.provider,
    provider_payment_id: row.provider_payment_id,
    payment_url: row.payment_url,
    pay_address: row.pay_address,
    pay_amount: row.pay_amount ? Number(row.pay_amount) : null,
    status: row.status as CryptoPayment['status'],
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
    metadata: row.metadata || {},
  };
}

/**
 * Get payment events for a payment
 */
export async function getPaymentEvents(paymentId: string): Promise<{
  events: PaymentEvent[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { events: [], error: 'Not authenticated' };
    }

    const { data: events, error } = await (supabase as any)
      .from('payment_events')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { events: [], error: error.message };
    }

    return {
      events: (events || []).map((e: any) => ({
        id: e.id,
        payment_id: e.payment_id,
        event_type: e.event_type,
        provider_status: e.provider_status,
        raw_payload: e.raw_payload || {},
        created_at: e.created_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching payment events:', error);
    return {
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

