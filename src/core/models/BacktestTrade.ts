/**
 * Backtest Trade Model
 * 
 * Represents a single trade in a backtest
 * 
 * Phase 9: Backtesting Engine - Task 6
 */

/**
 * Fill information
 */
export interface Fill {
  /** Fill timestamp (milliseconds) */
  time: number;
  /** Fill price */
  price: number;
  /** Fill quantity */
  qty: number;
  /** Fee paid */
  fee: number;
}

/**
 * Backtest Trade
 */
export interface BacktestTrade {
  /** Trade ID */
  id: string;
  
  /** Trading symbol */
  symbol: string;
  
  /** Trade side */
  side: 'buy' | 'sell';
  
  /** Entry timestamp (milliseconds) */
  entryTime: number;
  
  /** Entry price */
  entryPrice: number;
  
  /** Entry quantity */
  entryQty: number;
  
  /** Entry fee */
  entryFee: number;
  
  /** Exit timestamp (milliseconds, if closed) */
  exitTime?: number;
  
  /** Exit price (if closed) */
  exitPrice?: number;
  
  /** Exit quantity (if closed) */
  exitQty?: number;
  
  /** Exit fee (if closed) */
  exitFee?: number;
  
  /** DCA fills */
  dcaFills: Fill[];
  
  /** Take profit fills */
  tpFills: Fill[];
  
  /** Stop loss fill (if triggered) */
  slFill?: Fill;
  
  /** Total PnL in USD */
  pnlUsd: number;
  
  /** Total PnL percentage */
  pnlPct: number;
  
  /** Maximum adverse excursion (worst unrealized loss) */
  maxAdverseMovePct: number;
  
  /** Maximum favorable excursion (best unrealized profit) */
  maxFavorableMovePct: number;
  
  /** Status */
  status: 'open' | 'closed' | 'partial';
  
  /** Reason for exit */
  exitReason?: 'tp' | 'sl' | 'manual' | 'timeout' | 'risk';
  
  /** Metadata */
  metadata?: {
    strategy?: string;
    signalId?: string;
    [key: string]: any;
  };
}

/**
 * Calculate trade PnL
 * 
 * @param trade - Backtest trade
 * @returns PnL in USD and percentage
 */
export function calculateTradePnL(trade: BacktestTrade): { pnlUsd: number; pnlPct: number } {
  if (!trade.exitPrice || !trade.exitQty) {
    // Open position - return unrealized PnL
    const currentValue = trade.entryPrice * trade.entryQty;
    const entryValue = trade.entryPrice * trade.entryQty;
    const unrealizedPnL = trade.side === 'buy' 
      ? currentValue - entryValue
      : entryValue - currentValue;
    return {
      pnlUsd: unrealizedPnL - (trade.entryFee || 0),
      pnlPct: (unrealizedPnL / entryValue) * 100
    };
  }
  
  // Closed position - calculate realized PnL
  const entryValue = trade.entryPrice * trade.entryQty;
  const exitValue = trade.exitPrice * trade.exitQty;
  
  // Calculate base PnL
  const basePnL = trade.side === 'buy'
    ? exitValue - entryValue
    : entryValue - exitValue;
  
  // Subtract fees
  const totalFee = (trade.entryFee || 0) + (trade.exitFee || 0);
  const pnlUsd = basePnL - totalFee;
  const pnlPct = (pnlUsd / entryValue) * 100;
  
  return { pnlUsd, pnlPct };
}

/**
 * Update trade with new fill
 */
export function addFill(
  trade: BacktestTrade,
  fill: Fill,
  type: 'dca' | 'tp' | 'sl'
): BacktestTrade {
  const updated = { ...trade };
  
  switch (type) {
    case 'dca': {
      updated.dcaFills = [...updated.dcaFills, fill];
      // Update average entry price
      const totalQty = updated.entryQty + fill.qty;
      const totalValue = (updated.entryPrice * updated.entryQty) + (fill.price * fill.qty);
      updated.entryPrice = totalValue / totalQty;
      updated.entryQty = totalQty;
      updated.entryFee = (updated.entryFee || 0) + fill.fee;
      break;
    }
      
    case 'tp': {
      updated.tpFills = [...updated.tpFills, fill];
      // If TP fills complete the position, close trade
      const tpQty = updated.tpFills.reduce((sum, f) => sum + f.qty, 0);
      if (tpQty >= updated.entryQty) {
        updated.status = 'closed';
        updated.exitTime = fill.time;
        updated.exitPrice = fill.price;
        updated.exitQty = tpQty;
        updated.exitFee = updated.tpFills.reduce((sum, f) => sum + f.fee, 0);
        updated.exitReason = 'tp';
      }
      break;
    }
      
    case 'sl': {
      updated.slFill = fill;
      updated.status = 'closed';
      updated.exitTime = fill.time;
      updated.exitPrice = fill.price;
      updated.exitQty = updated.entryQty;
      updated.exitFee = fill.fee;
      updated.exitReason = 'sl';
      break;
    }
  }
  
  // Recalculate PnL
  const { pnlUsd, pnlPct } = calculateTradePnL(updated);
  updated.pnlUsd = pnlUsd;
  updated.pnlPct = pnlPct;
  
  return updated;
}

