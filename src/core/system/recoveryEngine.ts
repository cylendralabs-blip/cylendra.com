/**
 * Recovery Engine
 * 
 * Phase X.14 - Automatically recovers failed services
 */

import type { RecoveryEvent } from './types';

export interface RecoveryAction {
  service_name: string;
  action: 'restart' | 'cleanup' | 'reset' | 'reconnect' | 'rebuild_cache';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Determine recovery action based on service status
 */
export function determineRecoveryAction(
  serviceName: string,
  status: 'OK' | 'WARNING' | 'ERROR',
  errorMessage?: string,
  lastSuccess?: string
): RecoveryAction | null {
  if (status === 'OK') {
    return null; // No recovery needed
  }

  // Determine action based on service and error
  const action: RecoveryAction = {
    service_name: serviceName,
    action: 'restart',
    priority: status === 'ERROR' ? 'HIGH' : 'MEDIUM',
  };

  // Service-specific recovery strategies
  if (serviceName.includes('WebSocket') || serviceName.includes('Stream')) {
    action.action = 'reconnect';
    action.priority = 'CRITICAL';
  } else if (serviceName.includes('Cache') || serviceName.includes('Memory')) {
    action.action = 'rebuild_cache';
    action.priority = 'MEDIUM';
  } else if (serviceName.includes('Database') || serviceName.includes('DB')) {
    action.action = 'reset';
    action.priority = 'CRITICAL';
  } else if (errorMessage?.includes('queue') || errorMessage?.includes('timeout')) {
    action.action = 'cleanup';
    action.priority = 'HIGH';
  }

  return action;
}

/**
 * Check if service needs recovery
 */
export function needsRecovery(
  status: 'OK' | 'WARNING' | 'ERROR',
  lastSuccess?: string,
  errorCount?: number
): boolean {
  if (status === 'OK') {
    return false;
  }

  // If error status and no recent success
  if (status === 'ERROR') {
    if (!lastSuccess) {
      return true; // Never succeeded, needs recovery
    }

    const lastSuccessTime = new Date(lastSuccess).getTime();
    const now = Date.now();
    const minutesSinceSuccess = (now - lastSuccessTime) / (1000 * 60);

    // If no success in last 15 minutes, needs recovery
    if (minutesSinceSuccess > 15) {
      return true;
    }
  }

  // If high error count
  if (errorCount && errorCount > 5) {
    return true;
  }

  return false;
}

/**
 * Generate recovery event
 */
export function createRecoveryEvent(
  action: RecoveryAction,
  triggeredBy: 'auto' | 'manual',
  userId?: string
): Partial<RecoveryEvent> {
  return {
    service_name: action.service_name,
    action: action.action,
    status: 'IN_PROGRESS',
    triggered_by: triggeredBy,
    triggered_by_user: userId,
    metadata: {
      priority: action.priority,
      timestamp: new Date().toISOString(),
    },
  };
}

