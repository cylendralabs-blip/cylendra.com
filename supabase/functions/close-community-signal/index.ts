/**
 * Close Community Signal Edge Function
 * 
 * Phase X.12 - Community Signals System
 * 
 * Handles closing community signals and updating stats
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('close-community-signal');

/**
 * Calculate LP points based on result
 */
function getLPPointsForResult(result: 'WIN' | 'LOSS' | 'BREAKEVEN'): number {
  switch (result) {
    case 'WIN':
      return 10;
    case 'LOSS':
      return -5;
    case 'BREAKEVEN':
      return 0;
    default:
      return 0;
  }
}

/**
 * Update trader stats after closing signal
 */
async function updateTraderStats(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  result: 'WIN' | 'LOSS' | 'BREAKEVEN',
  pnlPercentage: number
): Promise<void> {
  // Get current stats
  const { data: currentStats } = await supabaseClient
    .from('community_trader_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const stats = currentStats || {
    user_id: userId,
    total_signals: 0,
    closed_signals: 0,
    win_count: 0,
    loss_count: 0,
    breakeven_count: 0,
    total_return: 0,
    lp_points: 0,
  };

  // Update counts
  const newStats = {
    ...stats,
    closed_signals: (stats.closed_signals || 0) + 1,
    win_count: result === 'WIN' ? (stats.win_count || 0) + 1 : (stats.win_count || 0),
    loss_count: result === 'LOSS' ? (stats.loss_count || 0) + 1 : (stats.loss_count || 0),
    breakeven_count: result === 'BREAKEVEN' ? (stats.breakeven_count || 0) + 1 : (stats.breakeven_count || 0),
    total_return: (stats.total_return || 0) + pnlPercentage,
  };

  // Calculate win rate
  const totalClosed = newStats.closed_signals;
  const winRate = totalClosed > 0
    ? Math.round((newStats.win_count / totalClosed) * 100 * 10) / 10
    : 0;

  // Calculate avg return
  const avgReturn = totalClosed > 0
    ? Math.round((newStats.total_return / totalClosed) * 100) / 100
    : 0;

  // Calculate reputation (simplified)
  let reputation = 0;
  reputation += (winRate / 100) * 400;
  if (avgReturn > 0) {
    reputation += Math.min(300, avgReturn * 10);
  }
  reputation += Math.min(200, (stats.total_signals || 0) * 2);
  reputation = Math.max(0, Math.min(1000, Math.round(reputation)));

  // Calculate rank
  let rank = 'Newbie';
  if (reputation >= 900 && winRate >= 70 && (stats.total_signals || 0) >= 50 && avgReturn > 2) {
    rank = 'Legend';
  } else if (reputation >= 750 && winRate >= 65 && (stats.total_signals || 0) >= 30) {
    rank = 'Master';
  } else if (reputation >= 600 && winRate >= 60 && (stats.total_signals || 0) >= 20) {
    rank = 'Elite';
  } else if (reputation >= 400 && winRate >= 55 && (stats.total_signals || 0) >= 10) {
    rank = 'Pro';
  } else if (reputation >= 200 && (stats.total_signals || 0) >= 5) {
    rank = 'Skilled';
  }

  // Calculate weight
  let weight = (reputation / 1000) * 50;
  weight += (winRate / 100) * 30;
  const rankBonus: Record<string, number> = {
    Newbie: 0,
    Skilled: 5,
    Pro: 10,
    Elite: 15,
    Master: 18,
    Legend: 20,
  };
  weight += rankBonus[rank] || 0;
  weight = Math.max(0, Math.min(100, Math.round(weight * 10) / 10));

  // Update LP points
  const lpPointsChange = getLPPointsForResult(result);
  const newLP = Math.max(0, (stats.lp_points || 0) + lpPointsChange);

  // Upsert stats
  await supabaseClient
    .from('community_trader_stats')
    .upsert({
      user_id: userId,
      closed_signals: newStats.closed_signals,
      win_count: newStats.win_count,
      loss_count: newStats.loss_count,
      breakeven_count: newStats.breakeven_count,
      win_rate: winRate,
      avg_return: avgReturn,
      total_return: newStats.total_return,
      reputation_score: reputation,
      rank,
      weight,
      lp_points: newLP,
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

    if (req.method === 'POST') {
      const body = await req.json();
      const { signal_id, result, pnl_percentage } = body;

      if (!signal_id || !result || pnl_percentage === undefined) {
        return new Response(
          JSON.stringify({ error: 'signal_id, result, and pnl_percentage required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!['WIN', 'LOSS', 'BREAKEVEN'].includes(result)) {
        return new Response(
          JSON.stringify({ error: 'result must be WIN, LOSS, or BREAKEVEN' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verify signal belongs to user
      const { data: signal, error: signalError } = await supabaseClient
        .from('community_signals')
        .select('user_id, status')
        .eq('id', signal_id)
        .maybeSingle();

      if (signalError || !signal) {
        return new Response(
          JSON.stringify({ error: 'Signal not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (signal.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Signal does not belong to user' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (signal.status === 'CLOSED') {
        return new Response(
          JSON.stringify({ error: 'Signal already closed' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update signal
      const { error: updateError } = await supabaseClient
        .from('community_signals')
        .update({
          status: 'CLOSED',
          result,
          pnl_percentage,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', signal_id);

      if (updateError) {
        logger.error('Error updating signal:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to close signal' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update trader stats
      await updateTraderStats(supabaseClient, user.id, result, pnl_percentage);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Signal closed successfully',
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

