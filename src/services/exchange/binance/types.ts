/**
 * Binance Exchange Types
 * 
 * Type definitions for Binance API integration
 */

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
 * Time In Force
 */
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTX';

/**
 * Binance API Credentials
 */
export interface BinanceCredentials {
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
  free: string;
  locked: string;
}

/**
 * Account Information
 */
export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Balance[];
  permissions: string[];
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
  timeInForce?: TimeInForce;
  newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
  recvWindow?: number;
}

/**
 * Order Response
 */
export interface OrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: OrderStatus;
  timeInForce: TimeInForce;
  type: OrderType;
  side: OrderSide;
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
  tradeId: number;
}

/**
 * Binance API Configuration
 */
export interface BinanceConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  testnet: boolean;
  marketType: MarketType;
}


