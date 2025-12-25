
import { useCachedDashboardQuery, useCachedSettingsQuery } from './useCachedQuery';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { compressTradeData } from '@/utils/dataCompression';

export const useTradingData = () => {
  const { user } = useAuth();

  const { data: botSettings, isLoading: botSettingsLoading } = useCachedSettingsQuery(
    ['bot-settings', user?.id || ''],
    async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bot settings:', error);
        throw error;
      }
      return data;
    },
    { enabled: !!user }
  );

  const { data: activeTrades, isLoading: activeTradesLoading } = useCachedDashboardQuery(
    ['active-trades', user?.id || ''],
    async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(10); // تحديد عدد الصفقات المعروضة
      
      if (error) throw error;
      return compressTradeData(data || []);
    },
    { 
      enabled: !!user,
      staleTime: 30 * 1000, // 30 ثانية stale time للصفقات النشطة
    }
  );

  const { data: performance, isLoading: performanceLoading } = useCachedDashboardQuery(
    ['trading-performance', user?.id || ''],
    async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('trading_performance')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.log('No trading performance data available yet');
          return null;
        }
        
        return data;
      } catch (error) {
        console.log('Trading performance will be available after first trades');
        return null;
      }
    },
    { 
      enabled: !!user,
      retry: false, // لا تعيد المحاولة للأداء
    }
  );

  const { data: notifications, isLoading: notificationsLoading } = useCachedDashboardQuery(
    ['notifications', user?.id || ''],
    async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false) // فقط الإشعارات غير المقروءة
        .order('created_at', { ascending: false })
        .limit(5); // تقليل العدد
      
      if (error) throw error;
      return data || [];
    },
    { 
      enabled: !!user,
      staleTime: 60 * 1000, // دقيقة stale time للإشعارات
    }
  );

  return {
    botSettings,
    activeTrades,
    performance,
    notifications,
    isLoading: botSettingsLoading || activeTradesLoading || performanceLoading || notificationsLoading,
  };
};
