/**
 * Equity Model
 * 
 * Represents user's equity across different market types
 * 
 * Phase 7: Portfolio & Wallet Integration
 */

/**
 * Spot Balance
 */
export interface SpotBalance {
  /** Asset symbol */
  symbol: string;
  /** Free balance */
  free: number;
  /** Locked balance (in orders) */
  locked: number;
  /** Total balance */
  total: number;
  /** Value in USD */
  valueUsd: number;
  /** Exchange */
  exchange: 'binance' | 'okx';
}

/**
 * Futures Balance
 */
export interface FuturesBalance {
  /** Asset symbol */
  symbol: string;
  /** Available balance */
  available: number;
  /** Margin balance */
  margin: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Wallet balance */
  walletBalance: number;
  /** Value in USD */
  valueUsd: number;
  /** Leverage */
  leverage?: number;
  /** Exchange */
  exchange: 'binance' | 'okx';
}

/**
 * Open Position (from exchange)
 */
export interface ExchangePosition {
  /** Symbol */
  symbol: string;
  /** Position side (long/short) */
  side: 'long' | 'short';
  /** Position size */
  size: number;
  /** Entry price */
  entryPrice: number;
  /** Mark price */
  markPrice: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Liquidation price */
  liquidationPrice?: number;
  /** Leverage */
  leverage: number;
  /** Market type */
  marketType: 'spot' | 'futures';
  /** Exchange */
  exchange: 'binance' | 'okx';
}

/**
 * Equity Breakdown
 */
export interface Equity {
  /** Total equity (spot + futures + unrealized PnL) */
  total: number;
  /** Spot equity (spot balances converted to USD) */
  spot: number;
  /** Futures equity (futures balances + unrealized PnL) */
  futures: number;
  /** Unrealized PnL from open positions */
  unrealizedPnl: number;
  /** Realized PnL (from closed positions) */
  realizedPnl: number;
  /** Available balance for trading */
  available: number;
  /** Locked balance (in orders) */
  locked: number;
  /** Spot balances */
  spotBalances: SpotBalance[];
  /** Futures balances */
  futuresBalances: FuturesBalance[];
  /** Open positions */
  openPositions: ExchangePosition[];
  /** Last updated timestamp */
  lastUpdated: string;
}

