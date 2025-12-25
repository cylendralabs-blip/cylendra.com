/**
 * Binance Market Data Feed
 * 
 * Fetches candles and ticker data from Binance Public API
 * Phase 4: Strategy Engine
 */

import { MarketDataFeed, Candle, Ticker, Timeframe, CandleNormalizeOptions } from './types.ts';

/**
 * Binance timeframe mapping
 */
const BINANCE_TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1d',
  '3d': '3d',
  '1w': '1w',
  '1M': '1M'
};

/**
 * Binance Market Data Feed
 */
export class BinanceMarketDataFeed implements MarketDataFeed {
  private baseUrl: string;
  private futuresUrl?: string;

  constructor(testnet: boolean = false, platform: string = 'binance') {
    // Detect platform type
    const isDemo = platform === 'binance-demo';
    const isOldTestnet = platform === 'binance-futures-testnet';
    
    if (isDemo) {
      // New Demo Trading (demo.binance.com)
      // Demo Trading uses the SAME endpoints as Live, but with demo API keys
      this.baseUrl = 'https://api.binance.com/api/v3';  // Demo Spot uses Live Spot endpoint
      this.futuresUrl = 'https://fapi.binance.com/fapi/v1';  // Demo Futures uses Live Futures endpoint
      this.wsBaseUrl = 'wss://stream.binance.com:9443/ws';  // Demo Spot WebSocket (same as Live)
      this.wsFuturesUrl = 'wss://fstream.binance.com';  // Demo Futures WebSocket (same as Live)
    } else if (isOldTestnet || testnet) {
      // Old Testnet (deprecated)
      this.baseUrl = 'https://testnet.binance.vision/api/v3';
      this.futuresUrl = 'https://testnet.binancefuture.com/fapi/v1';
      this.wsBaseUrl = 'wss://testnet.binance.vision/ws';
      this.wsFuturesUrl = 'wss://stream.binancefuture.com';
    } else {
      // Live (Mainnet)
      this.baseUrl = 'https://api.binance.com/api/v3';
      this.futuresUrl = 'https://fapi.binance.com/fapi/v1';
      this.wsBaseUrl = 'wss://stream.binance.com:9443/ws';
      this.wsFuturesUrl = 'wss://fstream.binance.com';
    }
  }

  /**
   * Normalize symbol format (BTC/USDT -> BTCUSDT)
   */
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }

  /**
   * Get candles from Binance
   */
  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]> {
    try {
      const binanceSymbol = this.normalizeSymbol(symbol);
      const binanceTimeframe = BINANCE_TIMEFRAME_MAP[timeframe];
      
      if (!binanceTimeframe) {
        throw new Error(`Unsupported timeframe: ${timeframe}`);
      }

      const params = new URLSearchParams({
        symbol: binanceSymbol,
        interval: binanceTimeframe,
        limit: Math.min(limit, 1000).toString() // Binance max is 1000
      });

      if (startTime) {
        params.append('startTime', startTime.toString());
      }

      if (endTime) {
        params.append('endTime', endTime.toString());
      }

      const url = `${this.baseUrl}/klines?${params.toString()}`;
      console.log(`Fetching candles from Binance: ${symbol} ${timeframe} (limit: ${limit})`);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance API error: ${response.status} - ${errorText}`);
      }

      const klines: any[] = await response.json();

      // Convert Binance kline format to unified Candle format
      const candles: Candle[] = klines.map(kline => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteVolume: parseFloat(kline[7] || 0),
        trades: kline[8] || 0,
        takerBuyBaseVolume: parseFloat(kline[9] || 0),
        takerBuyQuoteVolume: parseFloat(kline[10] || 0)
      }));

      // Sort by time (ascending - oldest first)
      candles.sort((a, b) => a.openTime - b.openTime);

      console.log(`✅ Fetched ${candles.length} candles for ${symbol} ${timeframe}`);
      return candles;

    } catch (error) {
      console.error(`Error fetching Binance candles for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get ticker price from Binance
   */
  async getTicker(symbol: string): Promise<Ticker | null> {
    try {
      const binanceSymbol = this.normalizeSymbol(symbol);
      const url = `${this.baseUrl}/ticker/24hr?symbol=${binanceSymbol}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 400) {
          console.warn(`Symbol ${symbol} not found on Binance`);
          return null;
        }
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol: symbol,
        price: parseFloat(data.lastPrice || data.price),
        change24h: parseFloat(data.priceChangePercent || 0),
        volume24h: parseFloat(data.volume || 0),
        high24h: parseFloat(data.highPrice || 0),
        low24h: parseFloat(data.lowPrice || 0),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error fetching Binance ticker for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple tickers
   */
  async getTickers(symbols: string[]): Promise<Record<string, Ticker>> {
    try {
      // Fetch all prices first
      const url = `${this.baseUrl}/ticker/price`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const allPrices: any[] = await response.json();
      const tickers: Record<string, Ticker> = {};

      // Filter for requested symbols
      for (const symbol of symbols) {
        const binanceSymbol = this.normalizeSymbol(symbol);
        const priceData = allPrices.find((p: any) => p.symbol === binanceSymbol);
        
        if (priceData) {
          // Fetch 24hr stats for this symbol
          const ticker = await this.getTicker(symbol);
          if (ticker) {
            tickers[symbol] = ticker;
          }
        }
      }

      return tickers;

    } catch (error) {
      console.error('Error fetching Binance tickers:', error);
      return {};
    }
  }

  /**
   * Normalize candles (validate, sort, etc.)
   */
  static normalizeCandles(
    candles: Candle[],
    options: CandleNormalizeOptions = {}
  ): Candle[] {
    const { sortOrder = 'asc', validate = true } = options;

    let normalized = [...candles];

    // Validate candles
    if (validate) {
      normalized = normalized.filter(candle => {
        return (
          candle.open > 0 &&
          candle.high > 0 &&
          candle.low > 0 &&
          candle.close > 0 &&
          candle.high >= candle.low &&
          candle.high >= candle.open &&
          candle.high >= candle.close &&
          candle.low <= candle.open &&
          candle.low <= candle.close
        );
      });
    }

    // Sort by time
    if (sortOrder === 'asc') {
      normalized.sort((a, b) => a.openTime - b.openTime);
    } else {
      normalized.sort((a, b) => b.openTime - a.openTime);
    }

    return normalized;
  }
}

