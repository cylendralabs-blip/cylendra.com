/**
 * Ticket Automation Service
 * 
 * Phase Admin E: Automated workflows for ticket management
 */

import { supabase } from '@/integrations/supabase/client';
import { getTicketById, updateTicket, type Ticket } from './TicketService';

/**
 * Auto-assign ticket based on category
 */
export async function autoAssignTicket(
  ticketId: string,
  category: Ticket['category']
): Promise<{ success: boolean; assignedTo?: string; error?: string }> {
  try {
    // TODO: Implement admin expertise mapping
    // For now, we'll just log the event
    const { error } = await (supabase as any)
      .from('ticket_events_log')
      .insert({
        ticket_id: ticketId,
        event_type: 'auto_assigned',
        performed_by: null,
        metadata: { category, attempted: true },
      });

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
 * Auto-detect priority based on message content
 */
export async function autoDetectPriority(
  ticketId: string,
  messageText: string
): Promise<{ priority: Ticket['priority'] | null; error?: string }> {
  try {
    const criticalKeywords = ['lost money', 'critical', 'urgent', 'not working', 'broken', 'down'];
    const highKeywords = ['important', 'issue', 'problem', 'error', 'failed'];
    const lowKeywords = ['question', 'suggestion', 'feature request', 'enhancement'];

    const lowerMessage = messageText.toLowerCase();

    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { priority: 'critical' };
    }

    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { priority: 'high' };
    }

    if (lowKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { priority: 'low' };
    }

    return { priority: null };
  } catch (error) {
    return {
      priority: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-escalate ticket if not responded to within SLA
 */
export async function autoEscalateTicket(
  ticketId: string
): Promise<{ success: boolean; escalated: boolean; error?: string }> {
  try {
    const { ticket } = await getTicketById(ticketId);
    if (!ticket) {
      return { success: false, escalated: false, error: 'Ticket not found' };
    }

    const now = new Date();
    const created = new Date(ticket.created_at);
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    // Check if first response SLA is breached
    if (!ticket.first_response_at && hoursSinceCreation > ticket.sla_first_response_hours) {
      // Escalate priority
      let newPriority: Ticket['priority'] = ticket.priority;
      if (ticket.priority === 'low') newPriority = 'medium';
      else if (ticket.priority === 'medium') newPriority = 'high';
      else if (ticket.priority === 'high') newPriority = 'critical';

      if (newPriority !== ticket.priority) {
        await updateTicket(ticketId, { priority: newPriority }, 'system');

        await (supabase as any)
          .from('ticket_events_log')
          .insert({
            ticket_id: ticketId,
            event_type: 'auto_escalated',
            performed_by: null,
            metadata: {
              reason: 'SLA breach',
              old_priority: ticket.priority,
              new_priority: newPriority,
              hours_since_creation: hoursSinceCreation,
            },
          });

        return { success: true, escalated: true };
      }
    }

    return { success: true, escalated: false };
  } catch (error) {
    return {
      success: false,
      escalated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-close ticket if resolved and user inactive
 */
export async function autoCloseTicket(
  ticketId: string,
  daysInactive: number = 5
): Promise<{ success: boolean; closed: boolean; error?: string }> {
  try {
    const { ticket } = await getTicketById(ticketId);
    if (!ticket || ticket.status !== 'resolved') {
      return { success: true, closed: false };
    }

    // Get last message from user
    const { data: lastUserMessage } = await (supabase as any)
      .from('ticket_messages')
      .select('created_at')
      .eq('ticket_id', ticketId)
      .eq('sender_type', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastUserMessage) {
      return { success: true, closed: false };
    }

    const lastMessageDate = new Date(lastUserMessage.created_at);
    const now = new Date();
    const daysSinceLastMessage = (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastMessage >= daysInactive) {
      await updateTicket(ticketId, { status: 'closed' }, 'system');

      await (supabase as any)
        .from('ticket_events_log')
        .insert({
          ticket_id: ticketId,
          event_type: 'auto_closed',
          performed_by: null,
          metadata: {
            reason: 'User inactive',
            days_inactive: daysSinceLastMessage,
          },
        });

      return { success: true, closed: true };
    }

    return { success: true, closed: false };
  } catch (error) {
    return {
      success: false,
      closed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check SLA breaches
 */
export async function checkSLABreaches(): Promise<{
  breaches: Array<{ ticketId: string; breachType: string }>;
  error?: string;
}> {
  try {
    const now = new Date();
    const { data: tickets } = await (supabase as any)
      .from('tickets')
      .select('*')
      .in('status', ['open', 'pending']);

    const breaches: Array<{ ticketId: string; breachType: string }> = [];

    for (const ticket of tickets || []) {
      const created = new Date(ticket.created_at);
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      // Check first response SLA
      if (!ticket.first_response_at && hoursSinceCreation > ticket.sla_first_response_hours) {
        breaches.push({
          ticketId: ticket.id,
          breachType: 'first_response_sla',
        });

        // Log SLA breach
        await (supabase as any)
          .from('ticket_events_log')
          .insert({
            ticket_id: ticket.id,
            event_type: 'sla_breached',
            performed_by: null,
            metadata: {
              breach_type: 'first_response',
              hours_overdue: hoursSinceCreation - ticket.sla_first_response_hours,
            },
          });
      }

      // Check resolution SLA
      if (ticket.status !== 'resolved' && ticket.status !== 'closed' && hoursSinceCreation > ticket.sla_resolution_hours) {
        breaches.push({
          ticketId: ticket.id,
          breachType: 'resolution_sla',
        });
      }
    }

    return { breaches };
  } catch (error) {
    return {
      breaches: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

