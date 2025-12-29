/**
 * Auto-Trader Worker Configuration
 * 
 * Configuration for auto-trading worker
 */

/**
 * Worker Configuration
 */
export const WORKER_CONFIG = {
  // How often to run the worker (in minutes)
  RUN_INTERVAL_MINUTES: 1,
  
  // Maximum signals to process per run
  MAX_SIGNALS_PER_RUN: 10,
  
  // Cooldown period for same symbol (in minutes)
  SYMBOL_COOLDOWN_MINUTES: 15,
  
  // Default minimum confidence score
  DEFAULT_MIN_CONFIDENCE: 70,
  
  // Maximum execution attempts per signal
  MAX_EXECUTION_ATTEMPTS: 3,
  
  // Retry delay after failed execution (in minutes)
  RETRY_DELAY_MINUTES: 5
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
 * Get Execute Trade Function URL
 */
export function getExecuteTradeUrl(): string {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/functions/v1/execute-trade`;
}

