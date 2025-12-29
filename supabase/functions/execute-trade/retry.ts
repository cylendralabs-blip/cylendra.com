/**
 * Retry Logic
 * 
 * Retry utilities for network errors and rate limits
 */

import { ExecuteTradeError, ExecuteTradeErrorCode, createError } from './errors.ts';

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBackoff: boolean;
  retryableErrors: ExecuteTradeErrorCode[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
  retryableErrors: [
    ExecuteTradeErrorCode.RATE_LIMITED,
    ExecuteTradeErrorCode.NETWORK_TIMEOUT,
    ExecuteTradeErrorCode.NETWORK_ERROR,
    ExecuteTradeErrorCode.EXCHANGE_UNAVAILABLE,
    ExecuteTradeErrorCode.TOO_MANY_REQUESTS
  ]
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for retry
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  if (!config.exponentialBackoff) {
    return config.baseDelay;
  }

  const exponentialDelay = config.baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(
  error: any,
  retryableCodes: ExecuteTradeErrorCode[]
): boolean {
  if (error instanceof ExecuteTradeError) {
    return retryableCodes.includes(error.code) || error.retryable;
  }

  // Check for network errors
  const errorMsg = String(error?.message || error).toLowerCase();
  if (
    errorMsg.includes('timeout') ||
    errorMsg.includes('network') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('rate limit')
  ) {
    return true;
  }

  return false;
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt >= finalConfig.maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, finalConfig.retryableErrors)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, finalConfig);
      console.log(
        `Retry attempt ${attempt}/${finalConfig.maxAttempts} after ${delay}ms`,
        error
      );

      await sleep(delay);
    }
  }

  // All retries exhausted
  throw createError(
    ExecuteTradeErrorCode.RETRY_EXHAUSTED,
    `Retry exhausted after ${finalConfig.maxAttempts} attempts`,
    { originalError: lastError }
  );
}

/**
 * Retry with exponential backoff (simple wrapper)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  return withRetry(fn, { maxAttempts });
}


