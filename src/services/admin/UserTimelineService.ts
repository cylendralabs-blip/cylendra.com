/**
 * User Timeline Service
 * 
 * Phase Admin D: User activity timeline tracking
 */

import { supabase } from '@/integrations/supabase/client';

export interface TimelineEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_category: 'authentication' | 'api_connection' | 'trading_activity' | 'risk_event' | 'admin_action' | 'system_issue';
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical' | null;
  source: string | null;
  created_at: string;
}

/**
 * Log a timeline event
 */
export async function logTimelineEvent(
  userId: string,
  eventType: string,
  eventCategory: TimelineEvent['event_category'],
  title: string,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
    severity?: TimelineEvent['severity'];
    source?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('user_timeline_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_category: eventCategory,
        title,
        description: options?.description || null,
        metadata: options?.metadata || {},
        severity: options?.severity || 'info',
        source: options?.source || null,
      });

    if (error) {
      console.error('Error logging timeline event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logTimelineEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user timeline events
 */
export async function getUserTimeline(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventCategory?: TimelineEvent['event_category'];
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ events: TimelineEvent[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('user_timeline_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.eventCategory) {
      query = query.eq('event_category', options.eventCategory);
    }

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
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
      console.error('Error fetching timeline events:', error);
      return { events: [], error: error.message };
    }

    return { events: data || [] };
  } catch (error) {
    console.error('Error in getUserTimeline:', error);
    return {
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get timeline event count for a user
 */
export async function getTimelineEventCount(
  userId: string,
  options?: {
    eventCategory?: TimelineEvent['event_category'];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ count: number; error?: string }> {
  try {
    let query = (supabase as any)
      .from('user_timeline_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (options?.eventCategory) {
      query = query.eq('event_category', options.eventCategory);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (error) {
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

