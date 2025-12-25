/**
 * Bybit Historical Market Data Feed
 * 
 * Fetches historical OHLCV candles from Bybit
 */

export interface NormalizedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Bybit API limits
 */
const BYBIT_LIMITS = {
  /** Max candles per request */
  MAX_CANDLES_PER_REQUEST: 200,
  /** Rate limit: 10 requests per second */
  RATE_LIMIT_PER_SECOND: 10,
  /** Min interval between requests (ms) */
  MIN_INTERVAL_MS: 100
};

/**
 * Bybit timeframe mapping
 */
const TIMEFRAME_MAP: Record<string, string> = {
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
  '1M': 'M'
};

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Bybit base URL based on testnet flag
 */
function getBybitBaseUrl(testnet: boolean): string {
  return testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
}

/**
 * Convert symbol to Bybit format (BTC/USDT -> BTCUSDT)
 */
function toBybitSymbol(symbol: string): string {
  return symbol.replace(/[\/\-]/g, '').toUpperCase();
}

/**
 * Fetch historical candles from Bybit
 * 
 * @param symbol - Trading pair (e.g., 'BTC/USDT')
 * @param timeframe - Timeframe (e.g., '1h', '4h', '1d')
 * @param startTime - Start timestamp (ms)
 * @param endTime - End timestamp (ms)
 * @param testnet - Use testnet API
 * @returns Array of normalized candles
 */
export async function getBybitHistoricalCandles(
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number,
  testnet: boolean = false
): Promise<NormalizedCandle[]> {
  const bybitTimeframe = TIMEFRAME_MAP[timeframe];
  
  if (!bybitTimeframe) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  const allCandles: NormalizedCandle[] = [];
  let currentStartTime = startTime;
  
  const baseUrl = getBybitBaseUrl(testnet);
  const bybitSymbol = toBybitSymbol(symbol);
  
  // Chunk requests to respect API limits
  while (currentStartTime < endTime) {
    const limit = BYBIT_LIMITS.MAX_CANDLES_PER_REQUEST;
    
    // Calculate end time for this chunk
    const chunkEndTime = Math.min(
      currentStartTime + (limit * getTimeframeMs(timeframe)),
      endTime
    );
    
    const url = `${baseUrl}/v5/market/kline?category=spot&symbol=${bybitSymbol}&interval=${bybitTimeframe}&start=${currentStartTime}&end=${chunkEndTime}&limit=${limit}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.retCode !== 0) {
        throw new Error(`Bybit API error: ${data.retMsg}`);
      }
      
      if (!data.result || !data.result.list) {
        break;
      }
      
      // Transform Bybit candle format to normalized format
      // Bybit format: [timestamp, open, high, low, close, volume, turnover]
      const candles = data.result.list.map((candle: string[]) => ({
        timestamp: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
      
      allCandles.push(...candles);
      
      // Update current start time to the last candle timestamp + 1
      if (candles.length > 0) {
        currentStartTime = candles[candles.length - 1].timestamp + 1;
      } else {
        break;
      }
      
      // Rate limiting
      await sleep(BYBIT_LIMITS.MIN_INTERVAL_MS);
      
    } catch (error) {
      console.error(`[Bybit History] Error fetching candles:`, error);
      throw error;
    }
  }
  
  // Sort by timestamp (ascending)
  allCandles.sort((a, b) => a.timestamp - b.timestamp);
  
  return allCandles;
}

/**
 * Get timeframe duration in milliseconds
 */
function getTimeframeMs(timeframe: string): number {
  const timeframeMap: Record<string, number> = {
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  };
  
  return timeframeMap[timeframe] || 60 * 60 * 1000;
}

