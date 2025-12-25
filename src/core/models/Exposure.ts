/**
 * Exposure Model
 * 
 * Represents user's exposure across symbols and market types
 * 
 * Phase 7: Portfolio & Wallet Integration
 */

/**
 * Symbol Exposure
 */
export interface SymbolExposure {
  /** Symbol */
  symbol: string;
  /** Total exposure in USD */
  totalUsd: number;
  /** Spot exposure in USD */
  spotUsd: number;
  /** Futures exposure in USD */
  futuresUsd: number;
  /** Long exposure in USD */
  longUsd: number;
  /** Short exposure in USD */
  shortUsd: number;
  /** Net exposure in USD */
  netUsd: number;
  /** Exposure as percentage of total equity */
  exposurePct: number;
  /** Number of open positions */
  positionsCount: number;
}

/**
 * Market Type Exposure
 */
export interface MarketExposure {
  /** Spot exposure in USD */
  spotUsd: number;
  /** Futures exposure in USD */
  futuresUsd: number;
  /** Total exposure in USD */
  totalUsd: number;
  /** Spot exposure percentage */
  spotPct: number;
  /** Futures exposure percentage */
  futuresPct: number;
  /** Total exposure percentage */
  totalPct: number;
}

/**
 * Total Exposure
 */
export interface Exposure {
  /** Total exposure in USD */
  totalUsd: number;
  /** Total exposure as percentage of equity */
  totalPct: number;
  /** Per-symbol exposure */
  perSymbol: {
    [symbol: string]: SymbolExposure;
  };
  /** Market type breakdown */
  byMarket: MarketExposure;
  /** Long exposure total */
  longTotalUsd: number;
  /** Short exposure total */
  shortTotalUsd: number;
  /** Net exposure */
  netUsd: number;
  /** Last calculated timestamp */
  lastCalculated: string;
}

