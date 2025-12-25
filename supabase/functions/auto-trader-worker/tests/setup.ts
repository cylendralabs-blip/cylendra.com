/**
 * Test Setup
 * 
 * Shared test utilities for auto-trader-worker tests
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Test Configuration
 */
export const TEST_CONFIG = {
  // Test user (mock user ID for testing)
  TEST_USER_ID: '00000000-0000-0000-0000-000000000000',
  
  // Test signal data
  TEST_SYMBOL: 'BTC/USDT',
  TEST_ENTRY_PRICE: 50000,
  TEST_CONFIDENCE: 80,
  
  // Test bot settings
  TEST_BOT_SETTINGS: {
    is_active: true,
    market_type: 'spot',
    max_active_trades: 5,
    allow_long_trades: true,
    allow_short_trades: true
  }
} as const;

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
 * Clean up test data
 */
export async function cleanupTestData(
  supabaseClient: ReturnType<typeof getTestSupabaseClient>,
  signalIds?: string[],
  userId?: string
): Promise<void> {
  try {
    if (signalIds && signalIds.length > 0) {
      // Clean up test signals
      await supabaseClient
        .from('tradingview_signals')
        .delete()
        .in('id', signalIds);
    }
    
    if (userId) {
      // Clean up all test signals for user
      await supabaseClient
        .from('tradingview_signals')
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
 * Create test signal
 */
export async function createTestSignal(
  supabaseClient: ReturnType<typeof getTestSupabaseClient>,
  userId: string,
  overrides: any = {}
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('tradingview_signals')
    .insert({
      user_id: userId,
      symbol: TEST_CONFIG.TEST_SYMBOL,
      timeframe: '1h',
      signal_type: 'BUY',
      signal_strength: 'STRONG',
      confidence_score: TEST_CONFIG.TEST_CONFIDENCE,
      entry_price: TEST_CONFIG.TEST_ENTRY_PRICE,
      stop_loss_price: TEST_CONFIG.TEST_ENTRY_PRICE * 0.95,
      take_profit_price: TEST_CONFIG.TEST_ENTRY_PRICE * 1.05,
      risk_reward_ratio: 2.0,
      strategy_name: 'Test Strategy',
      execution_status: 'PENDING',
      ...overrides
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

