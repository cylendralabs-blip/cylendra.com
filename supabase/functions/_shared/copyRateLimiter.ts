/**
 * Copy Trading Rate Limiter
 * 
 * Phase X.17 - Security Improvements
 * 
 * Rate limiting for copy trading operations
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

class CopyRateLimiter {
  private store: RateLimitStore = {};
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configs
    this.configs.set('follow_strategy', { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10 per hour
    this.configs.set('create_strategy', { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }); // 5 per day
    this.configs.set('unfollow_strategy', { maxRequests: 20, windowMs: 60 * 60 * 1000 }); // 20 per hour
  }

  /**
   * Check if request is allowed
   */
  check(userId: string, action: string): { allowed: boolean; remaining: number; resetAt: number } {
    const config = this.configs.get(action);
    if (!config) {
      return { allowed: true, remaining: -1, resetAt: 0 };
    }

    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = this.store[key];

    // Clean expired entries
    this.cleanExpired();

    if (!entry || now > entry.resetAt) {
      // New window
      this.store[key] = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.store)) {
      if (now > entry.resetAt) {
        delete this.store[key];
      }
    }
  }

  /**
   * Reset rate limit for a user/action
   */
  reset(userId: string, action: string): void {
    const key = `${userId}:${action}`;
    delete this.store[key];
  }
}

// Singleton instance
export const copyRateLimiter = new CopyRateLimiter();

