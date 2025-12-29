/**
 * Historical Data Cache Service
 * 
 * Caches historical OHLC data to avoid repeated API calls
 * 
 * Phase 3: Optimization - Task 1
 */

import { supabase } from '@/integrations/supabase/client';
import { NormalizedCandle } from '@/services/marketData/types';
import { getHistoricalCandles } from '@/services/marketData/history/historyRouter';

/**
 * Cache key format: {pair}/{timeframe}/{year}
 */
function getCacheKey(pair: string, timeframe: string, year: number): string {
  return `${pair.toLowerCase()}/${timeframe}/${year}.json`;
}

/**
 * Load historical candles from cache
 * Falls back to API if cache is missing
 */
export async function loadHistoricalFromCache(
  exchange: 'binance' | 'okx',
  pair: string,
  timeframe: string,
  from: number,
  to: number
): Promise<NormalizedCandle[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const fromYear = fromDate.getFullYear();
  const toYear = toDate.getFullYear();

  const allCandles: NormalizedCandle[] = [];

  // Load data for each year
  for (let year = fromYear; year <= toYear; year++) {
    const cacheKey = getCacheKey(pair, timeframe, year);
    
    try {
      // Try to load from cache (Supabase Storage)
      const { data: cachedData, error: cacheError } = await supabase.storage
        .from('historical-data')
        .download(cacheKey);

      if (!cacheError && cachedData) {
        // Parse cached data
        const text = await cachedData.text();
        const candles: NormalizedCandle[] = JSON.parse(text);
        
        // Filter candles within requested range
        const filteredCandles = candles.filter(
          candle => candle.timestamp >= from && candle.timestamp <= to
        );
        
        allCandles.push(...filteredCandles);
        console.log(`✅ Loaded ${filteredCandles.length} candles from cache for ${year}`);
        continue;
      }
    } catch (error) {
      console.warn(`Cache miss for ${cacheKey}:`, error);
    }

    // Cache miss - fetch from API
    console.log(`⚠️ Cache miss for ${year}, fetching from API...`);
    
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year + 1, 0, 1).getTime() - 1;
    
    const fetchFrom = Math.max(from, yearStart);
    const fetchTo = Math.min(to, yearEnd);
    
    try {
      const apiCandles = await getHistoricalCandles(
        exchange,
        pair,
        timeframe,
        fetchFrom,
        fetchTo
      );
      
      allCandles.push(...apiCandles);
      
      // Save to cache for future use (async, don't wait)
      saveToCache(cacheKey, apiCandles).catch(err => {
        console.error(`Failed to save cache for ${cacheKey}:`, err);
      });
    } catch (error) {
      console.error(`Failed to fetch from API for ${year}:`, error);
      throw error;
    }
  }

  // Sort by timestamp
  allCandles.sort((a, b) => a.timestamp - b.timestamp);

  return allCandles;
}

/**
 * Save candles to cache
 */
async function saveToCache(
  cacheKey: string,
  candles: NormalizedCandle[]
): Promise<void> {
  try {
    const jsonData = JSON.stringify(candles);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    const { error } = await supabase.storage
      .from('historical-data')
      .upload(cacheKey, blob, {
        upsert: true,
        contentType: 'application/json'
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Cached ${candles.length} candles to ${cacheKey}`);
  } catch (error) {
    console.error(`Failed to save cache for ${cacheKey}:`, error);
    // Don't throw - caching is best effort
  }
}

/**
 * Update cache for a specific year
 * Called by cron job to keep data fresh
 */
export async function updateCacheForYear(
  exchange: 'binance' | 'okx',
  pair: string,
  timeframe: string,
  year: number
): Promise<void> {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime() - 1;
  
  try {
    const candles = await getHistoricalCandles(
      exchange,
      pair,
      timeframe,
      yearStart,
      yearEnd
    );
    
    const cacheKey = getCacheKey(pair, timeframe, year);
    await saveToCache(cacheKey, candles);
    
    console.log(`✅ Updated cache for ${pair}/${timeframe}/${year}: ${candles.length} candles`);
  } catch (error) {
    console.error(`Failed to update cache for ${year}:`, error);
    throw error;
  }
}

