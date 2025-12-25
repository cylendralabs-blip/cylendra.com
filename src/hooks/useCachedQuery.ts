
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cacheManager } from '@/utils/cacheManager';
import { compressJSON } from '@/utils/dataCompression';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  cacheTTL?: number;
  enableCompression?: boolean;
  enableBackgroundRefresh?: boolean;
}

export const useCachedQuery = <T>({
  queryKey,
  queryFn,
  cacheTTL = 15 * 60 * 1000, // زيادة إلى 15 دقيقة
  enableCompression = false,
  enableBackgroundRefresh = true,
  ...options
}: CachedQueryOptions<T>) => {
  const cacheKey = queryKey.join('-');

  return useQuery({
    queryKey,
    queryFn: async () => {
      return await cacheManager.getOrSet(
        cacheKey,
        async () => {
          console.log(`Cache miss for: ${cacheKey}, fetching...`);
          const freshData = await queryFn();
          
          if (enableCompression && freshData) {
            try {
              return JSON.parse(compressJSON(freshData));
            } catch (error) {
              console.warn('Compression failed, using original data');
              return freshData;
            }
          }
          
          return freshData;
        },
        cacheTTL
      );
    },
    staleTime: cacheTTL / 2,
    gcTime: cacheTTL,
    // تحسين الأداء
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    // تفعيل Background Refresh
    refetchInterval: enableBackgroundRefresh ? cacheTTL : false,
    ...options
  });
};

// Hook محسن للبيانات المتغيرة بكثرة (الأسعار)
export const useCachedPriceQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<CachedQueryOptions<T>>
) => {
  return useCachedQuery({
    queryKey,
    queryFn,
    cacheTTL: 60 * 1000, // زيادة إلى دقيقة واحدة
    enableCompression: true,
    refetchInterval: 60 * 1000,
    enableBackgroundRefresh: true,
    ...options
  });
};

// Hook محسن للبيانات الثابتة نسبياً (الإعدادات)
export const useCachedSettingsQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<CachedQueryOptions<T>>
) => {
  return useCachedQuery({
    queryKey,
    queryFn,
    cacheTTL: 30 * 60 * 1000, // زيادة إلى 30 دقيقة
    enableBackgroundRefresh: false, // البيانات ثابتة
    refetchOnWindowFocus: false,
    ...options
  });
};

// Hook جديد للبيانات السريعة (Dashboard)
export const useCachedDashboardQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<CachedQueryOptions<T>>
) => {
  return useCachedQuery({
    queryKey,
    queryFn,
    cacheTTL: 5 * 60 * 1000, // 5 دقائق
    enableCompression: true,
    enableBackgroundRefresh: true,
    staleTime: 2 * 60 * 1000, // 2 دقيقة stale time
    ...options
  });
};
