/**
 * OKX Historical Market Data Feed
 * 
 * Fetches historical OHLCV candles from OKX
 * 
 * Phase 9: Backtesting Engine - Task 1
 */

import { NormalizedCandle } from '../types';

/**
 * OKX API limits
 */
const OKX_LIMITS = {
  /** Max candles per request */
  MAX_CANDLES_PER_REQUEST: 300,
  /** Rate limit: 20 requests per 2 seconds */
  RATE_LIMIT_PER_2_SECONDS: 20,
  /** Min interval between requests (ms) */
  MIN_INTERVAL_MS: 100
};

/**
 * OKX timeframe mapping
 */
const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W',
  '1M': '1M'
};

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch historical candles from OKX
 * 
 * @param symbol - Trading pair (e.g., 'BTC-USDT')
 * @param timeframe - Timeframe (e.g., '1h', '4h', '1d')
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @returns Array of normalized candles
 */
export async function getOKXHistoricalCandles(
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number
): Promise<NormalizedCandle[]> {
  const okxTimeframe = TIMEFRAME_MAP[timeframe];
  
  if (!okxTimeframe) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  const allCandles: NormalizedCandle[] = [];
  let currentStartTime = startTime;
  
  // OKX API endpoint
  const baseUrl = 'https://www.okx.com/api/v5/market/history-candles';
  
  // Convert symbol to OKX format (BTCUSDT -> BTC-USDT)
  const okxSymbol = toOKXSymbol(symbol);
  
  // Chunk requests to respect API limits
  while (currentStartTime < endTime) {
    try {
      // OKX uses bar parameter (e.g., after=timestamp)
      const params = new URLSearchParams({
        instId: okxSymbol,
        bar: okxTimeframe,
        after: currentStartTime.toString(),
        limit: OKX_LIMITS.MAX_CANDLES_PER_REQUEST.toString()
      });
      
      const url = `${baseUrl}?${params.toString()}`;
      
      // Fetch data
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit - wait and retry
          console.warn('OKX rate limit hit, waiting...');
          await sleep(2000); // Wait 2 seconds
          continue;
        }
        throw new Error(`OKX API error: ${response.status} ${response.statusText}`);
      }
      
      const result: any = await response.json();
      
      if (result.code !== '0' || !result.data || !Array.isArray(result.data)) {
        throw new Error(`OKX API error: ${result.msg || 'Unknown error'}`);
      }
      
      const data = result.data;
      
      if (data.length === 0) {
        break; // No more data
      }
      
      // Convert to normalized candles
      // OKX candles are in reverse chronological order (newest first)
      const candles = data
        .map((candle: any[]) => normalizeOKXCandle(candle, symbol, timeframe))
        .filter(candle => candle.timestamp >= currentStartTime && candle.timestamp <= endTime)
        .reverse(); // Reverse to chronological order
      
      allCandles.push(...candles);
      
      // Update start time for next chunk (use oldest candle + 1)
      if (candles.length > 0) {
        const oldestCandle = candles[0];
        currentStartTime = oldestCandle.timestamp + getTimeframeMs(okxTimeframe);
      } else {
        break;
      }
      
      // Rate limiting
      if (currentStartTime < endTime) {
        await sleep(OKX_LIMITS.MIN_INTERVAL_MS);
      }
      
      // If we got less than max candles, we've reached the end
      if (candles.length < OKX_LIMITS.MAX_CANDLES_PER_REQUEST) {
        break;
      }
      
    } catch (error: any) {
      console.error('Error fetching OKX historical candles:', error);
      throw new Error(`Failed to fetch OKX historical data: ${error.message}`);
    }
  }
  
  // Sort by timestamp (should already be sorted, but just in case)
  return allCandles.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Normalize OKX candle to standard format
 */
function normalizeOKXCandle(
  candle: any[],
  symbol: string,
  timeframe: string
): NormalizedCandle {
  // OKX candle format:
  // [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm]
  return {
    timestamp: parseInt(candle[0]), // ts (milliseconds)
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]), // Base currency volume
    symbol,
    timeframe,
    exchange: 'okx',
    closeTime: parseInt(candle[0]) + getTimeframeMs(TIMEFRAME_MAP[timeframe]) - 1
  };
}

/**
 * Get milliseconds for timeframe
 */
function getTimeframeMs(timeframe: string): number {
  // OKX timeframes: 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M
  const match = timeframe.match(/^(\d+)([mhdwM])$/i);
  if (!match) return 60000; // Default to 1 minute
  
  const value = parseInt(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'M': return value * 60 * 1000;
    case 'H': return value * 60 * 60 * 1000;
    case 'D': return value * 24 * 60 * 60 * 1000;
    case 'W': return value * 7 * 24 * 60 * 60 * 1000;
    case 'MONTH': // 1M
      return value * 30 * 24 * 60 * 60 * 1000; // Approximate
    default: return 60000;
  }
}

/**
 * Convert symbol to OKX format
 */
export function toOKXSymbol(symbol: string): string {
  // OKX uses format: BTC-USDT, ETH-USDT, etc.
  const upper = symbol.toUpperCase().replace('/', '');
  
  // Common pairs
  if (upper.endsWith('USDT')) {
    const base = upper.slice(0, -4);
    return `${base}-USDT`;
  }
  if (upper.endsWith('USDC')) {
    const base = upper.slice(0, -4);
    return `${base}-USDC`;
  }
  if (upper.endsWith('BTC')) {
    const base = upper.slice(0, -3);
    return `${base}-BTC`;
  }
  
  // Default: assume last 4 chars are quote (USDT)
  if (upper.length > 4) {
    const base = upper.slice(0, -4);
    const quote = upper.slice(-4);
    return `${base}-${quote}`;
  }
  
  return upper;
}

/**
 * Validate symbol format
 */
export function validateOKXSymbol(symbol: string): boolean {
  // OKX symbols use format: BTC-USDT
  return /^[A-Z]+-[A-Z]+$/.test(symbol.toUpperCase());
}

