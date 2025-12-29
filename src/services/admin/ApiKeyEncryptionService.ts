/**
 * API Key Encryption Service
 * 
 * Phase Admin F: Secure handling of user exchange API keys
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAuditAction } from './AuditLogService';
import { logSecurityEvent } from './SecurityEventService';
import { userHasPermission } from './RBACService';
import { useAuth } from '@/hooks/useAuth';

/**
 * Mask API key (show only last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) {
    return '****';
  }
  return '*'.repeat(apiKey.length - 4) + apiKey.slice(-4);
}

/**
 * Check if admin can view full API key
 */
export async function canViewFullApiKey(adminId: string): Promise<boolean> {
  return await userHasPermission(adminId, 'api_key_visibility');
}

/**
 * Log API key access
 */
export async function logApiKeyAccess(
  adminId: string,
  userId: string,
  apiKeyId: string,
  action: 'viewed' | 'decrypted' | 'deleted'
): Promise<{ success: boolean; error?: string }> {
  try {
    await logAdminAuditAction(adminId, 'api_key_access', {
      targetType: 'api_key',
      targetId: apiKeyId,
      metadata: {
        user_id: userId,
        action,
        timestamp: new Date().toISOString(),
      },
    });

    // Log as security event if unauthorized
    if (action === 'viewed' || action === 'decrypted') {
      const hasPermission = await canViewFullApiKey(adminId);
      if (!hasPermission) {
        await logSecurityEvent('unauthorized_api_key_access', 'high', {
          adminId: adminId,
          userId: userId,
          metadata: {
            api_key_id: apiKeyId,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get masked API keys for user (admin view)
 */
export async function getMaskedApiKeys(
  userId: string,
  adminId: string
): Promise<{ keys: Array<{ id: string; masked: string; platform: string }>; error?: string }> {
  try {
    // Log access
    await logApiKeyAccess(adminId, userId, '', 'viewed');

    // Get API keys (assuming they're stored in api_keys table)
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .select('id, api_key, platform')
      .eq('user_id', userId);

    if (error) {
      return { keys: [], error: error.message };
    }

    const keys = (data || []).map((key: any) => ({
      id: key.id,
      masked: maskApiKey(key.api_key || ''),
      platform: key.platform || 'unknown',
    }));

    return { keys };
  } catch (error) {
    return {
      keys: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get full API key (Owner only)
 */
export async function getFullApiKey(
  apiKeyId: string,
  adminId: string
): Promise<{ key: string | null; error?: string }> {
  try {
    const hasPermission = await canViewFullApiKey(adminId);
    if (!hasPermission) {
      return { key: null, error: 'Unauthorized: Only Owner can view full API keys' };
    }

    // Get API key
    const { data, error } = await (supabase as any)
      .from('api_keys')
      .select('api_key, user_id')
      .eq('id', apiKeyId)
      .single();

    if (error) {
      return { key: null, error: error.message };
    }

    // Log access
    await logApiKeyAccess(adminId, data.user_id, apiKeyId, 'decrypted');

    return { key: data.api_key };
  } catch (error) {
    return {
      key: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

