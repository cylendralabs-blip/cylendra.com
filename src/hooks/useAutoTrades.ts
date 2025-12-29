/**
 * Hook to fetch auto trades from database
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AutoTrade {
  id: string;
  user_id: string;
  bot_id?: string;
  signal_id?: string;
  signal_source: string;
  pair: string;
  direction: 'long' | 'short';
  status: 'accepted' | 'rejected' | 'error' | 'pending';
  reason_code?: string;
  created_at: string;
  executed_at?: string;
  position_id?: string;
  metadata?: Record<string, any>;
}

export interface AutoTradeLog {
  id: string;
  auto_trade_id: string;
  step: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
}

interface UseAutoTradesParams {
  status?: 'accepted' | 'rejected' | 'error' | 'pending' | 'all';
  pair?: string;
  signalSource?: string;
  direction?: 'long' | 'short' | 'all';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export const useAutoTrades = (params: UseAutoTradesParams = {}) => {
  const { user } = useAuth();
  const {
    status = 'all',
    pair,
    signalSource,
    direction = 'all',
    dateFrom,
    dateTo,
    limit = 100
  } = params;

  return useQuery({
    queryKey: ['auto-trades', user?.id, status, pair, signalSource, direction, dateFrom, dateTo],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = (supabase as any)
        .from('auto_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (pair) {
        query = query.ilike('pair', `%${pair}%`);
      }

      if (signalSource) {
        query = query.eq('signal_source', signalSource);
      }

      if (direction !== 'all') {
        query = query.eq('direction', direction);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching auto trades:', error);
        return [];
      }

      return (data || []) as AutoTrade[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};

export const useAutoTradeLogs = (autoTradeId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['auto-trade-logs', autoTradeId],
    queryFn: async () => {
      if (!autoTradeId || !user?.id) return [];

      const { data, error } = await (supabase as any)
        .from('auto_trade_logs')
        .select('*')
        .eq('auto_trade_id', autoTradeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching auto trade logs:', error);
        return [];
      }

      return (data || []) as AutoTradeLog[];
    },
    enabled: !!autoTradeId && !!user?.id
  });
};

