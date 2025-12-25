/**
 * Market Metrics Aggregator Edge Function
 * 
 * Phase X.9 - AI Market Intelligence Layer
 * 
 * Aggregates market data (prices, volume, volatility) to build heatmap metrics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('market-metrics-aggregator');

// Symbols to track
const TRACKED_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
  'LINKUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'LTCUSDT'
];

const TIMEFRAMES = ['1h', '4h', '1d'];

/**
 * Fetch 24h ticker data from Binance
 */
async function fetchBinance24hTicker(symbol: string): Promise<any | null> {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    return {
      symbol: data.symbol,
      price_change_24h: parseFloat(data.priceChangePercent || '0'),
      volume_24h: parseFloat(data.volume || '0'),
      quote_volume_24h: parseFloat(data.quoteVolume || '0'),
      high_24h: parseFloat(data.highPrice || '0'),
      low_24h: parseFloat(data.lowPrice || '0'),
      last_price: parseFloat(data.lastPrice || '0')
    };
  } catch (error) {
    logger.warn('system', 'fetch_ticker', `Failed to fetch ticker for ${symbol}`, { error: error.message });
    return null;
  }
}

/**
 * Calculate volatility score (0-100) from price data
 */
function calculateVolatilityScore(
  high24h: number,
  low24h: number,
  lastPrice: number
): number {
  if (lastPrice === 0) return 50;
  
  const range = high24h - low24h;
  const rangePercent = (range / lastPrice) * 100;
  
  // Normalize: 0-20% range maps to 0-100 score
  // Higher volatility = higher score
  return Math.min(100, Math.max(0, rangePercent * 5));
}

/**
 * Calculate trend score (0-100) from price change
 */
function calculateTrendScore(priceChange24h: number): number {
  // Normalize: -10% to +10% maps to 0-100
  // Positive change = bullish trend
  return Math.min(100, Math.max(0, 50 + (priceChange24h * 5)));
}

/**
 * Calculate activity score (0-100) from volume and volatility
 */
function calculateActivityScore(
  volume24h: number,
  volatilityScore: number,
  priceChange24h: number
): number {
  // Combine volume (normalized) + volatility + price movement
  // We'll use a simple heuristic: higher volume + higher volatility + larger price change = higher activity
  
  // Normalize volume (we'll use a relative approach - compare to average)
  // For simplicity, we'll use volume percentile (0-100)
  // In production, you'd compare to historical averages
  
  const volumeFactor = Math.min(100, Math.log10(volume24h + 1) * 10); // Logarithmic scale
  const volatilityFactor = volatilityScore;
  const priceMovementFactor = Math.abs(priceChange24h) * 5; // 0-50
  
  // Weighted average
  return Math.min(100, (volumeFactor * 0.4 + volatilityFactor * 0.4 + priceMovementFactor * 0.2));
}

/**
 * Determine heat label from scores
 */
function determineHeatLabel(activityScore: number, trendScore: number): string {
  if (activityScore >= 75 && trendScore >= 60) {
    return 'HOT'; // High activity + bullish trend
  } else if (activityScore >= 60 || trendScore >= 70) {
    return 'WARM'; // Moderate activity or strong trend
  } else if (activityScore <= 40 && trendScore <= 40) {
    return 'COLD'; // Low activity + bearish trend
  } else {
    return 'COOL'; // Default
  }
}

/**
 * Process symbol and save metrics
 */
async function processSymbol(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string
): Promise<boolean> {
  try {
    // Fetch 24h ticker data
    const ticker = await fetchBinance24hTicker(symbol);
    
    if (!ticker) {
      return false;
    }

    // Calculate scores
    const volatilityScore = calculateVolatilityScore(
      ticker.high_24h,
      ticker.low_24h,
      ticker.last_price
    );
    
    const trendScore = calculateTrendScore(ticker.price_change_24h);
    
    const activityScore = calculateActivityScore(
      ticker.volume_24h,
      volatilityScore,
      ticker.price_change_24h
    );
    
    const heatLabel = determineHeatLabel(activityScore, trendScore);

    // Save to database
    const { error } = await supabaseClient
      .from('market_heatmap_metrics')
      .insert({
        symbol,
        timeframe,
        price_change_24h: ticker.price_change_24h,
        volume_24h: ticker.volume_24h,
        volatility_score: Math.round(volatilityScore),
        trend_score: Math.round(trendScore),
        activity_score: Math.round(activityScore),
        heat_label: heatLabel,
        metadata: {
          high_24h: ticker.high_24h,
          low_24h: ticker.low_24h,
          last_price: ticker.last_price,
          quote_volume_24h: ticker.quote_volume_24h
        }
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.warn('system', 'process_symbol', `Failed to process ${symbol} ${timeframe}`, { error: error.message });
    return false;
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    logger.info('system', 'start', 'Starting market metrics aggregation');

    const results: any = {};
    let totalProcessed = 0;

    // Process each symbol for each timeframe
    for (const symbol of TRACKED_SYMBOLS) {
      for (const timeframe of TIMEFRAMES) {
        const success = await processSymbol(supabaseClient, symbol, timeframe);
        if (success) {
          totalProcessed++;
          if (!results[symbol]) results[symbol] = [];
          results[symbol].push(timeframe);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    logger.info('system', 'complete', `Market metrics aggregation completed. Processed ${totalProcessed} metrics`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        symbols_processed: Object.keys(results).length,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('system', 'handler_error', 'Market metrics aggregation error', { error: error.message });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

