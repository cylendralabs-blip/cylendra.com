import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StrategyTrade {
  id: string;
  user_id: string;
  strategy_id: string;
  position_id?: string;
  exchange: string;
  symbol: string;
  side: 'long' | 'short' | 'buy' | 'sell';
  volume: number;
  entry_price: number;
  exit_price?: number;
  pnl_amount?: number;
  pnl_percentage?: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed' | 'stopped' | 'liquidated';
  created_at: string;
  updated_at: string;
}

/**
 * Hook to manage strategy trades using strategy_trades table
 * Phase 18: Updated to use real strategy_trades table
 */
export const useStrategyTrades = (strategyId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch trades
  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: ['strategy-trades', user?.id, strategyId],
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = (supabase as any)
          .from('strategy_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('opened_at', { ascending: false });

        if (strategyId) {
          query = query.eq('strategy_id', strategyId);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          console.error('Error fetching strategy trades:', queryError);
          return [];
        }

        return ((data || []) as unknown as StrategyTrade[]);
      } catch (error) {
        console.error('Error in useStrategyTrades:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Create trade mutation
  const createTrade = useMutation({
    mutationFn: async (tradeData: {
      strategy_id: string;
      position_id?: string;
      exchange: string;
      symbol: string;
      side: 'long' | 'short' | 'buy' | 'sell';
      volume: number;
      entry_price: number;
      opened_at?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('strategy_trades')
        .insert({
          ...tradeData,
          user_id: user.id,
          status: 'open',
          opened_at: tradeData.opened_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return (data as unknown as StrategyTrade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-trades', user?.id] });
    },
  });

  // Update trade mutation
  const updateTrade = useMutation({
    mutationFn: async ({
      tradeId,
      updates,
    }: {
      tradeId: string;
      updates: Partial<StrategyTrade>;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('strategy_trades')
        .update(updates)
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return (data as unknown as StrategyTrade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-trades', user?.id] });
    },
  });

  // Close trade mutation
  const closeTrade = useMutation({
    mutationFn: async ({
      tradeId,
      exitPrice,
      pnlAmount,
      pnlPercentage,
    }: {
      tradeId: string;
      exitPrice: number;
      pnlAmount?: number;
      pnlPercentage?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('strategy_trades')
        .update({
          exit_price: exitPrice,
          closed_at: new Date().toISOString(),
          status: 'closed',
          pnl_amount: pnlAmount,
          pnl_percentage: pnlPercentage,
        })
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return (data as unknown as StrategyTrade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-trades', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['strategy-performance', user?.id] });
    },
  });

  return {
    trades,
    isLoading,
    error,
    createTrade,
    updateTrade,
    closeTrade,
  };
};
