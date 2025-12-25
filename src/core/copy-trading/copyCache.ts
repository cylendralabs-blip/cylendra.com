/**
 * Copy Trading Cache
 * 
 * Phase X.17 - Performance Improvements
 * 
 * Caching layer for copy trading data to reduce database queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CopyTradingCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache key for strategy performance
   */
  static getStrategyPerformanceKey(strategyId: string): string {
    return `strategy:performance:${strategyId}`;
  }

  /**
   * Get cache key for active followers
   */
  static getActiveFollowersKey(strategyId: string): string {
    return `strategy:followers:${strategyId}`;
  }

  /**
   * Get cache key for follower config
   */
  static getFollowerConfigKey(followerId: string, strategyId: string): string {
    return `follower:config:${followerId}:${strategyId}`;
  }

  /**
   * Get cache key for follower equity
   */
  static getFollowerEquityKey(followerId: string): string {
    return `follower:equity:${followerId}`;
  }

  /**
   * Invalidate strategy-related cache
   */
  invalidateStrategy(strategyId: string): void {
    this.delete(CopyTradingCache.getStrategyPerformanceKey(strategyId));
    this.delete(CopyTradingCache.getActiveFollowersKey(strategyId));
  }

  /**
   * Invalidate follower-related cache
   */
  invalidateFollower(followerId: string, strategyId?: string): void {
    if (strategyId) {
      this.delete(CopyTradingCache.getFollowerConfigKey(followerId, strategyId));
    }
    this.delete(CopyTradingCache.getFollowerEquityKey(followerId));
  }
}

// Export class for static methods
export { CopyTradingCache };

// Singleton instance
export const copyTradingCache = new CopyTradingCache();

// Clean expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    copyTradingCache.clearExpired();
  }, 60 * 1000);
}

