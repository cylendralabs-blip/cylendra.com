/**
 * Health Check Service
 * 
 * Monitors workers, exchanges, and database health
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 7
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HEALTH_CHECK_CONFIG } from './config.ts';
import { createLogger } from '../_shared/logger.ts';

/**
 * Health Status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'down';

/**
 * Component Health
 */
export interface ComponentHealth {
  component: string;
  componentType: 'worker' | 'exchange' | 'database' | 'system';
  status: HealthStatus;
  healthScore: number;
  lastHeartbeat: string | null;
  responseTimeMs: number | null;
  errorCount: number;
  successCount: number;
  message?: string;
  details?: any;
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  success: boolean;
  components: ComponentHealth[];
  overallStatus: HealthStatus;
  overallHealthScore: number;
  errors: string[];
  executionTimeMs: number;
}

/**
 * Check worker health
 */
async function checkWorkerHealth(
  supabaseClient: ReturnType<typeof createClient>,
  workerName: string
): Promise<ComponentHealth> {
  const logger = createLogger('health-check-worker', supabaseClient);
  
  try {
    // Check last log entry from this worker
    const { data: lastLog, error } = await supabaseClient
      .from('logs')
      .select('created_at, level')
      .eq('source', workerName.toUpperCase())
      .eq('action', 'WORKER_COMPLETED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      logger.warn('system', 'WORKER_HEARTBEAT_FAIL', `Failed to check ${workerName} health: ${error.message}`);
      return {
        component: workerName,
        componentType: 'worker',
        status: 'down',
        healthScore: 0,
        lastHeartbeat: null,
        responseTimeMs: null,
        errorCount: 1,
        successCount: 0,
        message: `Failed to check worker: ${error.message}`
      };
    }
    
    if (!lastLog) {
      return {
        component: workerName,
        componentType: 'worker',
        status: 'degraded',
        healthScore: 50,
        lastHeartbeat: null,
        responseTimeMs: null,
        errorCount: 0,
        successCount: 0,
        message: 'No heartbeat found'
      };
    }
    
    const lastHeartbeat = new Date(lastLog.created_at);
    const now = new Date();
    const secondsSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000;
    
    let status: HealthStatus = 'healthy';
    let healthScore = 100;
    let message: string | undefined;
    
    if (secondsSinceHeartbeat > HEALTH_CHECK_CONFIG.HEARTBEAT_TIMEOUT_SECONDS) {
      status = 'down';
      healthScore = 0;
      message = `Worker has not reported in ${Math.floor(secondsSinceHeartbeat / 60)} minutes`;
    } else if (secondsSinceHeartbeat > HEALTH_CHECK_CONFIG.HEARTBEAT_TIMEOUT_SECONDS * 0.5) {
      status = 'degraded';
      healthScore = 50;
      message = `Worker last reported ${Math.floor(secondsSinceHeartbeat / 60)} minutes ago`;
    }
    
    // Check for recent errors
    const { data: recentErrors } = await supabaseClient
      .from('logs')
      .select('id')
      .eq('source', workerName.toUpperCase())
      .in('level', ['error', 'critical'])
      .gte('created_at', new Date(now.getTime() - 3600000).toISOString()) // Last hour
      .limit(10);
    
    if (recentErrors && recentErrors.length > 0) {
      status = recentErrors.length >= 5 ? 'down' : 'degraded';
      healthScore = Math.max(0, healthScore - recentErrors.length * 10);
      message = `${recentErrors.length} errors in the last hour`;
    }
    
    return {
      component: workerName,
      componentType: 'worker',
      status,
      healthScore,
      lastHeartbeat: lastLog.created_at,
      responseTimeMs: null,
      errorCount: recentErrors?.length || 0,
      successCount: 1,
      message
    };
  } catch (error: any) {
    logger.error('system', 'WORKER_HEARTBEAT_FAIL', `Error checking ${workerName} health: ${error.message}`, {}, error);
    return {
      component: workerName,
      componentType: 'worker',
      status: 'down',
      healthScore: 0,
      lastHeartbeat: null,
      responseTimeMs: null,
      errorCount: 1,
      successCount: 0,
      message: error.message
    };
  }
}

/**
 * Check exchange health
 */
