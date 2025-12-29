/**
 * Funding Rates Sync Edge Function
 * 
 * Phase X.9 - AI Market Intelligence Layer
 * 
 * Fetches funding rates from Binance and OKX for perpetual futures contracts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('funding-rates-sync');

// Major symbols to track
const TRACKED_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
  'LINKUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'LTCUSDT'
];

/**
 * Fetch funding rates from Binance Futures
 */
async function fetchBinanceFundingRates(): Promise<any[]> {
  try {
    const url = 'https://fapi.binance.com/fapi/v1/premiumIndex';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to tracked symbols only
    return data
      .filter((item: any) => TRACKED_SYMBOLS.includes(item.symbol))
      .map((item: any) => ({
        exchange: 'binance',
        symbol: item.symbol,
        funding_rate: parseFloat(item.lastFundingRate || '0'),
        next_funding_time: item.nextFundingTime ? new Date(item.nextFundingTime).toISOString() : null,
        mark_price: parseFloat(item.markPrice || '0'),
        open_interest: parseFloat(item.openInterest || '0'),
        metadata: {
          index_price: parseFloat(item.indexPrice || '0'),
          estimated_settle_price: parseFloat(item.estimatedSettlePrice || '0'),
          raw: item
        }
      }));
  } catch (error) {
    logger.error('system', 'fetch_binance_funding', 'Failed to fetch Binance funding rates', { error: error.message });
    return [];
  }
}

/**
 * Fetch funding rates from OKX
 */
async function fetchOKXFundingRates(): Promise<any[]> {
  try {
    // OKX requires symbol list, so we'll fetch for each symbol
    const results: any[] = [];
    
    for (const symbol of TRACKED_SYMBOLS) {
      try {
        // Convert BTCUSDT to BTC-USDT for OKX
        const okxSymbol = symbol.replace('USDT', '-USDT');
        const url = `https://www.okx.com/api/v5/public/funding-rate?instId=${okxSymbol}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          continue; // Skip if symbol not found
        }
        
        const result = await response.json();
        
        if (result.code === '0' && result.data && result.data.length > 0) {
          const item = result.data[0];
          results.push({
            exchange: 'okx',
            symbol: symbol, // Keep original format
            funding_rate: parseFloat(item.fundingRate || '0'),
            next_funding_time: item.nextFundingTime || null,
            mark_price: parseFloat(item.markPx || '0'),
            open_interest: parseFloat(item.openInterest || '0'),
            metadata: {
              inst_type: item.instType,
              raw: item
            }
          });
        }
      } catch (error) {
        // Continue with next symbol
        continue;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  } catch (error) {
    logger.error('system', 'fetch_okx_funding', 'Failed to fetch OKX funding rates', { error: error.message });
    return [];
  }
}

/**
 * Save funding rates to database
 */
async function saveFundingRates(
  supabaseClient: ReturnType<typeof createClient>,
  rates: any[]
): Promise<number> {
  let saved = 0;
  
  for (const rate of rates) {
    try {
      const { error } = await supabaseClient
        .from('funding_rates')
        .insert({
          exchange: rate.exchange,
          symbol: rate.symbol,
          funding_rate: rate.funding_rate,
          next_funding_time: rate.next_funding_time,
          mark_price: rate.mark_price,
          open_interest: rate.open_interest,
          metadata: rate.metadata
        });

      if (error) {
        logger.warn('system', 'save_funding_rate', `Failed to save ${rate.exchange} ${rate.symbol}`, { error: error.message });
      } else {
        saved++;
      }
    } catch (error) {
      logger.warn('system', 'save_funding_rate', `Error saving ${rate.exchange} ${rate.symbol}`, { error: error.message });
    }
  }
  
  return saved;
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

    logger.info('system', 'start', 'Starting funding rates sync');

    // Fetch from both exchanges
    const [binanceRates, okxRates] = await Promise.all([
      fetchBinanceFundingRates(),
      fetchOKXFundingRates()
    ]);

    // Save to database
    const binanceSaved = await saveFundingRates(supabaseClient, binanceRates);
    const okxSaved = await saveFundingRates(supabaseClient, okxRates);

    const totalSaved = binanceSaved + okxSaved;

    logger.info('system', 'complete', `Funding rates sync completed. Saved ${totalSaved} rates (Binance: ${binanceSaved}, OKX: ${okxSaved})`);

    return new Response(
      JSON.stringify({
        success: true,
        binance: {
          fetched: binanceRates.length,
          saved: binanceSaved
        },
        okx: {
          fetched: okxRates.length,
          saved: okxSaved
        },
        total_saved: totalSaved,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('system', 'handler_error', 'Funding rates sync error', { error: error.message });
    
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

