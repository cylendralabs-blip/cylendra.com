/**
 * Backtest Service
 * 
 * Service for interacting with Backtest Runner Edge Function
 * 
 * Phase 2: Backtest UI - Service Layer
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Backtest Request
 */
export interface BacktestStartRequest {
  /** Strategy preset ID or bot profile */
  strategyPreset?: string;
  botProfile?: {
    botSettings: any;
    strategyId?: string;
    exchange?: 'binance' | 'okx';
    marketType?: 'spot' | 'futures';
  };
  
  /** Trading pair */
  pair: string;
  
  /** Timeframe */
  timeframe: string;
  
  /** Period (3M / 6M / 1Y) or custom dates */
  period?: '3M' | '6M' | '1Y' | { from: string; to: string };
  
  /** Initial capital */
  initialCapital?: number;
  
  /** Simulation settings */
  simulationSettings?: {
    fees?: { makerPct: number; takerPct: number };
    slippage?: { enabled: boolean; maxPct: number };
  };
}

/**
 * Backtest Start Response
 */
export interface BacktestStartResponse {
  run_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: any;
  error?: string;
}

/**
 * Backtest Run Status
 */
export interface BacktestRunStatus {
  id: string;
  user_id: string;
  strategy_id: string;
  pair: string;
  timeframe: string;
  period_from: string;
  period_to: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary: any;
  error?: string;
  execution_time_ms?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Start a new backtest
 */
export async function startBacktest(
  request: BacktestStartRequest
): Promise<BacktestStartResponse> {
  const { data, error } = await supabase.functions.invoke('backtest-runner', {
    body: request
  });

  if (error) {
    throw new Error(error.message || 'Failed to start backtest');
  }

  return data as BacktestStartResponse;
}

/**
 * Get backtest run status
 */
export async function getBacktestRun(runId: string): Promise<BacktestRunStatus | null> {
  const { data, error } = await supabase
    .from('backtest_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(error.message || 'Failed to fetch backtest run');
  }

  return data as BacktestRunStatus;
}

/**
 * Get all user backtest runs
 */
export async function getUserBacktestRuns(): Promise<BacktestRunStatus[]> {
  const { data, error } = await supabase
    .from('backtest_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message || 'Failed to fetch backtest runs');
  }

  return (data || []) as BacktestRunStatus[];
}

/**
 * Get backtest trades
 */
export async function getBacktestTrades(runId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('backtest_trades')
    .select('*')
    .eq('backtest_run_id', runId)
    .order('entry_time', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch backtest trades');
  }

  return data || [];
}

