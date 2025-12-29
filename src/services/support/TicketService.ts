/**
 * Ticket Service
 * 
 * Phase Admin E: Support ticketing system
 */

import { supabase } from '@/integrations/supabase/client';
import { notifyTicketCreated, notifyAdminNewTicket } from './TicketNotificationService';

export interface Ticket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  category: 'api_issue' | 'trading_issue' | 'signals' | 'billing' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assigned_admin_id: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_first_response_hours: number;
  sla_resolution_hours: number;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  message_text: string;
  attachments: Array<{ url: string; filename: string; file_type: string }>;
  is_internal: boolean;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  performed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Create a new ticket
 */
export async function createTicket(
  userId: string,
  subject: string,
  category: Ticket['category'],
  priority: Ticket['priority'],
  initialMessage: string,
  attachments?: Array<{ url: string; filename: string; file_type: string }>
): Promise<{ ticket: Ticket | null; error?: string }> {
  try {
    // Create ticket
    const { data: ticket, error: ticketError } = await (supabase as any)
      .from('tickets')
      .insert({
        user_id: userId,
        subject,
        category,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      return { ticket: null, error: ticketError?.message || 'Failed to create ticket' };
    }

    // Create first message
    const { error: messageError } = await (supabase as any)
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_id: userId,
        message_text: initialMessage,
        attachments: attachments || [],
      });

    if (messageError) {
      // Rollback ticket creation
      await (supabase as any).from('tickets').delete().eq('id', ticket.id);
      return { ticket: null, error: messageError.message };
    }

    // Log ticket creation event
    await (supabase as any)
      .from('ticket_events_log')
      .insert({
        ticket_id: ticket.id,
        event_type: 'ticket_created',
        performed_by: userId,
        metadata: { category, priority },
      });

    // Send notifications
    await notifyTicketCreated(ticket.id, userId);
    await notifyAdminNewTicket(ticket.id);

    return { ticket };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return {
      ticket: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get tickets for a user
 */
export async function getUserTickets(
  userId: string,
  options?: {
    status?: Ticket['status'];
    limit?: number;
    offset?: number;
  }
): Promise<{ tickets: Ticket[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { tickets: [], error: error.message };
    }

    return { tickets: data || [] };
  } catch (error) {
    return {
      tickets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all tickets (admin only)
 */
export async function getAllTickets(
  options?: {
    status?: Ticket['status'];
    category?: Ticket['category'];
    priority?: Ticket['priority'];
    assignedAdminId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ tickets: Ticket[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options?.assignedAdminId) {
      query = query.eq('assigned_admin_id', options.assignedAdminId);
    }

    if (options?.search) {
      query = query.or(`ticket_number.ilike.%${options.search}%,subject.ilike.%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { tickets: [], error: error.message };
    }

    return { tickets: data || [] };
  } catch (error) {
    return {
      tickets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(
  ticketId: string
): Promise<{ ticket: Ticket | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      return { ticket: null, error: error.message };
    }

    return { ticket: data };
  } catch (error) {
    return {
      ticket: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update ticket
 */
export async function updateTicket(
  ticketId: string,
  updates: Partial<{
    status: Ticket['status'];
    priority: Ticket['priority'];
    category: Ticket['category'];
    assigned_admin_id: string | null;
  }>,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldTicket = await getTicketById(ticketId);
    if (!oldTicket.ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    const updateData: any = { ...updates };

    // Handle status changes
    if (updates.status === 'resolved' && oldTicket.ticket.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      // Send notification
      await notifyTicketResolved(ticketId, oldTicket.ticket.user_id);
    }

    if (updates.status === 'closed' && oldTicket.ticket.status !== 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    if (updates.status === 'open' && oldTicket.ticket.status !== 'open') {
      // Reopening ticket
      updateData.resolved_at = null;
      updateData.closed_at = null;
    }

    const { error } = await (supabase as any)
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log events
    const events: any[] = [];

    if (updates.status && updates.status !== oldTicket.ticket.status) {
      if (updates.status === 'open' && oldTicket.ticket.status !== 'open') {
        events.push({
          ticket_id: ticketId,
          event_type: 'ticket_reopened',
          performed_by: adminId,
          metadata: { previous_status: oldTicket.ticket.status },
        });
      } else {
        events.push({
          ticket_id: ticketId,
          event_type: 'status_changed',
          performed_by: adminId,
          metadata: { old_status: oldTicket.ticket.status, new_status: updates.status },
        });
      }
    }

    if (updates.priority && updates.priority !== oldTicket.ticket.priority) {
      events.push({
        ticket_id: ticketId,
        event_type: 'priority_changed',
        performed_by: adminId,
        metadata: { old_priority: oldTicket.ticket.priority, new_priority: updates.priority },
      });
    }

    if (updates.category && updates.category !== oldTicket.ticket.category) {
      events.push({
        ticket_id: ticketId,
        event_type: 'category_changed',
        performed_by: adminId,
        metadata: { old_category: oldTicket.ticket.category, new_category: updates.category },
      });
    }

    if (updates.assigned_admin_id !== undefined && updates.assigned_admin_id !== oldTicket.ticket.assigned_admin_id) {
      if (updates.assigned_admin_id) {
        events.push({
          ticket_id: ticketId,
          event_type: 'ticket_assigned',
          performed_by: adminId,
          metadata: { assigned_to: updates.assigned_admin_id },
        });
      } else {
        events.push({
          ticket_id: ticketId,
          event_type: 'ticket_unassigned',
          performed_by: adminId,
          metadata: {},
        });
      }
    }

    if (events.length > 0) {
      await (supabase as any).from('ticket_events_log').insert(events);
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
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: string,
  senderId: string,
  senderType: 'user' | 'admin',
  messageText: string,
  attachments?: Array<{ url: string; filename: string; file_type: string }>,
  isInternal: boolean = false
): Promise<{ message: TicketMessage | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: senderType,
        sender_id: senderId,
        message_text: messageText,
        attachments: attachments || [],
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) {
      return { message: null, error: error.message };
    }

    // Send notifications
    if (senderType === 'admin' && !isInternal) {
      // Get ticket to get user_id
      const { ticket } = await getTicketById(ticketId);
      if (ticket) {
        await notifyAdminReplied(ticketId, ticket.user_id);
      }
    }

    return { message: data };
  } catch (error) {
    return {
      message: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get messages for a ticket
 */
export async function getTicketMessages(
  ticketId: string,
  includeInternal: boolean = false
): Promise<{ messages: TicketMessage[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!includeInternal) {
      query = query.eq('is_internal', false);
    }

    const { data, error } = await query;

    if (error) {
      return { messages: [], error: error.message };
    }

    return { messages: data || [] };
  } catch (error) {
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

