/**
 * Backtest Optimization Service
 * 
 * Run multiple backtests with different parameters to find optimal settings
 * 
 * Phase 4: Advanced Features - Task 3
 */

import { supabase } from '@/integrations/supabase/client';
import type { BacktestStartRequest } from './backtestService';

export interface OptimizationRequest {
  baseConfig: BacktestStartRequest;
  parameters: {
    tp_values?: number[];
    sl_values?: number[];
    dca_levels?: number[];
    risk_values?: number[];
  };
  optimizationGoal?: 'max_return' | 'max_winrate' | 'min_drawdown' | 'max_sharpe';
}

export interface OptimizationResult {
  optimizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalCombinations: number;
  completed: number;
  results: Array<{
    config: any;
    runId: string;
    metrics: {
      totalReturn: number;
      maxDrawdown: number;
      winrate: number;
      profitFactor: number;
      sharpeRatio?: number;
    };
    score: number;
  }>;
  bestConfigurations: Array<{
    rank: number;
    config: any;
    metrics: any;
    score: number;
  }>;
}

/**
 * Start optimization process
 */
export async function startOptimization(
  request: OptimizationRequest
): Promise<{ optimizationId: string; totalCombinations: number }> {
  // Calculate all combinations
  const combinations = generateCombinations(request.parameters);
  
  // Create optimization record
  const { data: optimization, error } = await supabase
    .from('backtest_optimizations' as any)
    .insert({
      base_config: request.baseConfig,
      parameters: request.parameters,
      optimization_goal: request.optimizationGoal || 'max_return',
      total_combinations: combinations.length,
      status: 'pending',
      results: []
    })
    .select('id')
    .single();

  if (error || !optimization) {
    throw new Error(`Failed to create optimization: ${error?.message || 'Unknown error'}`);
  }

  const optData = optimization as any;

  // Queue optimization runs (async)
  queueOptimizationRuns(optData.id, request.baseConfig, combinations).catch(err => {
    console.error('Optimization queue error:', err);
  });

  return {
    optimizationId: optData.id,
    totalCombinations: combinations.length
  };
}

/**
 * Generate all parameter combinations
 */
function generateCombinations(parameters: OptimizationRequest['parameters']): any[] {
  const combinations: any[] = [];
  
  const tpValues = parameters.tp_values || [2, 3, 5];
  const slValues = parameters.sl_values || [3, 5, 7];
  const dcaLevels = parameters.dca_levels || [3, 5];
  const riskValues = parameters.risk_values || [1, 2];
  
  for (const tp of tpValues) {
    for (const sl of slValues) {
      for (const dca of dcaLevels) {
        for (const risk of riskValues) {
          combinations.push({
            take_profit_percentage: tp,
            stop_loss_percentage: sl,
            dca_levels: dca,
            risk_percentage: risk
          });
        }
      }
    }
  }
  
  return combinations;
}

/**
 * Queue optimization runs
 */
async function queueOptimizationRuns(
  optimizationId: string,
  baseConfig: BacktestStartRequest,
  combinations: any[]
): Promise<void> {
  // Update status to running
  await supabase
    .from('backtest_optimizations' as any)
    .update({ status: 'running' })
    .eq('id', optimizationId);

  const results: any[] = [];
  
  // Run each combination
  for (let i = 0; i < combinations.length; i++) {
    const combination = combinations[i];
    
    try {
      // Create modified config
      const modifiedConfig: BacktestStartRequest = {
        ...baseConfig,
        botProfile: {
          ...baseConfig.botProfile,
          botSettings: {
            ...baseConfig.botProfile?.botSettings,
            take_profit_percentage: combination.take_profit_percentage,
            stop_loss_percentage: combination.stop_loss_percentage,
            dca_levels: combination.dca_levels,
            risk_percentage: combination.risk_percentage
          }
        }
      };

      // Start backtest
      const { data, error } = await supabase.functions.invoke('backtest-runner', {
        body: modifiedConfig
      });

      if (error) {
        console.error(`Optimization run ${i + 1} failed:`, error);
        continue;
      }

      // Wait for completion (poll)
      const runId = data.run_id;
      const completed = await waitForBacktestCompletion(runId);
      
      if (completed) {
      // Fetch results
      const { data: run } = await supabase
        .from('backtest_runs' as any)
        .select('summary')
        .eq('id', runId)
        .single();

        if (run && (run as any).summary) {
          const summary = (run as any).summary;
          results.push({
            config: combination,
            runId,
            metrics: summary,
            score: calculateScore(summary, 'max_return')
          });
        }
      }

      // Update progress
      await supabase
        .from('backtest_optimizations' as any)
        .update({
          completed: i + 1,
          results
        })
        .eq('id', optimizationId);

    } catch (error) {
      console.error(`Error in optimization run ${i + 1}:`, error);
    }
  }

  // Mark as completed
  await supabase
    .from('backtest_optimizations' as any)
    .update({
      status: 'completed',
      results
    })
    .eq('id', optimizationId);
}

/**
 * Wait for backtest to complete
 */
async function waitForBacktestCompletion(runId: string, maxWait = 300000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const { data } = await supabase
      .from('backtest_runs' as any)
      .select('status')
      .eq('id', runId)
      .single();

    const runData = data as any;
    if (runData?.status === 'completed') {
      return true;
    }
    
    if (runData?.status === 'failed') {
      return false;
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return false;
}

/**
 * Calculate optimization score
 */
function calculateScore(metrics: any, goal: string): number {
  switch (goal) {
    case 'max_return':
      return metrics.totalReturnPct || 0;
    case 'max_winrate':
      return metrics.winrate || 0;
    case 'min_drawdown':
      return -(metrics.maxDrawdown || 0);
    case 'max_sharpe':
      return metrics.sharpeRatio || 0;
    default:
      return metrics.totalReturnPct || 0;
  }
}

/**
 * Get optimization results
 */
export async function getOptimizationResults(
  optimizationId: string
): Promise<OptimizationResult | null> {
  const { data, error } = await supabase
    .from('backtest_optimizations' as any)
    .select('*')
    .eq('id', optimizationId)
    .single();

  if (error || !data) {
    return null;
  }

  const optData = data as any;
  const results = optData.results || [];
  const sortedResults = [...results].sort((a: any, b: any) => b.score - a.score);
  
  return {
    optimizationId: optData.id,
    status: optData.status,
    totalCombinations: optData.total_combinations,
    completed: optData.completed || 0,
    results: sortedResults,
    bestConfigurations: sortedResults.slice(0, 10).map((r: any, i: number) => ({
      rank: i + 1,
      config: r.config,
      metrics: r.metrics,
      score: r.score
    }))
  };
}

