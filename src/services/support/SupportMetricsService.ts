/**
 * Support Metrics Service
 * 
 * Phase Admin E: Support analytics and KPIs
 */

import { supabase } from '@/integrations/supabase/client';

export interface SupportMetrics {
  openTicketsCount: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  ticketsReopened: number;
  ticketsClosedToday: number;
  slaBreaches: number;
}

/**
 * Get support metrics
 */
export async function getSupportMetrics(
  days: number = 30
): Promise<{ metrics: SupportMetrics | null; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all tickets in date range
    const { data: tickets } = await (supabase as any)
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (!tickets) {
      return { metrics: null, error: 'Failed to fetch tickets' };
    }

    // Calculate metrics
    const openTicketsCount = tickets.filter((t: any) => t.status === 'open' || t.status === 'pending').length;

    const ticketsByCategory: Record<string, number> = {};
    const ticketsByPriority: Record<string, number> = {};

    tickets.forEach((ticket: any) => {
      ticketsByCategory[ticket.category] = (ticketsByCategory[ticket.category] || 0) + 1;
      ticketsByPriority[ticket.priority] = (ticketsByPriority[ticket.priority] || 0) + 1;
    });

    // Calculate average response time
    const ticketsWithResponse = tickets.filter((t: any) => t.first_response_at);
    const totalResponseTime = ticketsWithResponse.reduce((sum: number, t: any) => {
      const created = new Date(t.created_at);
      const responded = new Date(t.first_response_at);
      return sum + (responded.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);
    const avgResponseTimeHours = ticketsWithResponse.length > 0
      ? totalResponseTime / ticketsWithResponse.length
      : 0;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t: any) => t.resolved_at);
    const totalResolutionTime = resolvedTickets.reduce((sum: number, t: any) => {
      const created = new Date(t.created_at);
      const resolved = new Date(t.resolved_at);
      return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);
    const avgResolutionTimeHours = resolvedTickets.length > 0
      ? totalResolutionTime / resolvedTickets.length
      : 0;

    // Count reopened tickets (tickets with status changed from resolved/closed to open)
    const { data: reopenEvents } = await (supabase as any)
      .from('ticket_events_log')
      .select('ticket_id')
      .eq('event_type', 'ticket_reopened')
      .gte('created_at', startDate.toISOString());
    const ticketsReopened = new Set(reopenEvents?.map((e: any) => e.ticket_id) || []).size;

    // Count tickets closed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ticketsClosedToday = tickets.filter((t: any) => {
      if (!t.closed_at) return false;
      const closed = new Date(t.closed_at);
      return closed >= today;
    }).length;

    // Count SLA breaches
    const { data: slaBreachEvents } = await (supabase as any)
      .from('ticket_events_log')
      .select('ticket_id')
      .eq('event_type', 'sla_breached')
      .gte('created_at', startDate.toISOString());
    const slaBreaches = new Set(slaBreachEvents?.map((e: any) => e.ticket_id) || []).size;

    return {
      metrics: {
        openTicketsCount,
        ticketsByCategory,
        ticketsByPriority,
        avgResponseTimeHours,
        avgResolutionTimeHours,
        ticketsReopened,
        ticketsClosedToday,
        slaBreaches,
      },
    };
  } catch (error) {
    console.error('Error calculating support metrics:', error);
    return {
      metrics: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get daily support metrics (from aggregated table)
 */
export async function getDailySupportMetrics(
  days: number = 30
): Promise<{ metrics: any[]; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await (supabase as any)
      .from('support_metrics_daily')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      return { metrics: [], error: error.message };
    }

    return { metrics: data || [] };
  } catch (error) {
    return {
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

