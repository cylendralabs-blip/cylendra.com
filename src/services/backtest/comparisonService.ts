/**
 * Backtest Comparison Service
 * 
 * Compare multiple backtest runs side-by-side
 * 
 * Phase 4: Advanced Features - Task 2
 */

import { supabase } from '@/integrations/supabase/client';
import type { BacktestRunStatus } from './backtestService';

export interface ComparisonRequest {
  runIds: string[];
}

export interface ComparisonResult {
  runs: Array<{
    runId: string;
    pair: string;
    timeframe: string;
    strategy: string;
    metrics: {
      totalReturn: number;
      maxDrawdown: number;
      winrate: number;
      profitFactor: number;
      numTrades: number;
      sharpeRatio?: number;
    };
  }>;
  comparison: {
    bestReturn: string;
    bestWinrate: string;
    lowestDrawdown: string;
    highestProfitFactor: string;
    mostTrades: string;
  };
  rankings: {
    byReturn: string[];
    byWinrate: string[];
    byProfitFactor: string[];
    bySharpeRatio: string[];
  };
}

/**
 * Compare multiple backtest runs
 */
export async function compareBacktests(
  runIds: string[]
): Promise<ComparisonResult> {
  if (runIds.length < 2 || runIds.length > 5) {
    throw new Error('Must compare between 2 and 5 backtests');
  }

  // Fetch all runs
  const { data: runs, error } = await supabase
    .from('backtest_runs' as any)
    .select('*')
    .in('id', runIds);

  if (error) {
    throw new Error(`Failed to fetch backtests: ${error.message}`);
  }

  if (!runs || runs.length !== runIds.length) {
    throw new Error('Some backtests not found');
  }

  // Process each run
  const processedRuns = runs.map((run: any) => {
    const summary = run.summary || {};
    return {
      runId: run.id,
      pair: run.pair,
      timeframe: run.timeframe,
      strategy: run.strategy_id,
      metrics: {
        totalReturn: summary.totalReturnPct || 0,
        maxDrawdown: summary.maxDrawdown || 0,
        winrate: summary.winrate || 0,
        profitFactor: summary.profitFactor || 0,
        numTrades: summary.numTrades || 0,
        sharpeRatio: summary.sharpeRatio
      }
    };
  });

  // Find best performers
  const bestReturn = processedRuns.reduce((best, current) =>
    current.metrics.totalReturn > best.metrics.totalReturn ? current : best
  ).runId;

  const bestWinrate = processedRuns.reduce((best, current) =>
    current.metrics.winrate > best.metrics.winrate ? current : best
  ).runId;

  const lowestDrawdown = processedRuns.reduce((best, current) =>
    current.metrics.maxDrawdown < best.metrics.maxDrawdown ? current : best
  ).runId;

  const highestProfitFactor = processedRuns.reduce((best, current) =>
    current.metrics.profitFactor > best.metrics.profitFactor ? current : best
  ).runId;

  const mostTrades = processedRuns.reduce((best, current) =>
    current.metrics.numTrades > best.metrics.numTrades ? current : best
  ).runId;

  // Create rankings
  const byReturn = [...processedRuns]
    .sort((a, b) => b.metrics.totalReturn - a.metrics.totalReturn)
    .map(r => r.runId);

  const byWinrate = [...processedRuns]
    .sort((a, b) => b.metrics.winrate - a.metrics.winrate)
    .map(r => r.runId);

  const byProfitFactor = [...processedRuns]
    .sort((a, b) => b.metrics.profitFactor - a.metrics.profitFactor)
    .map(r => r.runId);

  const bySharpeRatio = [...processedRuns]
    .filter(r => r.metrics.sharpeRatio !== undefined)
    .sort((a, b) => (b.metrics.sharpeRatio || 0) - (a.metrics.sharpeRatio || 0))
    .map(r => r.runId);

  return {
    runs: processedRuns,
    comparison: {
      bestReturn,
      bestWinrate,
      lowestDrawdown,
      highestProfitFactor,
      mostTrades
    },
    rankings: {
      byReturn,
      byWinrate,
      byProfitFactor,
      bySharpeRatio
    }
  };
}

