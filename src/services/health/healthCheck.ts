/**
 * Health Check Service
 * 
 * Phase 18: Unified health check endpoint
 */

import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: 'ok' | 'error'; message?: string };
    aiProvider?: { status: 'ok' | 'error'; message?: string };
    exchangeApis?: { status: 'ok' | 'error'; message?: string };
  };
  timestamp: string;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {
    database: { status: 'error' },
  };

  // Check database connection
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      checks.database = {
        status: 'error',
        message: error.message,
      };
    } else {
      checks.database = { status: 'ok' };
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check AI Provider (optional)
  try {
    const aiProviderKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (aiProviderKey && aiProviderKey !== 'your-openai-api-key' && aiProviderKey.trim() !== '') {
      checks.aiProvider = { status: 'ok' };
    } else {
      checks.aiProvider = {
        status: 'error',
        message: 'AI provider API key not configured',
      };
    }
  } catch (error) {
    checks.aiProvider = {
      status: 'error',
      message: 'AI provider check failed',
    };
  }

  // Determine overall status
  const hasErrors = Object.values(checks).some(
    (check) => check.status === 'error'
  );
  const hasWarnings = checks.aiProvider?.status === 'error' || checks.exchangeApis?.status === 'error';

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (checks.database.status === 'error') {
    status = 'unhealthy';
  } else if (hasWarnings) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simple health check (database only)
 */
export async function simpleHealthCheck(): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    return false;
  }
}

