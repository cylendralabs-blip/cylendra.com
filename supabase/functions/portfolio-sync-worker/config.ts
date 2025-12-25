/**
 * Portfolio Sync Worker Configuration
 * 
 * Configuration for portfolio synchronization worker
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 2
 */

export const PORTFOLIO_SYNC_CONFIG = {
  /** Sync interval in seconds (default: 300 = 5 minutes) */
  SYNC_INTERVAL_SECONDS: 300,
  
  /** Maximum users to process per run */
  MAX_USERS_PER_RUN: 50,
  
  /** Timeout for API calls in milliseconds */
  API_TIMEOUT_MS: 10000,
  
  /** Batch size for database updates */
  DB_UPDATE_BATCH_SIZE: 10,
  
  /** Log level */
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  
  /** Enable snapshot creation */
  ENABLE_SNAPSHOTS: true,
  
  /** Snapshot interval in minutes (only create snapshot every X minutes) */
  SNAPSHOT_INTERVAL_MINUTES: 5,
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

