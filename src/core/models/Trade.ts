/**
 * Trade Model
 * 
 * نموذج البيانات للصفقات (Trades)
 * 
 * Phase 1: تنظيم Models
 */

/**
 * Trade Status
 */
export type TradeStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'FAILED';

/**
 * Trade Type
 */
export type TradeType = 'spot' | 'futures';

/**
 * Trade Side
 */
export type TradeSide = 'buy' | 'sell';

/**
 * Trading Signal - البيانات الأساسية للصفقة
 */
export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  entry_price: number;
  current_price: number | null;
  quantity: number;
  total_invested: number;
  status: TradeStatus;
  trade_type: TradeType;
  leverage: number | null;
  dca_level: number | null;
  max_dca_level: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  realized_pnl: number | null;
  unrealized_pnl: number | null;
  platform: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  user_id: string;
  fees: number | null;
  commission: number | null;
  platform_trade_id: string | null;
  last_sync_at: string | null;
  sync_status: string | null;
  notes: string | null;
}

/**
 * DCA Order - أمر DCA
 */
export interface DCAOrder {
  id: string;
  trade_id: string;
  user_id: string;
  dca_level: number;
  target_price: number;
  quantity: number;
  amount: number;
  executed_price: number | null;
  executed_quantity: number | null;
  status: string | null;
  created_at: string;
  executed_at: string | null;
  trades?: {
    symbol: string;
    side: string;
    trade_type: string;
  };
}

/**
 * Platform Sync Status - حالة المزامنة مع المنصة
 */
export interface PlatformSyncStatus {
  id: string;
  user_id: string;
  platform: string;
  last_sync_at: string;
  sync_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert Database Row to Trade
 */
export function fromDatabaseRow(row: any): Trade {
  return {
    id: row.id,
    symbol: row.symbol,
    side: row.side,
    entry_price: Number(row.entry_price),
    current_price: row.current_price ? Number(row.current_price) : null,
    quantity: Number(row.quantity),
    total_invested: Number(row.total_invested),
    status: row.status,
    trade_type: row.trade_type,
    leverage: row.leverage ? Number(row.leverage) : null,
    dca_level: row.dca_level ? Number(row.dca_level) : null,
    max_dca_level: row.max_dca_level ? Number(row.max_dca_level) : null,
    stop_loss_price: row.stop_loss_price ? Number(row.stop_loss_price) : null,
    take_profit_price: row.take_profit_price ? Number(row.take_profit_price) : null,
    realized_pnl: row.realized_pnl ? Number(row.realized_pnl) : null,
    unrealized_pnl: row.unrealized_pnl ? Number(row.unrealized_pnl) : null,
    platform: row.platform,
    opened_at: row.opened_at,
    closed_at: row.closed_at,
    created_at: row.created_at,
    user_id: row.user_id,
    fees: row.fees ? Number(row.fees) : null,
    commission: row.commission ? Number(row.commission) : null,
    platform_trade_id: row.platform_trade_id,
    last_sync_at: row.last_sync_at,
    sync_status: row.sync_status,
    notes: row.notes
  };
}

/**
 * Convert Trade to Database Row
 */
export function toDatabaseRow(trade: Partial<Trade>): any {
  return {
    ...trade,
    entry_price: trade.entry_price?.toString(),
    current_price: trade.current_price?.toString(),
    quantity: trade.quantity?.toString(),
    total_invested: trade.total_invested?.toString(),
    leverage: trade.leverage?.toString(),
    stop_loss_price: trade.stop_loss_price?.toString(),
    take_profit_price: trade.take_profit_price?.toString(),
    realized_pnl: trade.realized_pnl?.toString(),
    unrealized_pnl: trade.unrealized_pnl?.toString()
  };
}

/**
 * Calculate Trade PnL
 */
export function calculatePnL(trade: Trade, currentPrice: number): number {
  if (!currentPrice || !trade.entry_price) return 0;

  const priceDiff = currentPrice - trade.entry_price;
  const quantity = trade.quantity;
  const leverage = trade.leverage || 1;

  if (trade.side === 'buy') {
    return priceDiff * quantity * leverage;
  } else {
    return -priceDiff * quantity * leverage;
  }
}

/**
 * Check if Trade is Active
 */
export function isActive(trade: Trade): boolean {
  return trade.status === 'ACTIVE' || trade.status === 'PENDING';
}

/**
 * Check if Trade is Closed
 */
export function isClosed(trade: Trade): boolean {
  return trade.status === 'CLOSED' || trade.status === 'CANCELLED';
}


