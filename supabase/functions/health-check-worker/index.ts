/**
 * Health Check Worker
 * 
 * Scheduled Edge Function that monitors system health
 * Checks workers, exchanges, database
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 7
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { runHealthCheck } from './healthCheck.ts';

/**
 * Main handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = getSupabaseClient();
    
    console.log('🏥 Health Check Worker started');
    
    const result = await runHealthCheck(supabaseClient);
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('❌ Health Check Worker error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error',
        error: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

