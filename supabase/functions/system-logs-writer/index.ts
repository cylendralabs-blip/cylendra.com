/**
 * System Logs Writer Edge Function
 * 
 * Phase X.14 - Centralized logging for all system components
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('system-logs-writer');

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = getSupabaseClient();

    if (req.method === 'POST') {
      const body = await req.json();
      const { level, source, message, metadata, stack_trace, user_id } = body;

      if (!level || !source || !message) {
        return new Response(
          JSON.stringify({ error: 'level, source, and message are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!['INFO', 'WARN', 'ERROR', 'CRITICAL'].includes(level)) {
        return new Response(
          JSON.stringify({ error: 'level must be INFO, WARN, ERROR, or CRITICAL' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Insert log
      const { data, error } = await supabaseClient
        .from('system_logs' as any)
        .insert({
          level,
          source,
          message,
          metadata: metadata || null,
          stack_trace: stack_trace || null,
          user_id: user_id || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error writing log:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to write log' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update service status if ERROR or CRITICAL
      if (level === 'ERROR' || level === 'CRITICAL') {
        await supabaseClient
          .from('system_status' as any)
          .upsert({
            service_name: source,
            status: 'ERROR',
            error_message: message,
            error_count: 1,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'service_name',
          });

        // Send Telegram alert for critical errors
        if (level === 'CRITICAL' || (level === 'ERROR' && source !== 'SystemTelegramAlerts')) {
          try {
            await supabaseClient.functions.invoke('system-telegram-alerts', {
              body: {
                level: level as 'ERROR' | 'CRITICAL',
                service_name: source,
                message,
                details: metadata,
              },
            });
          } catch (telegramError) {
            logger.error('Failed to send Telegram alert:', telegramError);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          log: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

