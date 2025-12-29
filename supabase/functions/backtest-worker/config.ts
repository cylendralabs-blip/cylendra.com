/**
 * Backtest Worker Configuration
 * 
 * Configuration for backtest worker
 * 
 * Phase 9: Backtesting Engine - Task 8
 */

export const BACKTEST_WORKER_CONFIG = {
  /** Max execution time in seconds (default: 600 = 10 minutes) */
  MAX_EXECUTION_TIME_SECONDS: 600,
  
  /** Progress update interval in milliseconds */
  PROGRESS_UPDATE_INTERVAL_MS: 5000,
  
  /** Log level */
  LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
} as const;

export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return url;
}

export function getSupabaseServiceRoleKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  return key;
}

