/**
 * Get Candles Edge Function
 * 
 * Fetches historical candles from exchange APIs
 * Phase 4: Strategy Engine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('get-candles');

/**
 * Binance timeframe mapping
 */
const BINANCE_TIMEFRAME_MAP: Record<string, string> = {
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
 * OKX timeframe mapping
 */
const OKX_TIMEFRAME_MAP: Record<string, string> = {
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
 * Fetch candles from Binance
 */
async function fetchBinanceCandles(
  symbol: string,
  timeframe: string,
  limit: number = 100
): Promise<any[]> {
  const binanceSymbol = symbol.replace('/', '').toUpperCase();
  const binanceTimeframe = BINANCE_TIMEFRAME_MAP[timeframe] || timeframe;

  const params = new URLSearchParams({
    symbol: binanceSymbol,
    interval: binanceTimeframe,
    limit: Math.min(limit, 1000).toString()
  });

  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const klines = await response.json();
  
  return klines.map((k: any[]) => ({
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: k[6],
    quoteVolume: parseFloat(k[7] || 0),
    trades: k[8] || 0
  }));
}

/**
 * Fetch candles from OKX
 */
async function fetchOKXCandles(
  symbol: string,
  timeframe: string,
  limit: number = 100
): Promise<any[]> {
  const okxSymbol = symbol.replace('/', '-').toUpperCase();
  const okxTimeframe = OKX_TIMEFRAME_MAP[timeframe] || timeframe.toUpperCase();

  const params = new URLSearchParams({
    instId: okxSymbol,
    bar: okxTimeframe,
    limit: Math.min(limit, 300).toString()
  });

  const url = `https://www.okx.com/api/v5/market/candles?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`OKX API error: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.code !== '0') {
    throw new Error(`OKX API error: ${result.msg || 'Unknown error'}`);
  }

  const klines = result.data || [];
  
  return klines.map((k: any[]) => ({
    openTime: parseInt(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[6] || 0),
    closeTime: parseInt(k[0]) + (60 * 60 * 1000) - 1, // Approximate
    trades: parseInt(k[8] || 0)
  }));
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json();
    const { exchange, symbol, timeframe, limit = 100 } = body;

    if (!exchange || !symbol || !timeframe) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: exchange, symbol, timeframe' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logger.info(`Fetching candles: ${exchange} ${symbol} ${timeframe}`);

    let candles: any[] = [];

    if (exchange === 'binance') {
      candles = await fetchBinanceCandles(symbol, timeframe, limit);
    } else if (exchange === 'okx') {
      candles = await fetchOKXCandles(symbol, timeframe, limit);
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported exchange: ${exchange}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Sort by time (ascending)
    candles.sort((a, b) => a.openTime - b.openTime);

    logger.info(`✅ Fetched ${candles.length} candles for ${symbol} ${timeframe}`);

    return new Response(
      JSON.stringify({
        success: true,
        exchange,
        symbol,
        timeframe,
        candles,
        count: candles.length,
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Error in get-candles:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

