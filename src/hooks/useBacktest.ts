/**
 * Backtest Hooks
 * 
 * React hooks for backtest operations
 * 
 * Phase 2: Backtest UI - Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  startBacktest,
  getBacktestRun,
  getUserBacktestRuns,
  getBacktestTrades,
  type BacktestStartRequest,
  type BacktestStartResponse,
  type BacktestRunStatus
} from '@/services/backtest/backtestService';

/**
 * Hook to start a new backtest
 */
export function useStartBacktest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BacktestStartRequest): Promise<BacktestStartResponse> => {
      if (!user) {
        throw new Error('User must be authenticated');
      }
      return startBacktest(request);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backtest-runs'] });
      toast({
        title: 'تم بدء الباك تست',
        description: 'جاري تشغيل الباك تست...'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'فشل بدء الباك تست',
        description: error.message || 'حدث خطأ أثناء بدء الباك تست',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to get backtest run status
 */
export function useBacktestRun(runId: string | null, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ['backtest-run', runId],
    queryFn: () => {
      if (!runId) return null;
      return getBacktestRun(runId);
    },
    enabled: (options?.enabled !== false) && !!runId,
    refetchInterval: options?.refetchInterval || 2000, // Poll every 2 seconds
    retry: false
  });
}

/**
 * Hook to get all user backtest runs
 */
export function useUserBacktestRuns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['backtest-runs', user?.id],
    queryFn: () => getUserBacktestRuns(),
    enabled: !!user,
    staleTime: 30000 // 30 seconds
  });
}

/**
 * Hook to get backtest trades
 */
export function useBacktestTrades(runId: string | null) {
  return useQuery({
    queryKey: ['backtest-trades', runId],
    queryFn: () => {
      if (!runId) return [];
      return getBacktestTrades(runId);
    },
    enabled: !!runId,
    staleTime: 60000 // 1 minute
  });
}

