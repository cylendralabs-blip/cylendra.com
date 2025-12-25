/**
 * Configuration Protection Service
 * 
 * Phase Admin F: Protect sensitive configuration changes
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAuditAction } from './AuditLogService';
import { logSecurityEvent } from './SecurityEventService';

export interface ConfigChangeLog {
  id: string;
  admin_id: string;
  config_key: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  requires_confirmation: boolean;
  confirmed_at: string | null;
  cooldown_until: string | null;
  auto_revert_at: string | null;
  reverted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Check if config change requires confirmation
 */
export function requiresConfirmation(configKey: string): boolean {
  const criticalConfigs = [
    'global_kill_switch',
    'global_risk_settings',
    'exchange_api_settings',
    'ai_provider_settings',
    'system_environment',
    'cron_job_controls',
  ];
  return criticalConfigs.includes(configKey);
}

/**
 * Check if config change has cooldown
 */
export function hasCooldown(configKey: string): boolean {
  const cooldownConfigs = [
    'global_risk_settings',
    'max_daily_loss_limit',
    'max_drawdown_limit',
    'max_leverage',
  ];
  return cooldownConfigs.includes(configKey);
}

/**
 * Get cooldown duration in minutes
 */
export function getCooldownDuration(configKey: string): number {
  const cooldowns: Record<string, number> = {
    global_risk_settings: 10,
    max_daily_loss_limit: 15,
    max_drawdown_limit: 15,
    max_leverage: 10,
  };
  return cooldowns[configKey] || 0;
}

/**
 * Log configuration change
 */
export async function logConfigChange(
  adminId: string,
  configKey: string,
  oldValue: Record<string, any> | null,
  newValue: Record<string, any>,
  options?: {
    ipAddress?: string;
    userAgent?: string;
    requiresConfirmation?: boolean;
    cooldownUntil?: Date;
  }
): Promise<{ success: boolean; changeId?: string; error?: string }> {
  try {
    const needsConfirmation = options?.requiresConfirmation ?? requiresConfirmation(configKey);
    const cooldownUntil = options?.cooldownUntil || (hasCooldown(configKey) 
      ? new Date(Date.now() + getCooldownDuration(configKey) * 60 * 1000)
      : null);

    const { data, error } = await (supabase as any)
      .from('configuration_change_logs')
      .insert({
        admin_id: adminId,
        config_key: configKey,
        old_value: oldValue,
        new_value: newValue,
        requires_confirmation: needsConfirmation,
        cooldown_until: cooldownUntil?.toISOString() || null,
        ip_address: options?.ipAddress || null,
        user_agent: options?.userAgent || null,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log to audit
    await logAdminAuditAction(adminId, 'config_change', {
      targetType: 'config',
      targetId: configKey,
      oldValue,
      newValue,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    // Log security event if critical
    if (requiresConfirmation(configKey)) {
      await logSecurityEvent('critical_config_change', 'high', {
        adminId: adminId,
        metadata: {
          config_key: configKey,
        },
      });
    }

    return { success: true, changeId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Confirm configuration change
 */
export async function confirmConfigChange(
  changeId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('configuration_change_logs')
      .update({
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', changeId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAdminAuditAction(adminId, 'config_change_confirmed', {
      targetType: 'config_change',
      targetId: changeId,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending configuration changes
 */
export async function getPendingConfigChanges(
  configKey?: string
): Promise<{ changes: ConfigChangeLog[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('configuration_change_logs')
      .select('*')
      .eq('requires_confirmation', true)
      .is('confirmed_at', null)
      .order('created_at', { ascending: false });

    if (configKey) {
      query = query.eq('config_key', configKey);
    }

    const { data, error } = await query;

    if (error) {
      return { changes: [], error: error.message };
    }

    return { changes: data || [] };
  } catch (error) {
    return {
      changes: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

