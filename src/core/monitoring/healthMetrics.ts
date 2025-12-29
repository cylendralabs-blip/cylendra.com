/**
 * Health Metrics System
 * 
 * Phase X.15 - Monitoring Improvements
 * Tracks health metrics for all services
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthMetric {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number; // ms
  errorRate?: number; // 0-1
  lastCheck: string;
  metadata?: Record<string, any>;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number; // percentage
  averageLatency: number; // ms
  errorRate: number; // 0-1
  lastCheck: string;
  checks: HealthMetric[];
}

/**
 * Record a health check
 */
export async function recordHealthCheck(metric: HealthMetric): Promise<void> {
  try {
    // Store directly in system_status table (Edge Function only supports GET)
    const { error } = await supabase
      .from('system_status' as any)
      .upsert({
        service_name: metric.service,
        status: metric.status === 'healthy' ? 'OK' : metric.status === 'degraded' ? 'WARNING' : 'ERROR',
        last_run: new Date().toISOString(),
        last_success: metric.status === 'healthy' ? new Date().toISOString() : null,
        avg_response_time_ms: metric.latency,
        error_message: metric.status !== 'healthy' ? 'Service health check failed' : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'service_name',
      });

    if (error) {
      console.error('Failed to record health check:', error);
    }
  } catch (error) {
    console.error('Failed to record health check:', error);
  }
}

/**
 * Get service health summary
 */
export async function getServiceHealth(service: string): Promise<ServiceHealth | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('system_status')
      .select('*')
      .eq('service', service)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Calculate metrics
    const checks = data.map((row: any) => ({
      service: row.service,
      status: row.status,
      latency: row.latency,
      errorRate: row.error_rate,
      lastCheck: row.created_at,
      metadata: row.metadata || {},
    }));

    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const uptime = (healthyCount / checks.length) * 100;

    const latencies = checks.filter(c => c.latency !== null).map(c => c.latency!);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;

    const errorRates = checks.filter(c => c.errorRate !== null).map(c => c.errorRate!);
    const errorRate = errorRates.length > 0
      ? errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length
      : 0;

    const latestCheck = checks[0];
    const overallStatus = uptime >= 95 ? 'healthy' : uptime >= 80 ? 'degraded' : 'down';

    return {
      service,
      status: overallStatus,
      uptime,
      averageLatency,
      errorRate,
      lastCheck: latestCheck.lastCheck,
      checks: checks.slice(0, 10), // Last 10 checks
    };
  } catch (error) {
    console.error('Failed to get service health:', error);
    return null;
  }
}

/**
 * Get all services health
 */
export async function getAllServicesHealth(): Promise<ServiceHealth[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('system_status')
      .select('service')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const uniqueServices = Array.from(new Set(data.map((row: any) => row.service))) as string[];

    const healthPromises = uniqueServices.map((service: string) => getServiceHealth(service));
    const healthResults = await Promise.all(healthPromises);

    return healthResults.filter((h): h is ServiceHealth => h !== null);
  } catch (error) {
    console.error('Failed to get all services health:', error);
    return [];
  }
}

