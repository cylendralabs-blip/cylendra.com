/**
 * Rate Limiter for Edge Functions
 * 
 * Phase X.15 - Security Hardening
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class EdgeRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if request is allowed
   */
  isAllowed(
    userId: string,
    action: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const key = `${action}:${userId}`;
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
        resetAt: now + windowMs,
      };
      this.limits.set(key, entry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    if (entry.count >= maxRequests) {
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
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
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
export const edgeRateLimiter = new EdgeRateLimiter();

// Auto-cleanup every minute
setInterval(() => {
  edgeRateLimiter.cleanup();
}, 60 * 1000);

