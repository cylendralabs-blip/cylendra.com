/**
 * Common Exchange Types
 * 
 * Shared types for all exchange implementations
 */

/**
 * Exchange Platform
 */
export type ExchangePlatform = 'binance' | 'okx' | 'bybit' | 'kucoin';

/**
 * Market Type
 */
export type MarketType = 'spot' | 'futures';

/**
 * Order Side
 */
export type OrderSide = 'BUY' | 'SELL';

/**
 * Order Type
 */
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';

/**
 * Order Status
 */
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';

/**
 * Exchange Credentials
 */
export interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
}

/**
 * Symbol Trading Rules
 */
export interface SymbolRules {
  quantityPrecision: number;
  pricePrecision: number;
  tickSize: number;
  minQty: number;
  stepSize: number;
  minNotional?: number;
  maxNotional?: number;
}

/**
 * Balance
 */
export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

/**
 * Order Request
 */
export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
  recvWindow?: number;
}

/**
 * Order Response
 */
export interface OrderResponse {
  symbol: string;
  orderId: string;
  clientOrderId?: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: OrderStatus;
  type: OrderType;
  side: OrderSide;
  transactTime?: number;
  fills?: OrderFill[];
}

/**
 * Order Fill
 */
export interface OrderFill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  tradeId?: number;
}


