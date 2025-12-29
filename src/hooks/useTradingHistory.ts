
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade, DCAOrder, PlatformSyncStatus } from '@/types/trade';

export const useTradingHistory = (selectedStatus: string, selectedPlatform: string = 'all') => {
  const { user } = useAuth();

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trading-history', user?.id, selectedStatus, selectedPlatform],
    queryFn: async (): Promise<Trade[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // فلترة حسب الحالة
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus.toUpperCase());
      }

      // فلترة حسب المنصة
      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Map database records to Trade type with default values for missing fields
      return (data || []).map(trade => ({
        ...trade,
        fees: null,
        commission: null,
        platform_trade_id: null,
        last_sync_at: null,
        sync_status: null,
        notes: null
      }));
    },
    enabled: !!user,
  });

  const { data: dcaOrders } = useQuery({
    queryKey: ['dca-orders', user?.id, selectedPlatform],
    queryFn: async (): Promise<DCAOrder[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('dca_orders')
        .select(`
          *,
          trades!inner(symbol, side, trade_type, platform)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // فلترة حسب المنصة عبر join مع trades
      if (selectedPlatform !== 'all') {
        query = query.eq('trades.platform', selectedPlatform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: platformSyncStatus } = useQuery({
    queryKey: ['platform-sync-status', user?.id],
    queryFn: async (): Promise<PlatformSyncStatus[]> => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('platform_sync_status')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching platform sync status:', error);
          return [];
        }

        // Map to PlatformSyncStatus format
        return (data || []).map((status: any) => ({
          id: status.id,
          user_id: status.user_id,
          platform: status.exchange,
          last_sync_at: status.last_portfolio_sync_at || status.last_positions_sync_at || status.created_at,
          sync_status: status.status,
          error_message: status.last_error,
          created_at: status.created_at,
          updated_at: status.updated_at,
        }));
      } catch (error) {
        console.error('Error in platform sync status query:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // استخراج قائمة المنصات المتاحة
  const availablePlatforms = trades ? 
    [...new Set(trades.map(trade => trade.platform).filter(Boolean))] as string[] : 
    [];

  return {
    trades,
    dcaOrders,
    platformSyncStatus,
    availablePlatforms,
    isLoading
  };
};
