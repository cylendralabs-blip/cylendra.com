/**
 * Historical Market Data Router
 * 
 * Routes historical data requests to the correct exchange
 * 
 * Phase 9: Backtesting Engine - Task 1
 */

import { NormalizedCandle } from '../types';
import { getBinanceHistoricalCandles, toBinanceSymbol } from './binanceHistoryFeed';
import { getOKXHistoricalCandles, toOKXSymbol } from './okxHistoryFeed';

/**
 * Fetch historical candles from exchange
 * 
 * @param exchange - Exchange name ('binance' | 'okx')
 * @param symbol - Trading pair symbol
 * @param timeframe - Timeframe (e.g., '1h', '4h', '1d')
 * @param startTime - Start timestamp (milliseconds)
 * @param endTime - End timestamp (milliseconds)
 * @returns Array of normalized candles
 */
export async function getHistoricalCandles(
  exchange: 'binance' | 'okx',
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number
): Promise<NormalizedCandle[]> {
  // Validate time range
  if (startTime >= endTime) {
    throw new Error('Start time must be before end time');
  }
  
  // Maximum time range: 1 year (for safety)
  const maxRange = 365 * 24 * 60 * 60 * 1000;
  if (endTime - startTime > maxRange) {
    throw new Error(`Time range too large. Maximum: 1 year`);
  }
  
  // Route to correct exchange
  switch (exchange.toLowerCase()) {
    case 'binance':
      return getBinanceHistoricalCandles(
        toBinanceSymbol(symbol),
        timeframe,
        startTime,
        endTime
      );
      
    case 'okx':
      return getOKXHistoricalCandles(
        toOKXSymbol(symbol),
        timeframe,
        startTime,
        endTime
      );
      
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
}

/**
 * Get available timeframes for exchange
 */
export function getAvailableTimeframes(exchange: 'binance' | 'okx'): string[] {
  const timeframes = {
    binance: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
    okx: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w', '1M']
  };
  
  return timeframes[exchange.toLowerCase()] || [];
}

