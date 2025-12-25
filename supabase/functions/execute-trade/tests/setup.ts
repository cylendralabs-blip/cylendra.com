/**
 * Test Setup
 * 
 * Shared test utilities and configuration
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Test Configuration
 */
export const TEST_CONFIG = {
  // Testnet credentials (should be set in environment)
  BINANCE_TESTNET_API_KEY: Deno.env.get('BINANCE_TESTNET_API_KEY') || '',
  BINANCE_TESTNET_SECRET_KEY: Deno.env.get('BINANCE_TESTNET_SECRET_KEY') || '',
  OKX_TESTNET_API_KEY: Deno.env.get('OKX_TESTNET_API_KEY') || '',
  OKX_TESTNET_SECRET_KEY: Deno.env.get('OKX_TESTNET_SECRET_KEY') || '',
  OKX_TESTNET_PASSPHRASE: Deno.env.get('OKX_TESTNET_PASSPHRASE') || '',
  
  // Test symbols
  TEST_SYMBOL: 'BTC/USDT',
  TEST_SYMBOL_BINANCE: 'BTCUSDT',
  TEST_SYMBOL_OKX: 'BTC-USDT',
  
  // Test amounts (very small for testnet)
  TEST_AMOUNT: 10, // $10 USD
  MIN_AMOUNT: 5, // Minimum for testnet
  
  // Test prices
  TEST_ENTRY_PRICE: 50000,
  TEST_STOP_LOSS_PRICE: 48000,
  TEST_TAKE_PROFIT_PRICE: 52000,
  
  // Test user (mock user ID for testing)
  TEST_USER_ID: '00000000-0000-0000-0000-000000000000',
} as const;

/**
 * Check if test environment is properly configured
 */
export function isTestEnvironmentConfigured(): boolean {
  return !!(
    TEST_CONFIG.BINANCE_TESTNET_API_KEY &&
    TEST_CONFIG.BINANCE_TESTNET_SECRET_KEY &&
    TEST_CONFIG.OKX_TESTNET_API_KEY &&
    TEST_CONFIG.OKX_TESTNET_SECRET_KEY &&
    TEST_CONFIG.OKX_TESTNET_PASSPHRASE
  );
}

/**
 * Get test Supabase client
 */
export function getTestSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured for testing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Sleep utility for delays in tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert order response structure
 */
export function assertOrderResponse(order: any): void {
  if (!order) {
    throw new Error('Order response is null or undefined');
  }
  
  if (!order.orderId && !order.order_id) {
    throw new Error('Order ID is missing');
  }
  
  if (!order.symbol && !order.instId) {
    throw new Error('Symbol is missing');
  }
}

/**
 * Assert trade record structure
 */
export function assertTradeRecord(trade: any): void {
  if (!trade) {
    throw new Error('Trade record is null or undefined');
  }
  
  if (!trade.id) {
    throw new Error('Trade ID is missing');
  }
  
  if (!trade.user_id) {
    throw new Error('User ID is missing');
  }
  
  if (!trade.symbol) {
    throw new Error('Symbol is missing');
  }
  
  if (!trade.status) {
    throw new Error('Status is missing');
  }
}

/**
 * Clean up test data (to be implemented per test)
 */
export async function cleanupTestData(
  supabaseClient: ReturnType<typeof getTestSupabaseClient>,
  tradeId?: string,
  userId?: string
): Promise<void> {
  try {
    if (tradeId) {
      // Clean up trade orders
      await supabaseClient
        .from('trade_orders')
        .delete()
        .eq('trade_id', tradeId);
      
      // Clean up order events
      await supabaseClient
        .from('order_events')
        .delete()
        .eq('trade_id', tradeId);
      
      // Clean up DCA orders
      await supabaseClient
        .from('dca_orders')
        .delete()
        .eq('trade_id', tradeId);
      
      // Clean up trade
      await supabaseClient
        .from('trades')
        .delete()
        .eq('id', tradeId);
    }
    
    if (userId) {
      // Clean up all test trades for user
      await supabaseClient
        .from('trades')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', TEST_CONFIG.TEST_SYMBOL);
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    // Don't throw, cleanup is best-effort
  }
}

/**
 * Test helper: Create mock request
 */
export function createMockRequest(body: any, headers: Record<string, string> = {}): Request {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token`,
    ...headers
  };
  
  return new Request('http://localhost/execute-trade', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body)
  });
}


