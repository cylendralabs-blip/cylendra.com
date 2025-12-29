/**
 * Idempotency Tests
 * 
 * Tests for idempotency and duplicate order prevention
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { 
  TEST_CONFIG, 
  isTestEnvironmentConfigured,
  getTestSupabaseClient,
  cleanupTestData,
  sleep
} from './setup.ts';
import { generateClientOrderId, checkOrderExists } from '../idempotency.ts';

Deno.test('Idempotency - Generate Client Order ID', () => {
  const userId = TEST_CONFIG.TEST_USER_ID;
  const signalId = 'test-signal-123';
  const symbol = TEST_CONFIG.TEST_SYMBOL;
  
  const clientOrderId1 = generateClientOrderId(userId, signalId, symbol);
  const clientOrderId2 = generateClientOrderId(userId, signalId, symbol);
  
  // Should generate same ID if signalId and timestamp are same
  console.log('Client Order ID 1:', clientOrderId1);
  console.log('Client Order ID 2:', clientOrderId2);
  
  assertExists(clientOrderId1);
  assertExists(clientOrderId2);
  assertEquals(typeof clientOrderId1, 'string');
  assertEquals(typeof clientOrderId2, 'string');
});

Deno.test('Idempotency - Generate Unique Client Order IDs', () => {
  const userId = TEST_CONFIG.TEST_USER_ID;
  const symbol = TEST_CONFIG.TEST_SYMBOL;
  
  const clientOrderId1 = generateClientOrderId(userId, 'signal-1', symbol);
  await sleep(10); // Small delay to ensure different timestamp
  const clientOrderId2 = generateClientOrderId(userId, 'signal-2', symbol);
  
  // Should generate different IDs for different signals
  console.log('Client Order ID 1:', clientOrderId1);
  console.log('Client Order ID 2:', clientOrderId2);
  
  assertExists(clientOrderId1);
  assertExists(clientOrderId2);
  // Should be different
  assertEquals(clientOrderId1 !== clientOrderId2, true);
});

Deno.test({
  name: 'Idempotency - Check Order Exists',
  ignore: !isTestEnvironmentConfigured(),
  async fn() {
    const supabaseClient = getTestSupabaseClient();
    const clientOrderId = generateClientOrderId(
      TEST_CONFIG.TEST_USER_ID,
      'test-signal',
      TEST_CONFIG.TEST_SYMBOL
    );
    
    // Check non-existent order
    const result = await checkOrderExists(
      supabaseClient,
      clientOrderId,
      TEST_CONFIG.TEST_USER_ID
    );
    
    console.log('Check order exists result:', result);
    
    assertEquals(result.exists, false);
  }
});


