/**
 * Portfolio Snapshot Model
 * 
 * Represents a snapshot of user's portfolio at a specific time
 * 
 * Phase 7: Portfolio & Wallet Integration
 */

/**
 * Asset Allocation
 */
export interface AssetAllocation {
  [symbol: string]: {
    /** Balance in asset */
    balance: number;
    /** Value in USD */
    valueUsd: number;
    /** Percentage of total equity */
    percentage: number;
    /** Market type (spot/futures) */
    marketType: 'spot' | 'futures';
  };
}

/**
 * Exposure Breakdown
 */
export interface Exposure {
  /** Exposure per symbol */
  perSymbol: {
    [symbol: string]: {
      /** Total exposure in USD */
      totalExposureUsd: number;
      /** Spot exposure in USD */
      spotExposureUsd: number;
      /** Futures exposure in USD */
      futuresExposureUsd: number;
      /** Percentage of equity */
      exposurePct: number;
    };
  };
  /** Total exposure across all symbols */
  totalExposureUsd: number;
  /** Total exposure as percentage of equity */
  totalExposurePct: number;
}

/**
 * Portfolio Metrics
 */
export interface PortfolioMetrics {
  /** Daily PnL in USD */
  dailyPnl: number;
  /** Daily PnL as percentage */
  dailyPnlPct: number;
  /** Weekly PnL in USD */
  weeklyPnl: number;
  /** Weekly PnL as percentage */
  weeklyPnlPct: number;
  /** Monthly PnL in USD */
  monthlyPnl: number;
  /** Monthly PnL as percentage */
  monthlyPnlPct: number;
  /** Total realized PnL */
  realizedPnl: number;
  /** Total unrealized PnL */
  unrealizedPnl: number;
  /** Win rate percentage */
  winRate?: number;
  /** Profit factor */
  profitFactor?: number;
  /** Sharpe ratio */
  sharpeRatio?: number;
}

/**
 * Portfolio Snapshot
 */
export interface PortfolioSnapshot {
  /** Snapshot ID */
  id: string;
  /** User ID */
  userId: string;
  /** Snapshot timestamp */
  timestamp: string;
  /** Total equity in USD */
  totalEquity: number;
  /** Spot equity in USD */
  spotEquity: number;
  /** Futures equity in USD */
  futuresEquity: number;
  /** Unrealized PnL from open positions */
  unrealizedPnl: number;
  /** Realized PnL from closed positions */
  realizedPnl: number;
  /** Asset allocation */
  assetAllocation: AssetAllocation;
  /** Exposure breakdown */
  exposure: Exposure;
  /** Portfolio metrics */
  metrics: PortfolioMetrics;
  /** Additional metadata */
  metadata?: {
    [key: string]: any;
  };
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
}

/**
 * Portfolio State (Current State - No History)
 */
export interface PortfolioState {
  /** User ID */
  userId: string;
  /** Last sync timestamp */
  lastSyncAt: string;
  /** Total equity */
  totalEquity: number;
  /** Spot equity */
  spotEquity: number;
  /** Futures equity */
  futuresEquity: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Realized PnL */
  realizedPnl: number;
  /** Number of open positions */
  openPositionsCount: number;
  /** Total exposure */
  totalExposureUsd: number;
  /** Total exposure percentage */
  totalExposurePct: number;
  /** Daily PnL */
  dailyPnl: number;
  /** Daily PnL percentage */
  dailyPnlPct: number;
  /** Status (syncing/synced/error) */
  syncStatus: 'syncing' | 'synced' | 'error';
  /** Last error message */
  lastError?: string;
  /** Updated at */
  updatedAt: string;
}

