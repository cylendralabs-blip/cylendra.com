/**
 * Position Monitor Worker
 * 
 * Scheduled Edge Function that monitors open positions in real-time
 * Updates PnL, monitors TP/SL/DCA, syncs orders, applies auto-close rules
 * 
 * Phase 6: Position Manager
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { POSITION_MONITOR_CONFIG } from './config.ts';
import {
  fetchOpenPositions,
  processPosition,
  logPositionEvent
} from './positionProcessor.ts';

interface WorkerResult {
  success: boolean;
  message: string;
  positionsProcessed: number;
  positionsUpdated: number;
  errors: number;
  executionTimeMs: number;
}

/**
 * Main worker function
 */
async function runPositionMonitor(): Promise<WorkerResult> {
  const startTime = Date.now();
  const result: WorkerResult = {
    success: true,
    message: 'Position monitor completed successfully',
    positionsProcessed: 0,
    positionsUpdated: 0,
    errors: 0,
    executionTimeMs: 0
  };
  
  try {
    const supabaseClient = getSupabaseClient();
    
    // 1. Fetch all open positions
    console.log('📊 Fetching open positions...');
    const positions = await fetchOpenPositions(supabaseClient);
    
    if (positions.length === 0) {
      result.message = 'No open positions to monitor';
      result.executionTimeMs = Date.now() - startTime;
      return result;
    }
    
    result.positionsProcessed = positions.length;
    console.log(`✅ Found ${positions.length} open positions`);
    
    // 2. Process each position (limit to MAX_POSITIONS_PER_RUN)
    const positionsToProcess = positions.slice(0, POSITION_MONITOR_CONFIG.MAX_POSITIONS_PER_RUN);
    
    for (const position of positionsToProcess) {
      try {
        console.log(`🔍 Processing position ${position.id} (${position.symbol})...`);
        
        // Process position: update PnL, check TP/SL, monitor DCA
        const processResult = await processPosition(supabaseClient, position);
        
        if (processResult.success) {
          result.positionsUpdated++;
          
          // Log events
          if (processResult.actions.length > 0) {
            await logPositionEvent(
              supabaseClient,
              position.id,
              position.userId,
              'POSITION_UPDATED',
              {
                actions: processResult.actions,
                updates: processResult.updates
              }
            );
          }
        } else {
          result.errors++;
          console.error(`❌ Error processing position ${position.id}:`, processResult.errors);
          
          // Log error
          await logPositionEvent(
            supabaseClient,
            position.id,
            position.userId,
            'POSITION_ERROR',
            {
              errors: processResult.errors
            }
          );
        }
        
        // Small delay between positions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        result.errors++;
        console.error(`❌ Error processing position ${position.id}:`, error);
        
        // Log error
        try {
          await logPositionEvent(
            supabaseClient,
            position.id,
            position.userId,
            'POSITION_ERROR',
            {
              error: error.message || 'Unknown error'
            }
          );
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
      }
    }
    
    result.executionTimeMs = Date.now() - startTime;
    result.message = `Processed ${result.positionsProcessed} positions, updated ${result.positionsUpdated}, errors: ${result.errors}`;
    
    console.log(`✅ Position monitor completed: ${result.message}`);
    
    return result;
    
  } catch (error: any) {
    result.success = false;
    result.errors++;
    result.message = `Position monitor failed: ${error.message}`;
    result.executionTimeMs = Date.now() - startTime;
    
    console.error('❌ Position monitor error:', error);
    return result;
  }
}

/**
 * HTTP Handler
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 Position Monitor Worker started');
    
    // Run the worker
    const result = await runPositionMonitor();
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('❌ Position Monitor Worker error:', error);
    
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

