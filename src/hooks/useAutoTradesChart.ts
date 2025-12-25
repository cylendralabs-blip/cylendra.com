/**
 * Hook to fetch auto trades data for chart overlay
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AutoTradeChartData {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  executed_at: string;
  entry_price: number;
  exit_price: number | null;
  dca_levels: number[] | null;
  tp: number | null;
  sl: number | null;
  pnl: number | null;
  status: 'accepted' | 'rejected' | 'error' | 'pending';
  reason_code: string | null;
  signal_source: string;
  position_id: string | null;
}

interface UseAutoTradesChartParams {
  pair?: string;
  timeframe?: string;
  limit?: number;
  enabled?: boolean;
}

export const useAutoTradesChart = (params: UseAutoTradesChartParams = {}) => {
  const { user } = useAuth();
  const {
    pair,
    timeframe,
    limit = 200,
    enabled = true
  } = params;

  return useQuery({
    queryKey: ['auto-trades-chart', user?.id, pair, timeframe, limit],
    queryFn: async (): Promise<AutoTradeChartData[]> => {
      if (!user?.id) return [];

      // Normalize pair format (BTC/USDT -> BTCUSDT)
      const normalizedPair = pair?.replace('/', '').toUpperCase();

      let query = (supabase as any)
        .from('auto_trades')
        .select(`
          id,
          pair,
          direction,
          executed_at,
          status,
          reason_code,
          signal_source,
          position_id,
          metadata
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .not('executed_at', 'is', null)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (normalizedPair) {
        query = query.ilike('pair', `%${normalizedPair}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching auto trades for chart:', error);
        return [];
      }

      // Transform data and fetch exit info from positions
      const chartData: AutoTradeChartData[] = [];

      for (const trade of (data || [])) {
        const metadata = trade.metadata || {};
        const entryPrice = metadata.entry_price || metadata.entryPrice || null;
        
        if (!entryPrice) continue; // Skip trades without entry price

        // Get exit info from position if available
        let exitPrice: number | null = null;
        let pnl: number | null = null;

        if (trade.position_id) {
          try {
            const { data: position } = await (supabase as any)
              .from('trades')
              .select('closed_at, realized_pnl, unrealized_pnl, current_price')
              .eq('id', trade.position_id)
              .maybeSingle();

            if (position) {
              if (position.closed_at) {
                // Trade is closed
                exitPrice = position.current_price || null;
                pnl = position.realized_pnl || null;
              } else {
                // Trade is still open
                exitPrice = position.current_price || null;
                pnl = position.unrealized_pnl || null;
              }
            }
          } catch (err) {
            // Position might not exist, continue without exit info
            console.warn('Error fetching position data:', err);
          }
        }

        // Extract DCA levels from metadata
        const dcaLevels: number[] | null = metadata.dca_levels || 
          (metadata.dcaLevels ? metadata.dcaLevels.map((d: any) => d.targetPrice || d.price) : null);

        chartData.push({
          id: trade.id,
          pair: trade.pair,
          direction: trade.direction,
          executed_at: trade.executed_at,
          entry_price: entryPrice,
          exit_price: exitPrice,
          dca_levels: dcaLevels,
          tp: metadata.take_profit_price || metadata.takeProfit || metadata.tp || null,
          sl: metadata.stop_loss_price || metadata.stopLoss || metadata.sl || null,
          pnl: pnl,
          status: trade.status,
          reason_code: trade.reason_code,
          signal_source: trade.signal_source,
          position_id: trade.position_id
        });
      }

      return chartData;
    },
    enabled: enabled && !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000 // Refetch every 60 seconds
  });
};

