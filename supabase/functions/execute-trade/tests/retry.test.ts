/**
 * Retry Logic Tests
 * 
 * Tests for retry mechanism with exponential backoff
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { 
  TEST_CONFIG,
  sleep
} from './setup.ts';
import { withRetry, isRetryableError } from '../retry.ts';
import { ExecuteTradeErrorCode, createError } from '../errors.ts';

Deno.test('Retry - Retryable Error Detection', () => {
  const retryableError = createError(ExecuteTradeErrorCode.RATE_LIMITED);
  const nonRetryableError = createError(ExecuteTradeErrorCode.INSUFFICIENT_BALANCE);
  
  assertEquals(isRetryableError(retryableError, [ExecuteTradeErrorCode.RATE_LIMITED]), true);
  assertEquals(isRetryableError(nonRetryableError, [ExecuteTradeErrorCode.RATE_LIMITED]), false);
});

Deno.test('Retry - Network Error Detection', () => {
  const networkError = new Error('Network timeout');
  const networkError2 = new Error('ECONNREFUSED');
  
  assertEquals(isRetryableError(networkError, []), true);
  assertEquals(isRetryableError(networkError2, []), true);
});

Deno.test('Retry - Success on First Attempt', async () => {
  let attemptCount = 0;
  
  const result = await withRetry(async () => {
    attemptCount++;
    return 'success';
  });
  
  assertEquals(result, 'success');
  assertEquals(attemptCount, 1);
});

Deno.test('Retry - Success After Retries', async () => {
  let attemptCount = 0;
  
  const result = await withRetry(
    async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw createError(ExecuteTradeErrorCode.RATE_LIMITED);
      }
      return 'success';
    },
    {
      maxAttempts: 3,
      baseDelay: 10, // Short delay for testing
      retryableErrors: [ExecuteTradeErrorCode.RATE_LIMITED]
    }
  );
  
  assertEquals(result, 'success');
  assertEquals(attemptCount, 3);
});

Deno.test('Retry - Non-Retryable Error Fails Immediately', async () => {
  let attemptCount = 0;
  
  try {
    await withRetry(
      async () => {
        attemptCount++;
        throw createError(ExecuteTradeErrorCode.INSUFFICIENT_BALANCE);
      },
      {
        maxAttempts: 3,
        retryableErrors: [ExecuteTradeErrorCode.RATE_LIMITED]
      }
    );
    
    // Should not reach here
    assertEquals(true, false);
  } catch (error) {
    assertEquals(attemptCount, 1); // Should only attempt once
    assertExists(error);
  }
});

Deno.test('Retry - Exhaust Retries', async () => {
  let attemptCount = 0;
  
  try {
    await withRetry(
      async () => {
        attemptCount++;
        throw createError(ExecuteTradeErrorCode.RATE_LIMITED);
      },
      {
        maxAttempts: 3,
        baseDelay: 10,
        retryableErrors: [ExecuteTradeErrorCode.RATE_LIMITED]
      }
    );
    
    // Should not reach here
    assertEquals(true, false);
  } catch (error) {
    assertEquals(attemptCount, 3); // Should attempt all retries
    assertExists(error);
  }
});


