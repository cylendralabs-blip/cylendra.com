/**
 * Backtest Result Model
 * 
 * Complete backtest results including trades, equity curve, and metrics
 * 
 * Phase 9: Backtesting Engine - Task 6
 */

import { BacktestConfig } from './BacktestConfig';
import { BacktestTrade } from './BacktestTrade';
import { EquityPoint } from './EquityPoint';

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /** Total return percentage */
  totalReturnPct: number;
  /** Annualized return percentage (CAGR) */
  cagr?: number;
  /** Win rate percentage */
  winRate: number;
  /** Average win in USD */
  avgWin: number;
  /** Average loss in USD */
  avgLoss: number;
  /** Profit factor */
  profitFactor: number;
  /** Maximum drawdown percentage */
  maxDrawdownPct: number;
  /** Maximum drawdown duration (days) */
  maxDrawdownDurationDays?: number;
  /** Sharpe ratio */
  sharpeRatio?: number;
  /** Expectancy */
  expectancy: number;
  /** Maximum win streak */
  maxWinStreak: number;
  /** Maximum loss streak */
  maxLossStreak: number;
  /** Total trades */
  totalTrades: number;
  /** Winning trades */
  winningTrades: number;
  /** Losing trades */
  losingTrades: number;
  /** Average trade duration (hours) */
  avgTradeDurationHours?: number;
  /** Volatility of equity curve */
  volatility?: number;
  /** Calmar ratio (return / max drawdown) */
  calmarRatio?: number;
}

/**
 * Backtest Result
 */
export interface BacktestResult {
  /** Backtest ID */
  id: string;
  
  /** Backtest configuration */
  config: BacktestConfig;
  
  /** All trades */
  trades: BacktestTrade[];
  
  /** Equity curve */
  equityCurve: EquityPoint[];
  
  /** Performance metrics */
  metrics: PerformanceMetrics;
  
  /** Status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  /** Started at timestamp */
  startedAt?: number;
  
  /** Completed at timestamp */
  completedAt?: number;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  
  /** Metadata */
  metadata?: {
    candlesProcessed?: number;
    indicatorsCalculated?: number;
    signalsGenerated?: number;
    [key: string]: any;
  };
}

/**
 * Create empty backtest result
 */
export function createEmptyBacktestResult(
  id: string,
  config: BacktestConfig
): BacktestResult {
  return {
    id,
    config,
    trades: [],
    equityCurve: [{
      time: new Date(config.startDate).getTime(),
      equity: config.initialCapitalUsd
    }],
    metrics: {
      totalReturnPct: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxDrawdownPct: 0,
      expectancy: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    },
    status: 'pending'
  };
}

