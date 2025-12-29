/**
 * System Status Engine
 * 
 * Phase X.14 - Monitors and updates system service statuses
 */

import type { SystemStatus } from './types';

/**
 * Update service status
 */
export function updateServiceStatus(
  currentStatus: SystemStatus | null,
  serviceName: string,
  status: 'OK' | 'WARNING' | 'ERROR',
  errorMessage?: string,
  responseTimeMs?: number
): Partial<SystemStatus> {
  const now = new Date().toISOString();
  
  const update: Partial<SystemStatus> = {
    service_name: serviceName,
    status,
    last_run: now,
    updated_at: now,
  };

  if (status === 'OK') {
    update.last_success = now;
    update.error_message = null;
    update.success_count = (currentStatus?.success_count || 0) + 1;
  } else {
    update.error_message = errorMessage;
    update.error_count = (currentStatus?.error_count || 0) + 1;
  }

  if (responseTimeMs !== undefined) {
    // Calculate average response time
    const currentAvg = currentStatus?.avg_response_time_ms || responseTimeMs;
    const count = (currentStatus?.success_count || 0) + (currentStatus?.error_count || 0) + 1;
    update.avg_response_time_ms = Math.round((currentAvg * (count - 1) + responseTimeMs) / count);
  }

  return update;
}

/**
 * Check if service is healthy
 */
export function isServiceHealthy(status: SystemStatus): boolean {
  if (status.status !== 'OK') {
    return false;
  }

  // Check if service is stale (no update in last 10 minutes)
  const lastUpdate = new Date(status.updated_at).getTime();
  const now = Date.now();
  const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);

  if (minutesSinceUpdate > 10) {
    return false; // Stale
  }

  // Check error rate
  const totalRuns = (status.success_count || 0) + (status.error_count || 0);
  if (totalRuns > 10) {
    const errorRate = (status.error_count || 0) / totalRuns;
    if (errorRate > 0.5) {
      return false; // High error rate
    }
  }

  return true;
}

/**
 * Get service health score (0-100)
 */
export function getServiceHealthScore(status: SystemStatus): number {
  let score = 100;

  // Status penalty
  if (status.status === 'ERROR') {
    score -= 50;
  } else if (status.status === 'WARNING') {
    score -= 25;
  }

  // Staleness penalty
  const lastUpdate = new Date(status.updated_at).getTime();
  const now = Date.now();
  const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
  if (minutesSinceUpdate > 10) {
    score -= 30;
  } else if (minutesSinceUpdate > 5) {
    score -= 15;
  }

  // Error rate penalty
  const totalRuns = (status.success_count || 0) + (status.error_count || 0);
  if (totalRuns > 0) {
    const errorRate = (status.error_count || 0) / totalRuns;
    score -= errorRate * 30;
  }

  // Response time penalty
  if (status.avg_response_time_ms && status.avg_response_time_ms > 5000) {
    score -= 20;
  } else if (status.avg_response_time_ms && status.avg_response_time_ms > 2000) {
    score -= 10;
  }

  return Math.max(0, Math.round(score));
}

/**
 * Determine overall system health
 */
export function getOverallSystemHealth(statuses: SystemStatus[]): {
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  services_ok: number;
  services_warning: number;
  services_error: number;
} {
  const services_ok = statuses.filter(s => s.status === 'OK').length;
  const services_warning = statuses.filter(s => s.status === 'WARNING').length;
  const services_error = statuses.filter(s => s.status === 'ERROR').length;
  const total = statuses.length;

  const okRate = total > 0 ? services_ok / total : 0;
  const errorRate = total > 0 ? services_error / total : 0;

  let overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  if (okRate >= 0.8 && errorRate === 0) {
    overall = 'HEALTHY';
  } else if (okRate >= 0.5 && errorRate < 0.3) {
    overall = 'DEGRADED';
  } else {
    overall = 'UNHEALTHY';
  }

  const score = Math.round(okRate * 100);

  return {
    overall,
    score,
    services_ok,
    services_warning,
    services_error,
  };
}

