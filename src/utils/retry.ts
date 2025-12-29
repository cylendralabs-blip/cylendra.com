/**
 * Generic retry utility for client-side operations.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  exponential?: boolean;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 750,
  maxDelayMs: 8_000,
  exponential: true,
  shouldRetry: defaultShouldRetry
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= config.maxAttempts) {
        break;
      }

      const retryable = config.shouldRetry?.(error) ?? true;
      if (!retryable) {
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError;
}

function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  if (!options.exponential) {
    return options.baseDelayMs;
  }

  const exponentialDelay = options.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = exponentialDelay * 0.25 * Math.random();
  return Math.min(exponentialDelay + jitter, options.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultShouldRetry(error: any): boolean {
  if (!error) return true;

  const status =
    (error?.status as number | undefined) ??
    (error?.statusCode as number | undefined) ??
    (typeof error?.code === 'number' ? error.code : undefined);

  if (status && [408, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = (error?.message || '').toString().toLowerCase();
  if (message.includes('network') || message.includes('fetch')) {
    return true;
  }

  return false;
}

