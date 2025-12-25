/**
 * Strategy Runner Worker Configuration
 * 
 * Configuration for strategy runner worker
 * Phase 4: Strategy Engine
 */

import { corsHeaders } from '../_shared/cors.ts';

export { corsHeaders };

/**
 * Strategy Runner Configuration
 */
export const STRATEGY_RUNNER_CONFIG = {
  // Timeframes to process
  TIMEFRAMES: ['5m', '15m', '30m', '1h', '4h', '1d'] as const,
  
  // Maximum candles to fetch per symbol
  MAX_CANDLES: 100,
  
  // Minimum candles required for strategy
  MIN_CANDLES: 50,
  
  // Minimum confidence score (0-100)
  MIN_CONFIDENCE: 60,
  
  // Maximum signals to generate per run
  MAX_SIGNALS_PER_RUN: 50,
  
  // Cooldown between runs for same timeframe (minutes)
  TIMEFRAME_COOLDOWN: {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  } as Record<string, number>,
  
  // Exchange to use for market data
  DEFAULT_EXCHANGE: 'binance' as 'binance' | 'okx'
} as const;

/**
 * Get Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Get Get Candles Function URL
 */
export function getCandlesUrl(): string {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/functions/v1/get-candles`;
}

