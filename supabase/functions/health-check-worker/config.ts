/**
 * Health Check Worker Configuration
 * 
 * Configuration for health monitoring worker
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 7
 */

export const HEALTH_CHECK_CONFIG = {
  /** Check interval in seconds (default: 180 = 3 minutes) */
  CHECK_INTERVAL_SECONDS: 180,
  
  /** Heartbeat timeout in seconds (if worker hasn't reported in X seconds, mark as down) */
  HEARTBEAT_TIMEOUT_SECONDS: 600, // 10 minutes
  
  /** Workers to monitor */
  WORKERS: [
    'auto-trader-worker',
    'strategy-runner-worker',
    'position-monitor-worker',
    'portfolio-sync-worker'
  ],
  
  /** Exchanges to ping */
  EXCHANGES: [
    { name: 'binance', apiUrl: 'https://api.binance.com/api/v3/ping' },
    { name: 'okx', apiUrl: 'https://www.okx.com/api/v5/public/time' }
  ],
  
  /** Database health check query timeout */
  DB_CHECK_TIMEOUT_MS: 5000,
  
  /** API ping timeout */
  API_PING_TIMEOUT_MS: 5000,
  
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

