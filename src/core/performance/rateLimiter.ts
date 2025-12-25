/**
 * Rate Limiter System
 * 
 * Phase X.15 - Security Hardening
 * Prevents abuse and ensures fair resource usage
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register a rate limit configuration
   */
  register(config: RateLimitConfig): void {
    this.configs.set(config.keyPrefix, config);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(userId: string, action: string): { allowed: boolean; remaining: number; resetAt: number } {
    const config = this.configs.get(action);
    if (!config) {
      // No limit configured, allow
      return { allowed: true, remaining: Infinity, resetAt: Date.now() };
    }

    const key = `${config.keyPrefix}:${userId}`;
    const now = Date.now();
    let entry = this.limits.get(key);

    // Cleanup expired entries
    if (entry && now > entry.resetAt) {
      this.limits.delete(key);
      entry = undefined;
    }

    if (!entry) {
      // First request in window
      entry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      this.limits.set(key, entry);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for user/action
   */
  reset(userId: string, action: string): void {
    const config = this.configs.get(action);
    if (!config) return;

    const key = `${config.keyPrefix}:${userId}`;
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Register default rate limits
rateLimiter.register({
  keyPrefix: 'ai-live-stream',
  maxRequests: 1,
  windowMs: 1000, // 1 request per second
});

rateLimiter.register({
  keyPrefix: 'indicator-analytics',
  maxRequests: 1,
  windowMs: 5000, // 1 request per 5 seconds
});

rateLimiter.register({
  keyPrefix: 'portfolio-sync',
  maxRequests: 1,
  windowMs: 60000, // 1 request per minute
});

rateLimiter.register({
  keyPrefix: 'auto-trader-execution',
  maxRequests: 1,
  windowMs: 2000, // 1 request per 2 seconds
});

// Auto-cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60 * 1000);
}

