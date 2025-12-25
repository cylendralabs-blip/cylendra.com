/**
 * Audit Log Service
 * 
 * Phase Admin F: Complete audit logging system
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Log admin action
 */
export async function logAdminAuditAction(
  adminId: string,
  actionType: string,
  options?: {
    targetType?: string;
    targetId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action_type: actionType,
        target_type: options?.targetType || null,
        target_id: options?.targetId || null,
        old_value: options?.oldValue || null,
        new_value: options?.newValue || null,
        ip_address: options?.ipAddress || null,
        user_agent: options?.userAgent || null,
        metadata: options?.metadata || {},
      });

    if (error) {
      console.error('Error logging audit action:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logAdminAuditAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  options?: {
    adminId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: AdminAuditLog[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.adminId) {
      query = query.eq('admin_id', options.adminId);
    }

    if (options?.actionType) {
      query = query.eq('action_type', options.actionType);
    }

    if (options?.targetType) {
      query = query.eq('target_type', options.targetType);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { logs: [], error: error.message };
    }

    return { logs: data || [] };
  } catch (error) {
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  days: number = 30
): Promise<{
  total: number;
  byActionType: Record<string, number>;
  byAdmin: Record<string, number>;
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { logs } = await getAuditLogs({ startDate });

    const stats = {
      total: logs.length,
      byActionType: {} as Record<string, number>,
      byAdmin: {} as Record<string, number>,
    };

    logs.forEach(log => {
      stats.byActionType[log.action_type] = (stats.byActionType[log.action_type] || 0) + 1;
      stats.byAdmin[log.admin_id] = (stats.byAdmin[log.admin_id] || 0) + 1;
    });

    return stats;
  } catch (error) {
    return {
      total: 0,
      byActionType: {},
      byAdmin: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

