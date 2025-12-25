/**
 * Backtest Optimization Hook
 * 
 * React hook for parameter optimization
 * 
 * Phase 4: Advanced Features - Task 3
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  startOptimization,
  getOptimizationResults,
  type OptimizationRequest,
  type OptimizationResult
} from '@/services/backtest/optimizationService';

/**
 * Hook to start optimization
 */
export function useStartOptimization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: OptimizationRequest) => {
      if (!user) {
        throw new Error('User must be authenticated');
      }
      return startOptimization(request);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backtest-optimizations'] });
      toast({
        title: 'تم بدء التحسين',
        description: `جاري تشغيل ${data.totalCombinations} اختبار للعثور على أفضل الإعدادات...`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'فشل بدء التحسين',
        description: error.message || 'حدث خطأ أثناء بدء عملية التحسين',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to get optimization results
 */
export function useOptimizationResults(optimizationId: string | null) {
  return useQuery({
    queryKey: ['backtest-optimization', optimizationId],
    queryFn: () => {
      if (!optimizationId) return null;
      return getOptimizationResults(optimizationId);
    },
    enabled: !!optimizationId,
    refetchInterval: (data) => {
      // Poll while running
      if (data?.status === 'running') {
        return 5000; // Every 5 seconds
      }
      return false;
    }
  });
}

