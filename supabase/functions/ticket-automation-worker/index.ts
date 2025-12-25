/**
 * Ticket Automation Worker
 * 
 * Phase Admin E: Automated ticket workflows
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('ticket-automation-worker');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Starting ticket automation worker');

    // ============================================
    // 1. AUTO-ESCALATE TICKETS
    // ============================================
    logger.info('Checking for tickets to auto-escalate...');

    const { data: openTickets } = await supabase
      .from('tickets')
      .select('*')
      .in('status', ['open', 'pending']);

    let escalatedCount = 0;

    for (const ticket of openTickets || []) {
      const now = new Date();
      const created = new Date(ticket.created_at);
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      // Check if first response SLA is breached
      if (!ticket.first_response_at && hoursSinceCreation > ticket.sla_first_response_hours) {
        // Escalate priority
        let newPriority = ticket.priority;
        if (ticket.priority === 'low') newPriority = 'medium';
        else if (ticket.priority === 'medium') newPriority = 'high';
        else if (ticket.priority === 'high') newPriority = 'critical';

        if (newPriority !== ticket.priority) {
          await supabase
            .from('tickets')
            .update({ priority: newPriority })
            .eq('id', ticket.id);

          await supabase
            .from('ticket_events_log')
            .insert({
              ticket_id: ticket.id,
              event_type: 'auto_escalated',
              performed_by: null,
              metadata: {
                reason: 'SLA breach',
                old_priority: ticket.priority,
                new_priority: newPriority,
                hours_since_creation: hoursSinceCreation,
              },
            });

          escalatedCount++;
        }
      }
    }

    logger.info(`Auto-escalated ${escalatedCount} tickets`);

    // ============================================
    // 2. AUTO-CLOSE RESOLVED TICKETS
    // ============================================
    logger.info('Checking for tickets to auto-close...');

    const { data: resolvedTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'resolved');

    let closedCount = 0;
    const daysInactive = 5;

    for (const ticket of resolvedTickets || []) {
      // Get last message from user
      const { data: lastUserMessage } = await supabase
        .from('ticket_messages')
        .select('created_at')
        .eq('ticket_id', ticket.id)
        .eq('sender_type', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastUserMessage) continue;

      const lastMessageDate = new Date(lastUserMessage.created_at);
      const now = new Date();
      const daysSinceLastMessage = (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastMessage >= daysInactive) {
        await supabase
          .from('tickets')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
          })
          .eq('id', ticket.id);

        await supabase
          .from('ticket_events_log')
          .insert({
            ticket_id: ticket.id,
            event_type: 'auto_closed',
            performed_by: null,
            metadata: {
              reason: 'User inactive',
              days_inactive: daysSinceLastMessage,
            },
          });

        closedCount++;
      }
    }

    logger.info(`Auto-closed ${closedCount} tickets`);

    // ============================================
    // 3. CHECK SLA BREACHES
    // ============================================
    logger.info('Checking for SLA breaches...');

    const now = new Date();
    let breachCount = 0;

    for (const ticket of openTickets || []) {
      const created = new Date(ticket.created_at);
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      // Check first response SLA
      if (!ticket.first_response_at && hoursSinceCreation > ticket.sla_first_response_hours) {
        // Check if already logged
        const { data: existingBreach } = await supabase
          .from('ticket_events_log')
          .select('id')
          .eq('ticket_id', ticket.id)
          .eq('event_type', 'sla_breached')
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
          .single();

        if (!existingBreach) {
          await supabase
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

          breachCount++;
        }
      }
    }

    logger.info(`Found ${breachCount} new SLA breaches`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ticket automation completed',
        escalated: escalatedCount,
        closed: closedCount,
        sla_breaches: breachCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    logger.error('Error in ticket automation worker', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