async function checkExchangeHealth(
  exchange: { name: string; apiUrl: string }
): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_CONFIG.API_PING_TIMEOUT_MS);
    
    const response = await fetch(exchange.apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    const responseTimeMs = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        component: exchange.name,
        componentType: 'exchange',
        status: 'degraded',
        healthScore: 50,
        lastHeartbeat: new Date().toISOString(),
        responseTimeMs,
        errorCount: 1,
        successCount: 0,
        message: `API returned status ${response.status}`
      };
    }
    
    return {
      component: exchange.name,
      componentType: 'exchange',
      status: 'healthy',
      healthScore: responseTimeMs > 3000 ? 80 : 100, // Degrade if slow
      lastHeartbeat: new Date().toISOString(),
      responseTimeMs,
      errorCount: 0,
      successCount: 1
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    
    return {
      component: exchange.name,
      componentType: 'exchange',
      status: 'down',
      healthScore: 0,
      lastHeartbeat: null,
      responseTimeMs,
      errorCount: 1,
      successCount: 0,
      message: error.message || 'Connection failed'
    };
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(
  supabaseClient: ReturnType<typeof createClient>
): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    const { error } = await supabaseClient
      .from('logs')
      .select('id')
      .limit(1);
    
    const responseTimeMs = Date.now() - startTime;
    
    if (error) {
      return {
        component: 'database',
        componentType: 'database',
        status: 'down',
        healthScore: 0,
        lastHeartbeat: new Date().toISOString(),
        responseTimeMs,
        errorCount: 1,
        successCount: 0,
        message: error.message
      };
    }
    
    return {
      component: 'database',
      componentType: 'database',
      status: 'healthy',
      healthScore: responseTimeMs > 2000 ? 80 : 100,
      lastHeartbeat: new Date().toISOString(),
      responseTimeMs,
      errorCount: 0,
      successCount: 1
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    
    return {
      component: 'database',
      componentType: 'database',
      status: 'down',
      healthScore: 0,
      lastHeartbeat: null,
      responseTimeMs,
      errorCount: 1,
      successCount: 0,
      message: error.message || 'Database check failed'
    };
  }
}

/**
 * Update component health in database
 */
async function updateComponentHealth(
  supabaseClient: ReturnType<typeof createClient>,
  health: ComponentHealth
): Promise<void> {
  try {
    await supabaseClient
      .from('system_health')
      .upsert({
        component: health.component,
        component_type: health.componentType,
        status: health.status,
        health_score: health.healthScore,
        last_heartbeat: health.lastHeartbeat,
        response_time_ms: health.responseTimeMs,
        error_count: health.errorCount,
        success_count: health.successCount,
        message: health.message,
        details: health.details || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'component'
      });
  } catch (error) {
    console.error(`Failed to update health for ${health.component}:`, error);
  }
}

/**
 * Run health check for all components
 */
export async function runHealthCheck(
  supabaseClient: ReturnType<typeof createClient>
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const logger = createLogger('health-check-worker', supabaseClient);
  const result: HealthCheckResult = {
    success: true,
    components: [],
    overallStatus: 'healthy',
    overallHealthScore: 100,
    errors: [],
    executionTimeMs: 0
  };
  
  try {
    logger.info('system', 'WORKER_STARTED', 'Starting health check for all components');
    
    // Check workers
    for (const worker of HEALTH_CHECK_CONFIG.WORKERS) {
      const health = await checkWorkerHealth(supabaseClient, worker);
      result.components.push(health);
      await updateComponentHealth(supabaseClient, health);
    }
    
    // Check exchanges
    for (const exchange of HEALTH_CHECK_CONFIG.EXCHANGES) {
      const health = await checkExchangeHealth(exchange);
      result.components.push(health);
      await updateComponentHealth(supabaseClient, health);
    }
    
    // Check database
    const dbHealth = await checkDatabaseHealth(supabaseClient);
    result.components.push(dbHealth);
    await updateComponentHealth(supabaseClient, dbHealth);
    
    // Calculate overall status
    const downComponents = result.components.filter(c => c.status === 'down');
    const degradedComponents = result.components.filter(c => c.status === 'degraded');
    
    if (downComponents.length > 0) {
      result.overallStatus = 'down';
      result.success = false;
      result.errors.push(`${downComponents.length} components are down: ${downComponents.map(c => c.component).join(', ')}`);
    } else if (degradedComponents.length > 0) {
      result.overallStatus = 'degraded';
      result.errors.push(`${degradedComponents.length} components are degraded: ${degradedComponents.map(c => c.component).join(', ')}`);
    }
    
    // Calculate overall health score
    if (result.components.length > 0) {
      const totalScore = result.components.reduce((sum, c) => sum + c.healthScore, 0);
      result.overallHealthScore = Math.round(totalScore / result.components.length);
    }
    
    result.executionTimeMs = Date.now() - startTime;
    
    logger.info('system', 'WORKER_COMPLETED', `Health check completed. Status: ${result.overallStatus}, Score: ${result.overallHealthScore}`);
    
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message || 'Unknown error');
    result.executionTimeMs = Date.now() - startTime;
    logger.error('system', 'WORKER_FAILED', 'Health check failed', {}, error);
  }
  
  return result;
}

