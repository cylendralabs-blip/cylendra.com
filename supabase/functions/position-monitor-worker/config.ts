/**
 * Position Monitor Worker Configuration
 * 
 * Configuration for position monitoring worker
 * 
 * Phase 6: Position Manager
 */

/**
 * Worker Configuration
 */
export const POSITION_MONITOR_CONFIG = {
  // How often to run the worker (in seconds)
  RUN_INTERVAL_SECONDS: 30,
  
  // Maximum positions to process per run
  MAX_POSITIONS_PER_RUN: 50,
  
  // Price update interval (seconds)
  PRICE_UPDATE_INTERVAL: 10,
  
  // Order sync interval (seconds)
  ORDER_SYNC_INTERVAL: 20,
  
  // PnL update interval (seconds)
  PNL_UPDATE_INTERVAL: 15,
  
  // Default timeout for HTTP requests (ms)
  REQUEST_TIMEOUT_MS: 10000,
  
  // Maximum retries for failed operations
  MAX_RETRIES: 3,
  
  // Retry delay (ms)
  RETRY_DELAY_MS: 1000
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
 * Get Supabase Service Role Key
 */
export function getSupabaseServiceRoleKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  return key;
}

/**
 * Get Get Live Prices Function URL
 */
export function getLivePricesUrl(): string {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/functions/v1/get-live-prices`;
}

