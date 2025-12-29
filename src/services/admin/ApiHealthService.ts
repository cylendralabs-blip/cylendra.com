/**
 * API Health Service
 * 
 * Phase Admin D: API key health monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export interface ApiKeyHealth {
  id: string;
  user_id: string;
  api_key_id: string | null;
  platform: string;
  status: 'valid' | 'invalid' | 'expired' | 'permission_error' | 'rate_limited';
  last_successful_request_at: string | null;
  last_successful_endpoint: string | null;
  error_rate_percentage: number;
  last_10_errors: Array<{
    timestamp: string;
    error: string;
    endpoint: string;
  }>;
  security_flags: Record<string, any>;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get API health status for a user
 */
export async function getUserApiHealth(
  userId: string
): Promise<{ health: ApiKeyHealth[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('api_key_health_status')
      .select('*')
      .eq('user_id', userId)
      .order('last_checked_at', { ascending: false });

    if (error) {
      console.error('Error fetching API health:', error);
      return { health: [], error: error.message };
    }

    return { health: data || [] };
  } catch (error) {
    console.error('Error in getUserApiHealth:', error);
    return {
      health: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update API health status
 */
export async function updateApiHealth(
  userId: string,
  apiKeyId: string | null,
  platform: string,
  status: ApiKeyHealth['status'],
  options?: {
    lastSuccessfulRequestAt?: Date;
    lastSuccessfulEndpoint?: string;
    errorRate?: number;
    lastErrors?: Array<{ timestamp: string; error: string; endpoint: string }>;
    securityFlags?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      user_id: userId,
      platform,
      status,
      last_checked_at: new Date().toISOString(),
    };

    if (apiKeyId) {
      updateData.api_key_id = apiKeyId;
    }

    if (options?.lastSuccessfulRequestAt) {
      updateData.last_successful_request_at = options.lastSuccessfulRequestAt.toISOString();
    }

    if (options?.lastSuccessfulEndpoint) {
      updateData.last_successful_endpoint = options.lastSuccessfulEndpoint;
    }

    if (options?.errorRate !== undefined) {
      updateData.error_rate_percentage = options.errorRate;
    }

    if (options?.lastErrors) {
      updateData.last_10_errors = options.lastErrors.slice(0, 10);
    }

    if (options?.securityFlags) {
      updateData.security_flags = options.securityFlags;
    }

    const { error } = await (supabase as any)
      .from('api_key_health_status')
      .upsert(updateData, {
        onConflict: apiKeyId ? 'api_key_id' : undefined,
      });

    if (error) {
      console.error('Error updating API health:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateApiHealth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get unhealthy API keys across all users
 */
export async function getUnhealthyApiKeys(
  limit: number = 50
): Promise<{ health: ApiKeyHealth[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('api_key_health_status')
      .select('*')
      .in('status', ['invalid', 'expired', 'permission_error', 'rate_limited'])
      .order('last_checked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching unhealthy API keys:', error);
      return { health: [], error: error.message };
    }

    return { health: data || [] };
  } catch (error) {
    console.error('Error in getUnhealthyApiKeys:', error);
    return {
      health: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

