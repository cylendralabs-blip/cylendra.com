/**
 * Indicator Cache System
 * 
 * Phase X.15 - Performance Optimization
 * Caches indicator calculations to reduce latency
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class IndicatorCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 60 * 1000; // 1 minute default TTL

  /**
   * Generate cache key from symbol, timeframe, and indicator type
   */
  private getCacheKey(symbol: string, timeframe: string, indicatorType: string): string {
    return `${symbol}:${timeframe}:${indicatorType}`;
  }

  /**
   * Get cached indicator data
   */
  get<T>(symbol: string, timeframe: string, indicatorType: string): T | null {
    const key = this.getCacheKey(symbol, timeframe, indicatorType);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached indicator data
   */
  set<T>(symbol: string, timeframe: string, indicatorType: string, data: T, ttlMs?: number): void {
    const key = this.getCacheKey(symbol, timeframe, indicatorType);
    const now = Date.now();
    const ttl = ttlMs ?? this.DEFAULT_TTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Clear cache for specific symbol/timeframe
   */
  clear(symbol: string, timeframe: string): void {
    const prefix = `${symbol}:${timeframe}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: number } {
    this.cleanup();
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }
}

// Singleton instance
export const indicatorCache = new IndicatorCache();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    indicatorCache.cleanup();
  }, 5 * 60 * 1000);
}

