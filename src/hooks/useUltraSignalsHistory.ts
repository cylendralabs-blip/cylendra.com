/**
 * useUltraSignalsHistory Hook
 * 
 * Fetches historical Ultra Signals from database
 * 
 * Phase X.4: UI - History Dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { getSignalsFromHistory, getHistoryStats } from '@/ai-signals';
import type { UltraSignal } from '@/ai-signals';

export interface HistoryFilters {
  symbol?: string;
  timeframe?: string;
  side?: 'BUY' | 'SELL' | 'WAIT';
  minConfidence?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useUltraSignalsHistory(filters: HistoryFilters = {}) {
  const {
    data: signals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ultra-signals-history', filters],
    queryFn: async (): Promise<UltraSignal[]> => {
      return getSignalsFromHistory(filters);
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['ultra-signals-history-stats', filters],
    queryFn: async () => {
      return getHistoryStats({
        symbol: filters.symbol,
        timeframe: filters.timeframe,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    signals,
    stats: stats || {
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      averageConfidence: 0,
      averageRR: 0,
      byTimeframe: {},
    },
    isLoading: isLoading || isLoadingStats,
    error,
    refetch,
  };
}

