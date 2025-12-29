/**
 * Position Model
 * 
 * Position data model for managing open trading positions
 * Represents a collection of trades for the same symbol
 * 
 * Phase 6: Position Manager - Enhanced with OrderRef tracking
 */

import { Trade } from './Trade';
import { OrderRef } from './OrderRef';

// Re-export for convenience
export type { OrderRef } from './OrderRef';

/**
 * Position Status
 */
export type PositionStatus = 'open' | 'closing' | 'closed' | 'failed';

/**
 * Risk State - TP/SL configuration and tracking
 */
export interface RiskState {
  /** Stop loss price */
  stopLossPrice: number;
  
  /** Take profit price (primary) */
  takeProfitPrice: number | null;
  
  /** Trailing stop configuration */
  trailing?: {
    enabled: boolean;
    activationPrice: number;
    distance: number; // Distance from highest price (percentage or absolute)
    currentStopPrice: number;
  };
  
  /** Partial TP configuration */
  partialTp?: {
    levels: Array<{
      price: number;
      percentage: number; // Percentage of position to close
      executed: boolean;
      executedAt?: string;
    }>;
  };
  
  /** Break-even configuration */
  breakEven?: {
    enabled: boolean;
    triggerPrice: number;
    activated: boolean;
    activatedAt?: string;
  };
}

/**
 * Position Metadata
 */
export interface PositionMetadata {
  /** Strategy ID that opened this position */
  strategyId: string;
  
  /** Signal ID that triggered this position (if from signal) */
  signalId?: string;
  
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Position - Trading position consisting of multiple orders (e.g., DCA)
 * Enhanced for Phase 6: Position Manager
 */
export interface Position {
  /** Position ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Exchange (binance, okx) */
  exchange: 'binance' | 'okx';
  
  /** Market type (spot, futures) */
  marketType: 'spot' | 'futures';
  
  /** Symbol (e.g., BTC/USDT) */
  symbol: string;
  
  /** Position side (buy, sell) */
  side: 'buy' | 'sell';
  
  /** Position status */
  status: PositionStatus;
  
  /** Entry orders (initial orders) */
  entryOrders: OrderRef[];
  
  /** DCA orders (additional entry orders) */
  dcaOrders: OrderRef[];
  
  /** Take profit orders */
  tpOrders: OrderRef[];
  
  /** Stop loss orders */
  slOrders: OrderRef[];
  
  /** Average entry price (weighted average) */
  avgEntryPrice: number;
  
  /** Total position quantity */
  positionQty: number;
  
  /** Leverage (for futures) */
  leverage?: number;
  
  /** Realized PnL (USD) */
  realizedPnlUsd: number;
  
  /** Unrealized PnL (USD) */
  unrealizedPnlUsd: number;
  
  /** Risk state (TP/SL configuration) */
  riskState: RiskState;
  
  /** Position metadata */
  meta: PositionMetadata;
  
  /** Position opened timestamp */
  openedAt: string;
  
  /** Position closed timestamp */
  closedAt?: string;
  
  /** Created timestamp */
  createdAt: string;
  
  /** Updated timestamp */
  updatedAt: string;
  
