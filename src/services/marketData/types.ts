/**
 * Market Data Types
 * 
 * Unified types for market data across exchanges
 * Phase 4: Strategy Engine
 */

/**
 * Timeframe
 */
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

/**
 * Candle (OHLCV)
 */
export interface Candle {
  openTime: number;    // Timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;   // Timestamp
  quoteVolume?: number;
  trades?: number;
  takerBuyBaseVolume?: number;
  takerBuyQuoteVolume?: number;
}

/**
 * Normalized Candle (with exchange metadata)
 */
export interface NormalizedCandle {
  timestamp: number;   // Open time timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  timeframe: string;
  exchange: 'binance' | 'okx';
  closeTime?: number;  // Close time timestamp
}

/**
 * Ticker Data
 */
export interface Ticker {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  timestamp: number;
}

/**
 * Market Data Feed Interface
 */
export interface MarketDataFeed {
  /**
   * Get candles for symbol and timeframe
   */
  getCandles(
    symbol: string,
    timeframe: Timeframe,
    limit?: number,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]>;

  /**
   * Get current ticker price
   */
  getTicker(symbol: string): Promise<Ticker | null>;

  /**
   * Get multiple tickers
   */
  getTickers(symbols: string[]): Promise<Record<string, Ticker>>;

  /**
   * Normalize symbol format
   */
  normalizeSymbol(symbol: string): string;
}

/**
 * Candle Normalization Options
 */
export interface CandleNormalizeOptions {
  sortOrder?: 'asc' | 'desc';  // Sort by time
  validate?: boolean;           // Validate candle data
}

