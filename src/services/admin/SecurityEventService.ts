/**
 * Security Event Service
 * 
 * Phase Admin F: Security incident detection and logging
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string | null;
  admin_id: string | null;
  metadata: Record<string, any>;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: string,
  severity: SecurityEvent['severity'],
  options?: {
    userId?: string;
    adminId?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('security_events')
      .insert({
        event_type: eventType,
        severity,
        user_id: options?.userId || null,
        admin_id: options?.adminId || null,
        metadata: options?.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging security event:', error);
      return { success: false, error: error.message };
    }

    // TODO: Send alert if severity is high or critical
    if (severity === 'high' || severity === 'critical') {
      // await sendSecurityAlert(eventType, severity, options);
    }

    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('Error in logSecurityEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get security events
 */
export async function getSecurityEvents(
  options?: {
    severity?: SecurityEvent['severity'];
    eventType?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ events: SecurityEvent[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('security_events')
      .select('*')
      .order('detected_at', { ascending: false });

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options?.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
    }

    if (options?.startDate) {
      query = query.gte('detected_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('detected_at', options.endDate.toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { events: [], error: error.message };
    }

    return { events: data || [] };
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve security event
 */
export async function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('security_events')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', eventId);

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
 * Get security event statistics
 */
export async function getSecurityEventStats(
  days: number = 30
): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  byEventType: Record<string, number>;
  unresolved: number;
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { events } = await getSecurityEvents({ startDate });

    const stats = {
      total: events.length,
      bySeverity: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
      unresolved: 0,
    };

    events.forEach(event => {
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      stats.byEventType[event.event_type] = (stats.byEventType[event.event_type] || 0) + 1;
      if (!event.resolved) {
        stats.unresolved++;
      }
    });

    return stats;
  } catch (error) {
    return {
      total: 0,
      bySeverity: {},
      byEventType: {},
      unresolved: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

