/**
 * Backtest AI Analysis Hook
 * 
 * React hook for AI-powered backtest analysis
 * 
 * Phase 4: Advanced Features - Task 1
 */

import { useQuery } from '@tanstack/react-query';
import { generateAIAnalysis, generateAnalysisFromData, type AIAnalysisResult } from '@/services/backtest/aiAnalysis';
import { useBacktestRun } from './useBacktest';

/**
 * Hook to get AI analysis for a backtest
 */
export function useBacktestAIAnalysis(runId: string | null) {
  const { data: run } = useBacktestRun(runId || null, {
    enabled: !!runId,
    refetchInterval: 0
  });

  return useQuery({
    queryKey: ['backtest-ai-analysis', runId],
    queryFn: async (): Promise<AIAnalysisResult> => {
      if (!runId) {
        throw new Error('Run ID is required');
      }

      // Try AI analysis first
      try {
        return await generateAIAnalysis(runId);
      } catch (error) {
        console.warn('AI analysis failed, using data-based analysis:', error);
        
        // Fallback to data-based analysis
        if (run?.summary) {
          return generateAnalysisFromData(run.summary, run.summary);
        }
        
        throw error;
      }
    },
    enabled: !!runId && !!run && run.status === 'completed',
    staleTime: 300000, // 5 minutes
    refetchInterval: 0 // Don't poll
  });
}

