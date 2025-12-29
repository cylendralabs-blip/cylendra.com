/**
 * OKX Market Data Feed
 * 
 * Fetches candles and ticker data from OKX Public API
 * Phase 4: Strategy Engine
 */

import { MarketDataFeed, Candle, Ticker, Timeframe } from './types.ts';

/**
 * OKX timeframe mapping
 */
const OKX_TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '8h': '8H',
  '12h': '12H',
  '1d': '1D',
  '3d': '3D',
  '1w': '1W',
  '1M': '1M'
};

/**
 * OKX Market Data Feed
 */
export class OKXMarketDataFeed implements MarketDataFeed {
  private baseUrl: string;

  constructor(testnet: boolean = false) {
    // OKX uses same endpoint for testnet (demo trading)
    this.baseUrl = 'https://www.okx.com/api/v5';
  }

  /**
   * Normalize symbol format (BTC/USDT -> BTC-USDT)
   */
  normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '-').toUpperCase();
  }

  /**
   * Get candles from OKX
   */
  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]> {
    try {
      const okxSymbol = this.normalizeSymbol(symbol);
      const okxTimeframe = OKX_TIMEFRAME_MAP[timeframe];
      
      if (!okxTimeframe) {
        throw new Error(`Unsupported timeframe: ${timeframe}`);
      }

      const params = new URLSearchParams({
        instId: okxSymbol,
        bar: okxTimeframe,
        limit: Math.min(limit, 300).toString() // OKX max is 300
      });

      if (startTime) {
        params.append('after', startTime.toString());
      }

      if (endTime) {
        params.append('before', endTime.toString());
      }

      const url = `${this.baseUrl}/market/candles?${params.toString()}`;
      console.log(`Fetching candles from OKX: ${symbol} ${timeframe} (limit: ${limit})`);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OKX API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.code !== '0') {
        throw new Error(`OKX API error: ${result.msg || 'Unknown error'}`);
      }

      const klines = result.data || [];

      // Convert OKX kline format to unified Candle format
      // OKX format: [timestamp, open, high, low, close, volume, volCcy, volCcyQuote, confirm]
      const candles: Candle[] = klines.map((kline: any[]) => ({
        openTime: parseInt(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        quoteVolume: parseFloat(kline[6] || 0),
        closeTime: parseInt(kline[0]) + (this.getTimeframeMs(timeframe) || 60000) - 1,
        trades: parseInt(kline[8] || 0)
      }));

      // Sort by time (ascending - oldest first)
      candles.sort((a, b) => a.openTime - b.openTime);

      console.log(`✅ Fetched ${candles.length} candles for ${symbol} ${timeframe}`);
      return candles;

    } catch (error) {
      console.error(`Error fetching OKX candles for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get ticker price from OKX
   */
  async getTicker(symbol: string): Promise<Ticker | null> {
    try {
      const okxSymbol = this.normalizeSymbol(symbol);
      const url = `${this.baseUrl}/market/ticker?instId=${okxSymbol}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 400) {
          console.warn(`Symbol ${symbol} not found on OKX`);
          return null;
        }
        throw new Error(`OKX API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== '0' || !result.data || result.data.length === 0) {
        return null;
      }

      const data = result.data[0];

      return {
        symbol: symbol,
        price: parseFloat(data.last || data.lastPx || '0'),
        change24h: parseFloat(data.change24h || data.chg24h || '0'),
        volume24h: parseFloat(data.vol24h || data.volCcy24h || '0'),
        high24h: parseFloat(data.high24h || data.highPx24h || '0'),
        low24h: parseFloat(data.low24h || data.lowPx24h || '0'),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error fetching OKX ticker for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple tickers
   */
  async getTickers(symbols: string[]): Promise<Record<string, Ticker>> {
    try {
      const okxSymbols = symbols.map(s => this.normalizeSymbol(s));
      const url = `${this.baseUrl}/market/tickers?instId=${okxSymbols.join(',')}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OKX API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== '0') {
        throw new Error(`OKX API error: ${result.msg || 'Unknown error'}`);
      }

      const tickersData = result.data || [];
      const tickers: Record<string, Ticker> = {};

      for (const data of tickersData) {
        const symbol = data.instId.replace('-', '/');
        tickers[symbol] = {
          symbol,
          price: parseFloat(data.last || data.lastPx || '0'),
          change24h: parseFloat(data.change24h || data.chg24h || '0'),
          volume24h: parseFloat(data.vol24h || data.volCcy24h || '0'),
          high24h: parseFloat(data.high24h || data.highPx24h || '0'),
          low24h: parseFloat(data.low24h || data.lowPx24h || '0'),
          timestamp: Date.now()
        };
      }

      return tickers;

    } catch (error) {
      console.error('Error fetching OKX tickers:', error);
      return {};
    }
  }

  /**
   * Get timeframe duration in milliseconds
   */
  private getTimeframeMs(timeframe: Timeframe): number | null {
    const msMap: Record<string, number> = {
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    
    return msMap[timeframe] || null;
  }
}

