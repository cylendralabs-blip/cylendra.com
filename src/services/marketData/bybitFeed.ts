/**
 * Bybit Market Data Feed
 * 
 * Provides real-time market data from Bybit exchange
 * Supports both Live and Testnet
 */

export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  bid1Price: string;
  ask1Price: string;
  volume24h: string;
  turnover24h: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
}

export interface BybitOrderBook {
  symbol: string;
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>;
  ts: number;
}

export interface BybitCandle {
  startTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
}

/**
 * Get Bybit base URL based on testnet flag
 */
function getBybitBaseUrl(testnet: boolean): string {
  return testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
}

/**
 * Get ticker for a symbol
 */
export async function getBybitTicker(
  symbol: string,
  options?: { testnet?: boolean }
): Promise<BybitTicker | null> {
  try {
    const isTestnet = options?.testnet ?? false;
    const baseUrl = getBybitBaseUrl(isTestnet);
    const formattedSymbol = symbol.replace(/[\/\-]/g, '').toUpperCase();

    const response = await fetch(
      `${baseUrl}/v5/market/tickers?category=spot&symbol=${formattedSymbol}`
    );

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    if (!data.result || !data.result.list || data.result.list.length === 0) {
      return null;
    }

    const ticker = data.result.list[0];

    return {
      symbol: ticker.symbol,
      lastPrice: ticker.lastPrice,
      bid1Price: ticker.bid1Price,
      ask1Price: ticker.ask1Price,
      volume24h: ticker.volume24h,
      turnover24h: ticker.turnover24h,
      prevPrice24h: ticker.prevPrice24h,
      price24hPcnt: ticker.price24hPcnt,
      highPrice24h: ticker.highPrice24h,
      lowPrice24h: ticker.lowPrice24h,
    };
  } catch (error) {
    console.error('[Bybit Feed] Error getting ticker:', error);
    throw error;
  }
}

/**
 * Get order book for a symbol
 */
export async function getBybitOrderBook(
  symbol: string,
  options?: { testnet?: boolean; limit?: number }
): Promise<BybitOrderBook | null> {
  try {
    const isTestnet = options?.testnet ?? false;
    const baseUrl = getBybitBaseUrl(isTestnet);
    const formattedSymbol = symbol.replace(/[\/\-]/g, '').toUpperCase();
    const limit = options?.limit ?? 25;

    const response = await fetch(
      `${baseUrl}/v5/market/orderbook?category=spot&symbol=${formattedSymbol}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    if (!data.result) {
      return null;
    }

    return {
      symbol: data.result.s,
      bids: data.result.b || [],
      asks: data.result.a || [],
      ts: data.result.ts || Date.now(),
    };
  } catch (error) {
    console.error('[Bybit Feed] Error getting order book:', error);
    throw error;
  }
}

/**
 * Get candles (K-line) for a symbol
 */
export async function getBybitCandles(params: {
  symbol: string;
  interval: string;
  limit?: number;
  testnet?: boolean;
  startTime?: number;
  endTime?: number;
}): Promise<BybitCandle[]> {
  try {
    const isTestnet = params.testnet ?? false;
    const baseUrl = getBybitBaseUrl(isTestnet);
    const formattedSymbol = params.symbol.replace(/[\/\-]/g, '').toUpperCase();
    const limit = params.limit ?? 200;

    // Map interval to Bybit format
    const intervalMap: Record<string, string> = {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '12h': '720',
      '1d': 'D',
      '1w': 'W',
      '1M': 'M',
    };

    const bybitInterval = intervalMap[params.interval] || params.interval;

    let url = `${baseUrl}/v5/market/kline?category=spot&symbol=${formattedSymbol}&interval=${bybitInterval}&limit=${limit}`;

    if (params.startTime) {
      url += `&start=${params.startTime}`;
    }

    if (params.endTime) {
      url += `&end=${params.endTime}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    if (!data.result || !data.result.list) {
      return [];
    }

    // Transform Bybit candle format to our format
    return data.result.list.map((candle: any[]) => ({
      startTime: parseInt(candle[0]),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      turnover: candle[6],
    }));
  } catch (error) {
    console.error('[Bybit Feed] Error getting candles:', error);
    throw error;
  }
}

/**
 * Get multiple tickers at once
 */
export async function getBybitTickers(
  symbols: string[],
  options?: { testnet?: boolean }
): Promise<Map<string, BybitTicker>> {
  try {
    const isTestnet = options?.testnet ?? false;
    const baseUrl = getBybitBaseUrl(isTestnet);
    const formattedSymbols = symbols
      .map((s) => s.replace(/[\/\-]/g, '').toUpperCase())
      .join(',');

    const response = await fetch(
      `${baseUrl}/v5/market/tickers?category=spot&symbol=${formattedSymbols}`
    );

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }

    const tickers = new Map<string, BybitTicker>();

    if (data.result && data.result.list) {
      for (const ticker of data.result.list) {
        tickers.set(ticker.symbol, {
          symbol: ticker.symbol,
          lastPrice: ticker.lastPrice,
          bid1Price: ticker.bid1Price,
          ask1Price: ticker.ask1Price,
          volume24h: ticker.volume24h,
          turnover24h: ticker.turnover24h,
          prevPrice24h: ticker.prevPrice24h,
          price24hPcnt: ticker.price24hPcnt,
          highPrice24h: ticker.highPrice24h,
          lowPrice24h: ticker.lowPrice24h,
        });
      }
    }

    return tickers;
  } catch (error) {
    console.error('[Bybit Feed] Error getting tickers:', error);
    throw error;
  }
}

