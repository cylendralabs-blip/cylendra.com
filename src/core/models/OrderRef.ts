/**
 * Order Reference Model
 * 
 * Represents a reference to an order on an exchange
 * Used for tracking entry, DCA, TP, and SL orders
 * 
 * Phase 6: Position Manager
 */

/**
 * Order Type
 */
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';

/**
 * Order Status
 */
export type OrderStatus = 
  | 'NEW' 
  | 'PENDING' 
  | 'PARTIALLY_FILLED' 
  | 'FILLED' 
  | 'CANCELED' 
  | 'REJECTED' 
  | 'EXPIRED';

/**
 * Order Side
 */
export type OrderSide = 'BUY' | 'SELL';

/**
 * Order Reference - Reference to an exchange order
 */
export interface OrderRef {
  /** Order ID in our database */
  id: string;
  
  /** Order ID on exchange */
  exchangeOrderId: string;
  
  /** Exchange name (binance, okx) */
  exchange: 'binance' | 'okx';
  
  /** Market type (spot, futures) */
  marketType: 'spot' | 'futures';
  
  /** Symbol (e.g., BTC/USDT) */
  symbol: string;
  
  /** Order side (BUY, SELL) */
  side: OrderSide;
  
  /** Order type (MARKET, LIMIT, etc.) */
  type: OrderType;
  
  /** Order status */
  status: OrderStatus;
  
  /** Order price (for LIMIT orders) */
  price: number | null;
  
  /** Order quantity */
  quantity: number;
  
  /** Filled quantity */
  filledQuantity: number;
  
  /** Remaining quantity */
  remainingQuantity: number;
  
  /** Average execution price */
  avgPrice: number | null;
  
  /** Commission/fee paid */
  commission: number;
  
  /** Commission asset */
  commissionAsset: string | null;
  
  /** Time in force (GTC, IOC, FOK) */
  timeInForce?: string;
  
  /** Created timestamp (ISO string) */
  createdAt: string;
  
  /** Updated timestamp (ISO string) */
  updatedAt: string;
  
  /** Filled timestamp (ISO string, if filled) */
  filledAt: string | null;
  
  /** Cancelled timestamp (ISO string, if cancelled) */
  cancelledAt: string | null;
  
  /** Order metadata */
  metadata?: {
    /** DCA level (if DCA order) */
    dcaLevel?: number;
    
    /** TP level (if TP order) */
    tpLevel?: number;
    
    /** SL order reference */
    slOrderId?: string;
    
    /** Parent position ID */
    positionId?: string;
    
    /** Parent trade ID */
    tradeId?: string;
    
    /** Additional metadata */
    [key: string]: any;
  };
}

/**
 * Create OrderRef from exchange order data
 */
export function createOrderRef(params: {
  id: string;
  exchangeOrderId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  quantity: number;
  metadata?: OrderRef['metadata'];
}): OrderRef {
  return {
    id: params.id,
    exchangeOrderId: params.exchangeOrderId,
    exchange: params.exchange,
    marketType: params.marketType,
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    status: 'NEW',
    price: params.price ?? null,
    quantity: params.quantity,
    filledQuantity: 0,
    remainingQuantity: params.quantity,
    avgPrice: null,
    commission: 0,
    commissionAsset: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    filledAt: null,
    cancelledAt: null,
    metadata: params.metadata
  };
}

/**
 * Update OrderRef with exchange order status
 */
export function updateOrderRef(
  orderRef: OrderRef,
  exchangeOrder: {
    status: OrderStatus;
    filledQuantity?: number;
    remainingQuantity?: number;
    avgPrice?: number;
    commission?: number;
    commissionAsset?: string;
  }
): OrderRef {
  return {
    ...orderRef,
    status: exchangeOrder.status,
    filledQuantity: exchangeOrder.filledQuantity ?? orderRef.filledQuantity,
    remainingQuantity: exchangeOrder.remainingQuantity ?? orderRef.remainingQuantity,
    avgPrice: exchangeOrder.avgPrice ?? orderRef.avgPrice,
    commission: exchangeOrder.commission ?? orderRef.commission,
    commissionAsset: exchangeOrder.commissionAsset ?? orderRef.commissionAsset,
    updatedAt: new Date().toISOString(),
    filledAt: exchangeOrder.status === 'FILLED' 
      ? (orderRef.filledAt ?? new Date().toISOString())
      : orderRef.filledAt,
    cancelledAt: exchangeOrder.status === 'CANCELED'
      ? (orderRef.cancelledAt ?? new Date().toISOString())
      : orderRef.cancelledAt
  };
}

/**
 * Check if order is filled
 */
export function isOrderFilled(orderRef: OrderRef): boolean {
  return orderRef.status === 'FILLED' || 
         (orderRef.filledQuantity > 0 && orderRef.filledQuantity >= orderRef.quantity);
}

/**
 * Check if order is active (pending or partially filled)
 */
export function isOrderActive(orderRef: OrderRef): boolean {
  return ['NEW', 'PENDING', 'PARTIALLY_FILLED'].includes(orderRef.status);
}

/**
 * Check if order is closed (filled, canceled, or rejected)
 */
export function isOrderClosed(orderRef: OrderRef): boolean {
  return ['FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'].includes(orderRef.status);
}

