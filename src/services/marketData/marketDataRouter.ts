/**
 * Market Data Router
 * 
 * Routes market data requests to appropriate exchange feed
 * Phase 4: Strategy Engine
 */

import { MarketDataFeed, Candle, Ticker, Timeframe } from './types.ts';
import { BinanceMarketDataFeed } from './binanceFeed.ts';
import { OKXMarketDataFeed } from './okxFeed.ts';

/**
 * Exchange type
 */
export type ExchangeType = 'binance' | 'okx';

/**
 * Market Data Router
 * 
 * Provides unified interface to fetch market data from different exchanges
 */
export class MarketDataRouter {
  private feeds: Map<ExchangeType, MarketDataFeed>;

  constructor(testnet: boolean = false) {
    this.feeds = new Map();
    this.feeds.set('binance', new BinanceMarketDataFeed(testnet));
    this.feeds.set('okx', new OKXMarketDataFeed(testnet));
  }

  /**
   * Get feed for exchange
   */
  getFeed(exchange: ExchangeType): MarketDataFeed {
    const feed = this.feeds.get(exchange);
    if (!feed) {
      throw new Error(`Unsupported exchange: ${exchange}`);
    }
    return feed;
  }

  /**
   * Get candles from exchange
   */
  async getCandles(
    exchange: ExchangeType,
    symbol: string,
    timeframe: Timeframe,
    limit?: number,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]> {
    const feed = this.getFeed(exchange);
    return feed.getCandles(symbol, timeframe, limit, startTime, endTime);
  }

  /**
   * Get ticker from exchange
   */
  async getTicker(
    exchange: ExchangeType,
    symbol: string
  ): Promise<Ticker | null> {
    const feed = this.getFeed(exchange);
    return feed.getTicker(symbol);
  }

  /**
   * Get multiple tickers from exchange
   */
  async getTickers(
    exchange: ExchangeType,
    symbols: string[]
  ): Promise<Record<string, Ticker>> {
    const feed = this.getFeed(exchange);
    return feed.getTickers(symbols);
  }

  /**
   * Get candles from multiple exchanges (aggregate)
   */
  async getCandlesMultiple(
    exchanges: ExchangeType[],
    symbol: string,
    timeframe: Timeframe,
    limit?: number
  ): Promise<Record<ExchangeType, Candle[]>> {
    const results: Record<ExchangeType, Candle[]> = {} as any;

    await Promise.all(
      exchanges.map(async (exchange) => {
        try {
          const candles = await this.getCandles(exchange, symbol, timeframe, limit);
          results[exchange] = candles;
        } catch (error) {
          console.error(`Error fetching candles from ${exchange}:`, error);
          results[exchange] = [];
        }
      })
    );

    return results;
  }
}

/**
 * Default market data router instance
 */
let defaultRouter: MarketDataRouter | null = null;

/**
 * Get default market data router
 */
export function getMarketDataRouter(testnet: boolean = false): MarketDataRouter {
  if (!defaultRouter || testnet !== (defaultRouter as any).testnet) {
    defaultRouter = new MarketDataRouter(testnet);
    (defaultRouter as any).testnet = testnet;
  }
  return defaultRouter;
}

