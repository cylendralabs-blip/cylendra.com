
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 15 * 60 * 1000; // زيادة إلى 15 دقيقة

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // جلب البيانات من Cache أو تنفيذ الدالة وحفظها
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // تنظيف البيانات المنتهية الصلاحية
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // إحصائيات Cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // تحميل البيانات مسبقاً
  async preload(key: string, fetchFn: () => Promise<any>, ttl?: number): Promise<void> {
    if (!this.get(key)) {
      try {
        const data = await fetchFn();
        this.set(key, data, ttl);
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// تنظيف دوري كل 5 دقائق بدلاً من 10
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);
