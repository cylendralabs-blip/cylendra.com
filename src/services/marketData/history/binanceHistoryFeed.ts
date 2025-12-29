/**
 * Binance Historical Market Data Feed
 * 
 * Fetches historical OHLCV candles from Binance
 * 
 * Phase 9: Backtesting Engine - Task 1
 */

import { Candle, NormalizedCandle } from '../types';

/**
 * Binance API limits
 */
const BINANCE_LIMITS = {
  /** Max candles per request */
  MAX_CANDLES_PER_REQUEST: 1000,
  /** Rate limit: 1200 requests per minute */
  RATE_LIMIT_PER_MINUTE: 1200,
  /** Min interval between requests (ms) */
  MIN_INTERVAL_MS: 50
};

/**
 * Binance timeframe mapping
 */
const TIMEFRAME_MAP: Record<string, string> = {
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
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch historical candles from Binance
 * 
 * @param symbol - Trading pair (e.g., 'BTCUSDT')
 * @param timeframe - Timeframe (e.g., '1h', '4h', '1d')
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @returns Array of normalized candles
 */
export async function getBinanceHistoricalCandles(
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number
): Promise<NormalizedCandle[]> {
  const binanceTimeframe = TIMEFRAME_MAP[timeframe];
  
  if (!binanceTimeframe) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  const allCandles: NormalizedCandle[] = [];
  let currentStartTime = startTime;
  
  // Binance API endpoint
  const baseUrl = 'https://api.binance.com/api/v3/klines';
  
  // Chunk requests to respect API limits
  while (currentStartTime < endTime) {
    try {
      // Calculate chunk end time (max 1000 candles)
      const chunkEndTime = Math.min(
        currentStartTime + (BINANCE_LIMITS.MAX_CANDLES_PER_REQUEST * getTimeframeMs(binanceTimeframe)),
        endTime
      );
      
      // Build URL
      const params = new URLSearchParams({
        symbol: symbol.toUpperCase(),
        interval: binanceTimeframe,
        startTime: currentStartTime.toString(),
        endTime: chunkEndTime.toString(),
        limit: BINANCE_LIMITS.MAX_CANDLES_PER_REQUEST.toString()
      });
      
      const url = `${baseUrl}?${params.toString()}`;
      
      // Fetch data
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit - wait and retry
          console.warn('Binance rate limit hit, waiting...');
          await sleep(60000); // Wait 1 minute
          continue;
        }
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }
      
      const data: any[] = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        break; // No more data
      }
      
      // Convert to normalized candles
      const candles = data.map((candle: any[]) => normalizeBinanceCandle(candle, symbol, timeframe));
      allCandles.push(...candles);
      
      // Update start time for next chunk
      const lastCandleTime = candles[candles.length - 1].timestamp;
      currentStartTime = lastCandleTime + 1;
      
      // Rate limiting
      if (currentStartTime < endTime) {
        await sleep(BINANCE_LIMITS.MIN_INTERVAL_MS);
      }
      
      // If we got less than max candles, we've reached the end
      if (candles.length < BINANCE_LIMITS.MAX_CANDLES_PER_REQUEST) {
        break;
      }
      
    } catch (error: any) {
      console.error('Error fetching Binance historical candles:', error);
      throw new Error(`Failed to fetch Binance historical data: ${error.message}`);
    }
  }
  
  // Sort by timestamp (should already be sorted, but just in case)
  return allCandles.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Normalize Binance candle to standard format
 */
function normalizeBinanceCandle(
  candle: any[],
  symbol: string,
  timeframe: string
): NormalizedCandle {
  // Binance candle format:
  // [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ...]
  return {
    timestamp: candle[0], // openTime
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
    symbol,
    timeframe,
    exchange: 'binance',
    closeTime: candle[6]
  };
}

/**
 * Get milliseconds for timeframe
 */
function getTimeframeMs(timeframe: string): number {
  const match = timeframe.match(/^(\d+)([mhdwM])$/);
  if (!match) return 60000; // Default to 1 minute
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    case 'M': return value * 30 * 24 * 60 * 60 * 1000; // Approximate
    default: return 60000;
  }
}

/**
 * Validate symbol format
 */
export function validateBinanceSymbol(symbol: string): boolean {
  // Binance symbols are uppercase (e.g., BTCUSDT)
  return /^[A-Z]{2,20}$/.test(symbol);
}

/**
 * Convert symbol to Binance format
 */
export function toBinanceSymbol(symbol: string): string {
  return symbol.toUpperCase().replace('/', '');
}

