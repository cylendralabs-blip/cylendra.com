/**
 * User Error Log Service
 * 
 * Phase Admin D: User error tracking and logging
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserErrorLog {
  id: string;
  user_id: string;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  suggested_action: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

/**
 * Log a user error
 */
export async function logUserError(
  userId: string,
  errorType: string,
  errorMessage: string,
  source: string,
  severity: UserErrorLog['severity'],
  options?: {
    errorStack?: string;
    metadata?: Record<string, any>;
    suggestedAction?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_error_logs')
      .insert({
        user_id: userId,
        error_type: errorType,
        error_message: errorMessage,
        error_stack: options?.errorStack || null,
        source,
        severity,
        metadata: options?.metadata || {},
        suggested_action: options?.suggestedAction || null,
      });

    if (error) {
      console.error('Error logging user error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logUserError:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user error logs
 */
export async function getUserErrorLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    errorType?: string;
    severity?: UserErrorLog['severity'];
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ errors: UserErrorLog[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('user_error_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.errorType) {
      query = query.eq('error_type', options.errorType);
    }

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options?.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
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
      console.error('Error fetching error logs:', error);
      return { errors: [], error: error.message };
    }

    return { errors: data || [] };
  } catch (error) {
    console.error('Error in getUserErrorLogs:', error);
    return {
      errors: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark error as resolved
 */
export async function resolveError(
  errorId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
      })
      .eq('id', errorId);

    if (error) {
      return { success: false, error: error.message };
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
 * Get error statistics for a user
 */
export async function getUserErrorStats(
  userId: string,
  days: number = 30
): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  unresolved: number;
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { errors } = await getUserErrorLogs(userId, {
      startDate,
    });

    const stats = {
      total: errors.length,
      bySeverity: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      unresolved: 0,
    };

    errors.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.bySource[error.source] = (stats.bySource[error.source] || 0) + 1;
      if (!error.resolved) {
        stats.unresolved++;
      }
    });

    return stats;
  } catch (error) {
    return {
      total: 0,
      bySeverity: {},
      bySource: {},
      unresolved: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

