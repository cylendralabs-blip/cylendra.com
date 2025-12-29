/**
 * Publish Community Signal Edge Function
 * 
 * Phase X.12 - Community Signals System
 * 
 * Handles publishing new community signals
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';
import { checkFeatureAccess } from '../_shared/planGuard.ts';

const logger = createLogger('publish-community-signal');

/**
 * Check daily signal limit for user
 */
async function checkDailySignalLimit(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Get user plan to determine limit
  const { data: userPlan } = await supabaseClient
    .from('user_plans')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  let planCode = 'FREE';
  if (userPlan) {
    const { data: plan } = await supabaseClient
      .from('plans')
      .select('code, limits')
      .eq('id', userPlan.plan_id)
      .maybeSingle();
    
    if (plan) {
      planCode = plan.code;
    }
  }

  // Define limits per plan (signals per day)
  const limits: Record<string, number> = {
    FREE: 3,
    BASIC: 10,
    PREMIUM: 50,
    PRO: 200,
    VIP: 999,
  };

  const limit = limits[planCode] || 3;

  // Count signals today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStart = today.toISOString();

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStart = tomorrow.toISOString();

  const { count } = await supabaseClient
    .from('community_signals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart)
    .lt('created_at', tomorrowStart);

  const remaining = Math.max(0, limit - (count || 0));

  return {
    allowed: remaining > 0,
    remaining,
    limit,
  };
}

/**
 * Update user stats after publishing signal
 */
async function updateUserStatsAfterPublish(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  // Get current stats
  const { data: stats } = await supabaseClient
    .from('community_trader_stats')
    .select('total_signals, lp_points')
    .eq('user_id', userId)
    .maybeSingle();

  const currentTotal = stats?.total_signals || 0;
  const currentLP = stats?.lp_points || 0;

  // Update stats
  await supabaseClient
    .from('community_trader_stats')
    .upsert({
      user_id: userId,
      total_signals: currentTotal + 1,
      lp_points: currentLP + 2, // +2 LP for publishing signal
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
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
    const user = await getUserFromRequest(req, supabaseClient);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Phase X.12: Check feature access (community signals)
    const featureCheck = await checkFeatureAccess(
      req,
      supabaseClient,
      'signals.web_basic', // Basic signal access
      'Community Signals'
    );
    if (!featureCheck.allowed) {
      return featureCheck.response!;
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const {
        symbol,
        timeframe,
        side,
        entry_price,
        stop_loss,
        take_profit,
        confidence,
        analysis_text,
        source = 'manual',
        ai_assisted = false,
        attachments,
      } = body;

      // Validation
      if (!symbol || !timeframe || !side) {
        return new Response(
          JSON.stringify({ error: 'symbol, timeframe, and side are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!['BUY', 'SELL'].includes(side)) {
        return new Response(
          JSON.stringify({ error: 'side must be BUY or SELL' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check daily limit
      const limitCheck = await checkDailySignalLimit(supabaseClient, user.id);
      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Daily signal limit reached',
            limit: limitCheck.limit,
            remaining: limitCheck.remaining,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Create signal
      const { data: signal, error: insertError } = await supabaseClient
        .from('community_signals')
        .insert({
          user_id: user.id,
          symbol,
          timeframe,
          side,
          entry_price: entry_price || null,
          stop_loss: stop_loss || null,
          take_profit: take_profit || null,
          confidence: confidence || null,
          analysis_text: analysis_text || null,
          source,
          ai_assisted,
          attachments: attachments || null,
          status: 'OPEN',
          upvotes: 0,
          downvotes: 0,
          total_votes: 0,
          views: 0,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating signal:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create signal' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update user stats
      await updateUserStatsAfterPublish(supabaseClient, user.id);

      return new Response(
        JSON.stringify({
          success: true,
          signal,
          remaining_daily_signals: limitCheck.remaining - 1,
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