  // Legacy fields for backward compatibility
  user_id?: string;
  trade_type?: 'spot' | 'futures';
  platform?: string;
  trades?: Trade[];
  average_entry_price?: number;
  total_quantity?: number;
  total_invested?: number;
  current_price?: number | null;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  dca_level?: number;
  max_dca_level?: number;
  unrealized_pnl?: number;
  realized_pnl?: number;
  opened_at?: string;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Active Trade - تمثيل مبسط لصفقة نشطة
 */
export interface ActiveTrade {
  symbol: string;
  positionSize?: number;
  unrealizedPnL?: number;
  entryPrice?: number;
  currentPrice?: number;
  side?: 'buy' | 'sell';
}

/**
 * Create Position from Trades (Legacy - for backward compatibility)
 */
export function createPositionFromTrades(
  user_id: string,
  trades: Trade[]
): Position | null {
  if (trades.length === 0) return null;

  const firstTrade = trades[0];
  
  // Calculate averages
  let totalQuantity = 0;
  let totalInvested = 0;
  
  for (const trade of trades) {
    totalQuantity += trade.quantity;
    totalInvested += trade.total_invested;
  }
  
  const averageEntryPrice = totalInvested / totalQuantity;
  
  // Calculate PnL
  const currentPrice = trades[0].current_price || trades[0].entry_price;
  const unrealizedPnL = trades.reduce((sum, trade) => {
    const pnl = trade.unrealized_pnl || 0;
    return sum + pnl;
  }, 0);
  
  const realizedPnL = trades.reduce((sum, trade) => {
    const pnl = trade.realized_pnl || 0;
    return sum + pnl;
  }, 0);
  
  // Calculate DCA levels
  const maxDcaLevel = Math.max(...trades.map(t => t.dca_level || 0));
  const currentDcaLevel = trades.find(t => t.dca_level !== null)?.dca_level || 0;
  
  // Convert to new Position format
  return {
    id: firstTrade.id,
    userId: user_id,
    exchange: (firstTrade.platform?.toLowerCase() as 'binance' | 'okx') || 'binance',
    marketType: firstTrade.trade_type || 'spot',
    symbol: firstTrade.symbol,
    side: firstTrade.side,
    status: trades.some(t => t.status === 'ACTIVE') ? 'open' : 'closed',
    entryOrders: [],
    dcaOrders: [],
    tpOrders: [],
    slOrders: [],
    avgEntryPrice: averageEntryPrice,
    positionQty: totalQuantity,
    leverage: firstTrade.leverage || undefined,
    realizedPnlUsd: realizedPnL,
    unrealizedPnlUsd: unrealizedPnL,
    riskState: {
      stopLossPrice: firstTrade.stop_loss_price || 0,
      takeProfitPrice: firstTrade.take_profit_price || null
    },
    meta: {
      strategyId: 'main'
    },
    openedAt: firstTrade.opened_at || new Date().toISOString(),
    closedAt: trades.every(t => t.status === 'CLOSED') 
      ? trades[trades.length - 1].closed_at 
      : undefined,
    createdAt: firstTrade.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Legacy fields
    user_id,
    trade_type: firstTrade.trade_type,
    platform: firstTrade.platform || '',
    trades,
    average_entry_price: averageEntryPrice,
    total_quantity: totalQuantity,
    total_invested: totalInvested,
    current_price: currentPrice,
    stop_loss_price: firstTrade.stop_loss_price,
    take_profit_price: firstTrade.take_profit_price,
    dca_level: currentDcaLevel,
    max_dca_level: maxDcaLevel,
    unrealized_pnl: unrealizedPnL,
    realized_pnl: realizedPnL,
    opened_at: firstTrade.opened_at || new Date().toISOString(),
    closed_at: trades.every(t => t.status === 'CLOSED') 
      ? trades[trades.length - 1].closed_at 
      : null,
    created_at: firstTrade.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Calculate Position PnL (Legacy - for backward compatibility)
 */
export function calculatePositionPnL(position: Position, currentPrice: number): number {
  const avgEntry = position.avgEntryPrice || position.average_entry_price || 0;
  const quantity = position.positionQty || position.total_quantity || 0;
  
  if (!currentPrice || !avgEntry || quantity <= 0) return 0;

  const priceDiff = currentPrice - avgEntry;
  
  if (position.side === 'buy') {
    return priceDiff * quantity;
  } else {
    return -priceDiff * quantity;
  }
}

/**
 * Check if Position is Active
 */
export function isPositionActive(position: Position): boolean {
  return position.status === 'open' || 
         position.status === 'closing' ||
         (position as any).status === 'ACTIVE' || 
         (position as any).status === 'PARTIALLY_CLOSED';
}


