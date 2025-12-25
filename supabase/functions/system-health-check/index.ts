/**
 * System Health Check Edge Function
 * 
 * Phase X.14 - Checks health of all system services
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('system-health-check');

/**
 * Check service health
 */
async function checkServiceHealth(
  supabaseClient: ReturnType<typeof createClient>,
  serviceName: string
): Promise<{
  status: 'OK' | 'WARNING' | 'ERROR';
  last_run?: string;
  last_success?: string;
  error_message?: string;
  avg_response_time_ms?: number;
}> {
  // Get latest status from database
  const { data: status } = await supabaseClient
    .from('system_status' as any)
    .select('*')
    .eq('service_name', serviceName)
    .maybeSingle();

  if (!status) {
    return {
      status: 'WARNING',
      error_message: 'Service status not found',
    };
  }

  // Check if service is stale (no update in last 10 minutes)
  const lastUpdate = status.updated_at ? new Date(status.updated_at).getTime() : 0;
  const now = Date.now();
  const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);

  if (minutesSinceUpdate > 10 && status.status === 'OK') {
    return {
      status: 'WARNING',
      last_run: status.last_run,
      last_success: status.last_success,
      error_message: 'Service status is stale',
    };
  }

  return {
    status: status.status,
    last_run: status.last_run,
    last_success: status.last_success,
    error_message: status.error_message,
    avg_response_time_ms: status.avg_response_time_ms,
  };
}

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

    if (req.method === 'GET') {
      // Check all services
      const services = [
        'AIEngine',
        'SignalStream',
        'AutoTrader',
        'WebSocket',
        'DatabaseWrites',
        'MarketScraper',
        'PortfolioSync',
        'TradingViewWebhook',
        'TelegramBot',
      ];

      const healthStatus: Record<string, any> = {};

      for (const service of services) {
        try {
          const health = await checkServiceHealth(supabaseClient, service);
          healthStatus[service] = health.status;
        } catch (error) {
          logger.error(`Error checking ${service}:`, error);
          healthStatus[service] = 'ERROR';
        }
      }

      // Get overall system health
      const { data: summary } = await supabaseClient
        .rpc('get_system_health_summary' as any);

      return new Response(
        JSON.stringify({
          success: true,
          services: healthStatus,
          summary: summary || {},
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

