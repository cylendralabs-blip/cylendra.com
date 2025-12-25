/**
 * Admin Activity Service
 * 
 * Phase 18: Log all sensitive admin operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAuditAction as logToAuditLog } from './AuditLogService';
import { logAdminAuditAction } from './AuditLogService';

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Log an admin action
 */
export async function logAdminAction(
  action: string,
  options?: {
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('admin_activity_logs')
      .insert({
        admin_id: user.id,
        action,
        target_type: options?.targetType,
        target_id: options?.targetId,
        metadata: options?.metadata || {},
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
      });

    if (error) {
      console.error('Error logging admin action:', error);
      return { success: false, error: error.message };
    }

    // Also log to audit logs (Phase Admin F)
    if (user) {
      await logToAuditLog(user.id, action, {
        targetType: options?.targetType,
        targetId: options?.targetId,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: options?.metadata,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logAdminAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get recent admin activity logs
 */
export async function getRecentActivity(
  limit: number = 50,
  filters?: {
    hours?: number; // Last N hours
    days?: number; // Last N days
    action?: string; // Filter by action type
  }
): Promise<{ logs: AdminActivityLog[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply time filters
    if (filters?.hours) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - filters.hours);
      query = query.gte('created_at', hoursAgo.toISOString());
    } else if (filters?.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.days);
      query = query.gte('created_at', daysAgo.toISOString());
    }

    // Apply action filter
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin activity logs:', error);
      return { logs: [], error: error.message };
    }

    return { logs: (data || []) as AdminActivityLog[] };
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get activity logs for a specific admin
 */
export async function getAdminActivity(
  adminId: string,
  limit: number = 50
): Promise<{ logs: AdminActivityLog[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('admin_activity_logs')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching admin activity:', error);
      return { logs: [], error: error.message };
    }

    return { logs: (data || []) as AdminActivityLog[] };
  } catch (error) {
    console.error('Error in getAdminActivity:', error);
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
