/**
 * Idempotency Support
 * 
 * Prevents duplicate order execution using clientOrderId
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Generate client order ID for idempotency
 */
export function generateClientOrderId(
  userId: string,
  signalId: string | undefined,
  symbol: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const prefix = signalId ? `SIG-${signalId}` : 'TRADE';
  return `${prefix}-${userId.slice(0, 8)}-${symbol.replace('/', '')}-${ts}`;
}

/**
 * Check if order already exists (idempotency check)
 */
export async function checkOrderExists(
  supabaseClient: ReturnType<typeof createClient>,
  clientOrderId: string,
  userId: string
): Promise<{
  exists: boolean;
  tradeId?: string;
  orderId?: string;
}> {
  try {
    // Check in trades table by clientOrderId or platform_order_id
    const { data: existingTrade, error } = await supabaseClient
      .from('trades')
      .select('id, platform_order_id')
      .eq('user_id', userId)
      .or(`platform_order_id.eq.${clientOrderId},client_order_id.eq.${clientOrderId}`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw error;
    }

    if (existingTrade) {
      return {
        exists: true,
        tradeId: existingTrade.id,
        orderId: existingTrade.platform_order_id
      };
    }

    // Check in dca_orders table
    const { data: existingDCA, error: dcaError } = await supabaseClient
      .from('dca_orders')
      .select('trade_id, platform_order_id')
      .eq('user_id', userId)
      .eq('platform_order_id', clientOrderId)
      .limit(1)
      .single();

    if (dcaError && dcaError.code !== 'PGRST116') {
      throw dcaError;
    }

    if (existingDCA) {
      return {
        exists: true,
        tradeId: existingDCA.trade_id,
        orderId: existingDCA.platform_order_id
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking order existence:', error);
    // On error, assume order doesn't exist (fail open)
    return { exists: false };
  }
}

/**
 * Store client order ID for idempotency tracking
 */
export async function storeClientOrderId(
  supabaseClient: ReturnType<typeof createClient>,
  tradeId: string,
  clientOrderId: string
): Promise<void> {
  try {
    // Update trade with client_order_id
    const { error } = await supabaseClient
      .from('trades')
      .update({ client_order_id: clientOrderId })
      .eq('id', tradeId);

    if (error) {
      console.error('Error storing client order ID:', error);
      // Non-critical error, continue execution
    }
  } catch (error) {
    console.error('Error storing client order ID:', error);
    // Non-critical error, continue execution
  }
}


