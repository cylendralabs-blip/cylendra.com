/**
 * Portfolio Sync Worker
 * 
 * Scheduled Edge Function that syncs portfolio data from exchanges
 * Calculates equity, exposure, allocation
 * Stores snapshots in database
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 2
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/utils.ts';
import { PORTFOLIO_SYNC_CONFIG } from './config.ts';
import { syncUserPortfolio } from './portfolioSync.ts';

interface SyncResult {
  success: boolean;
  usersProcessed: number;
  usersSynced: number;
  usersFailed: number;
  errors: string[];
  executionTimeMs: number;
}

/**
 * Main sync function
 */
async function runPortfolioSync(): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: true,
    usersProcessed: 0,
    usersSynced: 0,
    usersFailed: 0,
    errors: [],
    executionTimeMs: 0
  };
  
  try {
    const supabaseClient = getSupabaseClient();
    
    // Fetch active users (users with active API keys)
    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('api_keys')
      .select('user_id')
      .eq('is_active', true)
      .limit(PORTFOLIO_SYNC_CONFIG.MAX_USERS_PER_RUN);
    
    if (usersError) {
      throw new Error(`Failed to fetch active users: ${usersError.message}`);
    }
    
    if (!activeUsers || activeUsers.length === 0) {
      result.executionTimeMs = Date.now() - startTime;
      return result;
    }
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];
    result.usersProcessed = uniqueUserIds.length;
    
    console.log(`📊 Starting portfolio sync for ${uniqueUserIds.length} users...`);
    
    // Sync portfolio for each user
    for (const userId of uniqueUserIds) {
      try {
        console.log(`🔄 Syncing portfolio for user ${userId}...`);
        
        const syncResults = await syncUserPortfolio(supabaseClient, userId);
        
        // Count successes and failures
        const successCount = syncResults.filter(r => r.success).length;
        const failCount = syncResults.filter(r => !r.success).length;
        
        if (successCount > 0) {
          result.usersSynced++;
          console.log(`✅ Successfully synced portfolio for user ${userId}`);
        }
        
        if (failCount > 0) {
          result.usersFailed++;
          syncResults.forEach(r => {
            if (!r.success) {
              result.errors.push(`User ${userId}: ${r.errors.join(', ')}`);
            }
          });
          console.error(`❌ Failed to sync portfolio for user ${userId}`);
        }
        
        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        result.usersFailed++;
        result.errors.push(`User ${userId}: ${error.message || 'Unknown error'}`);
        console.error(`❌ Error syncing portfolio for user ${userId}:`, error);
      }
    }
    
    result.executionTimeMs = Date.now() - startTime;
    console.log(`✅ Portfolio sync completed: ${result.usersSynced} synced, ${result.usersFailed} failed in ${result.executionTimeMs}ms`);
    
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message || 'Unknown error');
    result.executionTimeMs = Date.now() - startTime;
    console.error('❌ Portfolio sync error:', error);
  }
  
  return result;
}

/**
 * Edge Function Handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('🚀 Portfolio Sync Worker started');
    
    const result = await runPortfolioSync();
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('❌ Portfolio Sync Worker error:', error);
    
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

