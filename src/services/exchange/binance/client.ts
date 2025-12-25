/**
 * Binance Exchange Client
 * 
 * Main client for Binance API operations
 * Handles authentication, requests, and error handling
 */

import { BinanceConfig, BinanceCredentials, MarketType } from './types';
import { getBinanceBaseUrl } from './utils';
import { BinanceError, parseBinanceError } from './errors';

/**
 * Binance Client Class
 */
export class BinanceClient {
  private config: BinanceConfig;

  constructor(credentials: BinanceCredentials, marketType: MarketType = 'spot') {
    this.config = {
      baseUrl: getBinanceBaseUrl(marketType, credentials.testnet || false),
      apiKey: credentials.apiKey,
      secretKey: credentials.secretKey,
      testnet: credentials.testnet || false,
      marketType
    };
  }

  /**
   * Get client configuration
   */
  getConfig(): BinanceConfig {
    return { ...this.config };
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get API key
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Check if testnet
   */
  isTestnet(): boolean {
    return this.config.testnet;
  }

  /**
   * Get market type
   */
  getMarketType(): MarketType {
    return this.config.marketType;
  }

  /**
   * Make authenticated request
   * Note: Signature creation must be done in Edge Functions
   * This is a client-side helper for request structure
   */
  async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    params?: Record<string, any>,
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    // For browser environment, requests must go through Edge Functions
    // This method is mainly for type checking and structure
    throw new Error(
      'Direct API calls from browser are not allowed. ' +
      'Use Edge Functions for authenticated requests.'
    );
  }

  /**
   * Build query string with timestamp
   */
  buildQueryString(params: Record<string, any> = {}): string {
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: Date.now().toString()
    });
    
    return queryParams.toString();
  }

  /**
   * Validate credentials format
   */
  static validateCredentials(credentials: BinanceCredentials): boolean {
    if (!credentials.apiKey || credentials.apiKey.length < 10) {
      return false;
    }
    
    if (!credentials.secretKey || credentials.secretKey.length < 10) {
      return false;
    }
    
    return true;
  }

  /**
   * Create new client for different market type
   */
  forMarketType(marketType: MarketType): BinanceClient {
    return new BinanceClient(
      {
        apiKey: this.config.apiKey,
        secretKey: this.config.secretKey,
        testnet: this.config.testnet
      },
      marketType
    );
  }
}


