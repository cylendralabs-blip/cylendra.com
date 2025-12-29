/**
 * Backtest Processor
 * 
 * Processes backtest execution in Edge Function
 * 
 * Phase 9: Backtesting Engine - Task 8
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

// Local types for Edge Function (cannot import from src/core)
export interface BacktestConfig {
  userId: string;
  strategyId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbols: string[];
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapitalUsd: number;
  fees: {
    makerPct: number;
    takerPct: number;
  };
  slippage: {
    enabled: boolean;
    maxPct: number;
  };
  metadata?: Record<string, any>;
}

export interface BacktestTrade {
  symbol: string;
  side: 'buy' | 'sell';
  entryTime: number;
  entryPrice: number;
  entryQty: number;
  entryFee: number;
  exitTime?: number;
  exitPrice?: number;
  exitQty?: number;
  exitFee?: number;
  dcaFills?: any[];
  tpFills?: any[];
  slFill?: any;
  pnlUsd: number;
  pnlPct: number;
  maxAdverseMovePct: number;
  maxFavorableMovePct: number;
  status: string;
  exitReason?: string;
  metadata?: Record<string, any>;
}

export interface EquityPoint {
  time: number;
  equity: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  openPositions?: number;
}

export interface PerformanceMetrics {
  totalReturnPct: number;
  cagr?: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdownPct: number;
  maxDrawdownDurationDays?: number;
  sharpeRatio?: number;
  expectancy: number;
  maxWinStreak: number;
  maxLossStreak: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgTradeDurationHours?: number;
  volatility?: number;
  calmarRatio?: number;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  metrics: PerformanceMetrics;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
  executionTimeMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Save backtest result to database
 */
export async function saveBacktestResult(
  supabaseClient: ReturnType<typeof createClient>,
  backtestId: string,
  result: BacktestResult
): Promise<void> {
  const logger = createLogger('backtest-worker', supabaseClient);
  
  try {
    // Update backtest status
    await supabaseClient
      .from('backtests')
      .update({
        status: result.status,
        completed_at: result.completedAt ? new Date(result.completedAt).toISOString() : null,
        error: result.error || null,
        execution_time_ms: result.executionTimeMs || null,
        metadata: result.metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', backtestId);
    
    if (result.status === 'failed') {
      logger.error('backtest', 'BACKTEST_FAILED', `Backtest ${backtestId} failed: ${result.error}`, {
        backtestId,
        error: result.error
      });
      return;
    }
    
    // Save trades
    if (result.trades && result.trades.length > 0) {
      const tradesData = result.trades.map(trade => ({
        backtest_id: backtestId,
        symbol: trade.symbol,
        side: trade.side,
        entry_time: trade.entryTime,
        entry_price: trade.entryPrice,
        entry_qty: trade.entryQty,
        entry_fee: trade.entryFee,
        exit_time: trade.exitTime || null,
        exit_price: trade.exitPrice || null,
        exit_qty: trade.exitQty || null,
        exit_fee: trade.exitFee || null,
        dca_fills: trade.dcaFills || [],
        tp_fills: trade.tpFills || [],
        sl_fill: trade.slFill || null,
        pnl_usd: trade.pnlUsd,
        pnl_pct: trade.pnlPct,
        max_adverse_move_pct: trade.maxAdverseMovePct,
        max_favorable_move_pct: trade.maxFavorableMovePct,
        status: trade.status,
        exit_reason: trade.exitReason || null,
        metadata: trade.metadata || {}
      }));
      
      const { error: tradesError } = await supabaseClient
        .from('backtest_trades')
        .insert(tradesData);
      
      if (tradesError) {
        throw new Error(`Failed to save trades: ${tradesError.message}`);
      }
    }
    
    // Save equity curve
    if (result.equityCurve && result.equityCurve.length > 0) {
      const equityData = result.equityCurve.map(point => ({
        backtest_id: backtestId,
        time: point.time,
        equity: point.equity,
        unrealized_pnl: point.unrealizedPnl || null,
        realized_pnl: point.realizedPnl || null,
        open_positions: point.openPositions || 0
      }));
      
      const { error: equityError } = await supabaseClient
        .from('backtest_equity_curve')
        .insert(equityData);
      
      if (equityError) {
        throw new Error(`Failed to save equity curve: ${equityError.message}`);
      }
    }
    
    // Save metrics
    if (result.metrics) {
      const { error: metricsError } = await supabaseClient
        .from('backtest_metrics')
        .upsert({
          backtest_id: backtestId,
          total_return_pct: result.metrics.totalReturnPct,
          cagr: result.metrics.cagr || null,
          win_rate: result.metrics.winRate,
          avg_win: result.metrics.avgWin,
          avg_loss: result.metrics.avgLoss,
          profit_factor: result.metrics.profitFactor,
          max_drawdown_pct: result.metrics.maxDrawdownPct,
          max_drawdown_duration_days: result.metrics.maxDrawdownDurationDays || null,
          sharpe_ratio: result.metrics.sharpeRatio || null,
          volatility: result.metrics.volatility || null,
          calmar_ratio: result.metrics.calmarRatio || null,
          expectancy: result.metrics.expectancy,
          max_win_streak: result.metrics.maxWinStreak,
          max_loss_streak: result.metrics.maxLossStreak,
          total_trades: result.metrics.totalTrades,
          winning_trades: result.metrics.winningTrades,
          losing_trades: result.metrics.losingTrades,
          avg_trade_duration_hours: result.metrics.avgTradeDurationHours || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'backtest_id'
        });
      
      if (metricsError) {
        throw new Error(`Failed to save metrics: ${metricsError.message}`);
      }
    }
    
    logger.info('backtest', 'BACKTEST_COMPLETED', `Backtest ${backtestId} completed successfully`, {
      backtestId,
      tradesCount: result.trades?.length || 0,
      totalReturn: result.metrics?.totalReturnPct || 0
    });
    
  } catch (error: any) {
    logger.error('backtest', 'BACKTEST_SAVE_ERROR', `Failed to save backtest result: ${error.message}`, {
      backtestId,
      error: error.message
    }, error);
    throw error;
  }
}

/**
 * Update backtest progress
 */
export async function updateBacktestProgress(
  supabaseClient: ReturnType<typeof createClient>,
  backtestId: string,
  progress: { current: number; total: number; message: string }
): Promise<void> {
  try {
    await supabaseClient
      .from('backtests')
      .update({
        metadata: {
          progress: {
            current: progress.current,
            total: progress.total,
            message: progress.message,
            percentage: (progress.current / progress.total) * 100
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', backtestId);
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

