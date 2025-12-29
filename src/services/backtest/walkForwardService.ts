/**
 * Walk-Forward Analysis Service
 * 
 * Test strategy robustness using walk-forward analysis
 * 
 * Phase 4: Advanced Features - Task 4
 */

import { supabase } from '@/integrations/supabase/client';
import type { BacktestStartRequest } from './backtestService';

export interface WalkForwardConfig {
  baseConfig: BacktestStartRequest;
  trainingWindow: {
    months: number;
  };
  testingWindow: {
    months: number;
  };
  startDate: string;
  endDate: string;
}

export interface WalkForwardResult {
  cycles: Array<{
    cycle: number;
    trainingPeriod: { from: string; to: string };
    testingPeriod: { from: string; to: string };
    trainingMetrics: any;
    testingMetrics: any;
    runId: string;
  }>;
  summary: {
    averageReturn: number;
    consistency: number;
    robustness: number;
    stabilityScore: number;
  };
}

/**
 * Run walk-forward analysis
 */
export async function runWalkForwardAnalysis(
  config: WalkForwardConfig
): Promise<WalkForwardResult> {
  const cycles: WalkForwardResult['cycles'] = [];
  
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  
  let currentDate = new Date(startDate);
  let cycleNumber = 1;
  
  while (currentDate < endDate) {
    // Calculate training period
    const trainingStart = new Date(currentDate);
    const trainingEnd = new Date(currentDate);
    trainingEnd.setMonth(trainingEnd.getMonth() + config.trainingWindow.months);
    
    // Calculate testing period
    const testingStart = new Date(trainingEnd);
    const testingEnd = new Date(testingStart);
    testingEnd.setMonth(testingEnd.getMonth() + config.testingWindow.months);
    
    if (testingEnd > endDate) {
      break; // Stop if testing period exceeds end date
    }
    
    // Run training backtest
    const trainingConfig: BacktestStartRequest = {
      ...config.baseConfig,
      period: {
        from: trainingStart.toISOString(),
        to: trainingEnd.toISOString()
      }
    };
    
    const { data: trainingRun } = await supabase.functions.invoke('backtest-runner', {
      body: trainingConfig
    });
    
    // Wait for completion
    const trainingCompleted = await waitForCompletion(trainingRun.run_id);
    const trainingMetrics = trainingCompleted ? await getMetrics(trainingRun.run_id) : null;
    
    // Run testing backtest
    const testingConfig: BacktestStartRequest = {
      ...config.baseConfig,
      period: {
        from: testingStart.toISOString(),
        to: testingEnd.toISOString()
      }
    };
    
    const { data: testingRun } = await supabase.functions.invoke('backtest-runner', {
      body: testingConfig
    });
    
    const testingCompleted = await waitForCompletion(testingRun.run_id);
    const testingMetrics = testingCompleted ? await getMetrics(testingRun.run_id) : null;
    
    cycles.push({
      cycle: cycleNumber,
      trainingPeriod: {
        from: trainingStart.toISOString(),
        to: trainingEnd.toISOString()
      },
      testingPeriod: {
        from: testingStart.toISOString(),
        to: testingEnd.toISOString()
      },
      trainingMetrics,
      testingMetrics,
      runId: testingRun.run_id
    });
    
    // Move to next cycle
    currentDate = new Date(testingStart);
    cycleNumber++;
  }
  
  // Calculate summary metrics
  const testingReturns = cycles
    .map(c => c.testingMetrics?.totalReturnPct || 0)
    .filter(r => r !== 0);
  
  const averageReturn = testingReturns.length > 0
    ? testingReturns.reduce((a, b) => a + b, 0) / testingReturns.length
    : 0;
  
  // Calculate consistency (lower std dev = more consistent)
  const variance = testingReturns.length > 0
    ? testingReturns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / testingReturns.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const consistency = stdDev > 0 ? Math.max(0, 100 - (stdDev * 10)) : 100;
  
  // Robustness = how well testing matches training
  const robustnessScores = cycles
    .filter(c => c.trainingMetrics && c.testingMetrics)
    .map(c => {
      const trainReturn = c.trainingMetrics.totalReturnPct || 0;
      const testReturn = c.testingMetrics.totalReturnPct || 0;
      const diff = Math.abs(trainReturn - testReturn);
      return Math.max(0, 100 - (diff * 5)); // Penalize large differences
    });
  
  const robustness = robustnessScores.length > 0
    ? robustnessScores.reduce((a, b) => a + b, 0) / robustnessScores.length
    : 0;
  
  // Stability score = combination of consistency and robustness
  const stabilityScore = (consistency + robustness) / 2;
  
  return {
    cycles,
    summary: {
      averageReturn,
      consistency,
      robustness,
      stabilityScore
    }
  };
}

/**
 * Wait for backtest completion
 */
async function waitForCompletion(runId: string, maxWait = 300000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const { data } = await supabase
      .from('backtest_runs' as any)
      .select('status')
      .eq('id', runId)
      .single();
    
    const runData = data as any;
    if (runData?.status === 'completed') return true;
    if (runData?.status === 'failed') return false;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

/**
 * Get backtest metrics
 */
async function getMetrics(runId: string): Promise<any> {
  const { data } = await supabase
    .from('backtest_runs' as any)
    .select('summary')
    .eq('id', runId)
    .single();
  
  const runData = data as any;
  return runData?.summary || null;
}

