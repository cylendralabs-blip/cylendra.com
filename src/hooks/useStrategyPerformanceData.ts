import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StrategyPerformanceData {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgReturn: number;
  maxDrawdown: number;
}

export interface StrategyStats {
  strategyId: string;
  strategyName: string;
  performance: StrategyPerformanceData;
}

/**
 * Hook to fetch strategy performance data from strategy_trades table
 * Phase 18: Updated to use real strategy_trades table
 */
export const useStrategyPerformanceData = (timeRange: string = '30d') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategy-performance', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return { performanceData: [], strategyStats: [] };

      try {
        // Calculate date range
        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);

        // Fetch strategy trades
        const { data: trades, error } = await (supabase as any)
          .from('strategy_trades')
          .select('*')
          .eq('user_id', user.id)
          .gte('opened_at', startDate.toISOString())
          .order('opened_at', { ascending: false });

        if (error) {
          console.error('Error fetching strategy trades:', error);
          return { performanceData: [], strategyStats: [] };
        }

        if (!trades || trades.length === 0) {
          return { performanceData: [], strategyStats: [] };
        }

        const tradesData = (trades as unknown as any[]);

        // Calculate performance metrics
        const closedTrades = tradesData.filter((t: any) => t.status === 'closed' && t.pnl_amount !== null);
        const totalTrades = closedTrades.length;
        const winningTrades = closedTrades.filter((t: any) => (t.pnl_amount || 0) > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const totalPnL = closedTrades.reduce((sum: number, t: any) => sum + (parseFloat(t.pnl_amount?.toString() || '0')), 0);
        const avgReturn = totalTrades > 0 
          ? closedTrades.reduce((sum: number, t: any) => sum + (parseFloat(t.pnl_percentage?.toString() || '0')), 0) / totalTrades
          : 0;

        // Calculate max drawdown (simplified)
        let maxDrawdown = 0;
        let peak = 0;
        let runningPnL = 0;
        
        for (const trade of closedTrades.sort((a: any, b: any) => 
          new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime()
        )) {
          runningPnL += parseFloat(trade.pnl_amount?.toString() || '0');
          if (runningPnL > peak) {
            peak = runningPnL;
          }
          const drawdown = ((peak - runningPnL) / (peak || 1)) * 100;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
        }

        const performanceData: StrategyPerformanceData = {
          totalTrades,
          winRate,
          totalPnL,
          avgReturn,
          maxDrawdown: -maxDrawdown, // Negative value
        };

        // Group by strategy_id for strategy stats
        const strategyMap = new Map<string, StrategyStats>();
        
        for (const trade of tradesData) {
          if (!trade.strategy_id) continue;
          
          if (!strategyMap.has(trade.strategy_id)) {
            strategyMap.set(trade.strategy_id, {
              strategyId: trade.strategy_id,
              strategyName: `Strategy ${trade.strategy_id.substring(0, 8)}`,
              performance: {
                totalTrades: 0,
                winRate: 0,
                totalPnL: 0,
                avgReturn: 0,
                maxDrawdown: 0,
              },
            });
          }
        }

        // Calculate per-strategy stats
        for (const [strategyId, stats] of strategyMap.entries()) {
          const strategyTrades = closedTrades.filter((t: any) => t.strategy_id === strategyId);
          const strategyTotalTrades = strategyTrades.length;
          const strategyWinningTrades = strategyTrades.filter((t: any) => (t.pnl_amount || 0) > 0).length;
          const strategyWinRate = strategyTotalTrades > 0 ? (strategyWinningTrades / strategyTotalTrades) * 100 : 0;
          const strategyTotalPnL = strategyTrades.reduce((sum: number, t: any) => sum + (parseFloat(t.pnl_amount?.toString() || '0')), 0);
          const strategyAvgReturn = strategyTotalTrades > 0
            ? strategyTrades.reduce((sum: number, t: any) => sum + (parseFloat(t.pnl_percentage?.toString() || '0')), 0) / strategyTotalTrades
            : 0;

          stats.performance = {
            totalTrades: strategyTotalTrades,
            winRate: strategyWinRate,
            totalPnL: strategyTotalPnL,
            avgReturn: strategyAvgReturn,
            maxDrawdown: 0, // Simplified - can be enhanced
          };
        }

        return {
          performanceData: [performanceData],
          strategyStats: Array.from(strategyMap.values()),
        };
      } catch (error) {
        console.error('Error in useStrategyPerformanceData:', error);
        return { performanceData: [], strategyStats: [] };
      }
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
};
