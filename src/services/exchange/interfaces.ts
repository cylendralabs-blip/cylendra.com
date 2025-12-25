/**
 * Exchange Interface
 * 
 * Common interface for all exchange implementations
 */

import {
  ExchangePlatform,
  MarketType,
  ExchangeCredentials,
  SymbolRules,
  Balance,
  OrderRequest,
  OrderResponse
} from './types';

/**
 * Exchange Interface
 * 
 * All exchange implementations must implement this interface
 */
export interface IExchange {
  /**
   * Get exchange platform name
   */
  getPlatform(): ExchangePlatform;

  /**
   * Get market type (spot/futures)
   */
  getMarketType(): MarketType;

  /**
   * Check if testnet
   */
  isTestnet(): boolean;

  /**
   * Test connectivity
   */
  testConnectivity(): Promise<boolean>;

  /**
   * Get account balances
   */
  getBalances(): Promise<Balance[]>;

  /**
   * Get symbol trading rules
   */
  getSymbolRules(symbol: string): Promise<SymbolRules>;

  /**
   * Place market order
   */
  placeMarketOrder(request: OrderRequest): Promise<OrderResponse>;

  /**
   * Place limit order
   */
  placeLimitOrder(request: OrderRequest): Promise<OrderResponse>;

  /**
   * Cancel order
   */
  cancelOrder(symbol: string, orderId?: string, clientOrderId?: string): Promise<OrderResponse>;

  /**
   * Cancel all open orders for symbol
   */
  cancelAllOrders(symbol: string): Promise<OrderResponse[]>;

  /**
   * Get order status
   */
  getOrder(symbol: string, orderId?: string, clientOrderId?: string): Promise<OrderResponse>;

  /**
   * Get open orders
   */
  getOpenOrders(symbol?: string): Promise<OrderResponse[]>;
}

/**
 * Futures Exchange Interface
 * 
 * Additional methods for futures trading
 */
export interface IFuturesExchange extends IExchange {
  /**
   * Set leverage for symbol
   */
  setLeverage(symbol: string, leverage: number): Promise<void>;

  /**
   * Set margin type
   */
  setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void>;

  /**
   * Get position information
   */
  getPosition(symbol: string): Promise<any>;
}


