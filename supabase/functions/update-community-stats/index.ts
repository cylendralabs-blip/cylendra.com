/**
 * Update Community Stats Edge Function
 * 
 * Phase X.12 - Community Signals System
 * 
 * Updates trader statistics (can be called periodically or after events)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('update-community-stats');

/**
 * Calculate and update stats for a user
 */
async function updateUserStats(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  // Get all closed signals for user
  const { data: closedSignals } = await supabaseClient
    .from('community_signals')
    .select('result, pnl_percentage')
    .eq('user_id', userId)
    .eq('status', 'CLOSED');

  const totalSignals = closedSignals?.length || 0;
  const winCount = closedSignals?.filter(s => s.result === 'WIN').length || 0;
  const lossCount = closedSignals?.filter(s => s.result === 'LOSS').length || 0;
  const breakevenCount = closedSignals?.filter(s => s.result === 'BREAKEVEN').length || 0;

  const totalReturn = closedSignals?.reduce((sum, s) => sum + (s.pnl_percentage || 0), 0) || 0;
  const winRate = totalSignals > 0
    ? Math.round((winCount / totalSignals) * 100 * 10) / 10
    : 0;
  const avgReturn = totalSignals > 0
    ? Math.round((totalReturn / totalSignals) * 100) / 100
    : 0;

  // Get total signals count
  const { count: totalSignalsCount } = await supabaseClient
    .from('community_signals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get total votes received
  const { data: userSignals } = await supabaseClient
    .from('community_signals')
    .select('id, upvotes, total_votes')
    .eq('user_id', userId);

  const totalVotes = userSignals?.reduce((sum, s) => sum + (s.total_votes || 0), 0) || 0;
  const totalUpvotes = userSignals?.reduce((sum, s) => sum + (s.upvotes || 0), 0) || 0;

  // Calculate reputation
  let reputation = 0;
  reputation += (winRate / 100) * 400;
  if (avgReturn > 0) {
    reputation += Math.min(300, avgReturn * 10);
  }
  reputation += Math.min(200, (totalSignalsCount || 0) * 2);
  const voteRatio = totalVotes > 0 ? totalUpvotes / totalVotes : 0;
  reputation += voteRatio * 100;
  reputation = Math.max(0, Math.min(1000, Math.round(reputation)));

  // Calculate rank
  let rank = 'Newbie';
  if (reputation >= 900 && winRate >= 70 && (totalSignalsCount || 0) >= 50 && avgReturn > 2) {
    rank = 'Legend';
  } else if (reputation >= 750 && winRate >= 65 && (totalSignalsCount || 0) >= 30) {
    rank = 'Master';
  } else if (reputation >= 600 && winRate >= 60 && (totalSignalsCount || 0) >= 20) {
    rank = 'Elite';
  } else if (reputation >= 400 && winRate >= 55 && (totalSignalsCount || 0) >= 10) {
    rank = 'Pro';
  } else if (reputation >= 200 && (totalSignalsCount || 0) >= 5) {
    rank = 'Skilled';
  }

  // Check if user is verified influencer
  const { data: influencer } = await supabaseClient
    .from('verified_influencers')
    .select('level')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

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

  if (influencer) {
    const influencerBonus: Record<string, number> = {
      Bronze: 5,
      Silver: 10,
      Gold: 15,
      Elite: 20,
    };
    weight += influencerBonus[influencer.level] || 0;
  }

  weight = Math.max(0, Math.min(100, Math.round(weight * 10) / 10));

  // Get follower count
  const { count: followersCount } = await supabaseClient
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Get following count
  const { count: followingCount } = await supabaseClient
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  // Get current LP points (don't recalculate, just preserve)
  const { data: currentStats } = await supabaseClient
    .from('community_trader_stats')
    .select('lp_points')
    .eq('user_id', userId)
    .maybeSingle();

  // Upsert stats
  await supabaseClient
    .from('community_trader_stats')
    .upsert({
      user_id: userId,
      total_signals: totalSignalsCount || 0,
      closed_signals: totalSignals,
      win_count: winCount,
      loss_count: lossCount,
      breakeven_count: breakevenCount,
      win_rate: winRate,
      avg_return: avgReturn,
      total_return: totalReturn,
      reputation_score: reputation,
      rank,
      weight,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      verified: !!influencer,
      influencer_level: influencer?.level || null,
      lp_points: currentStats?.lp_points || 0, // Preserve LP points
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

    if (req.method === 'POST') {
      const body = await req.json();
      const { user_id } = body;

      if (user_id) {
        // Update specific user
        await updateUserStats(supabaseClient, user_id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Stats updated for user',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Update all users (batch operation)
        const { data: allUsers } = await supabaseClient
          .from('community_trader_stats')
          .select('user_id')
          .limit(100); // Limit to prevent timeout

        const userIds = allUsers?.map(u => u.user_id) || [];

        for (const userId of userIds) {
          try {
            await updateUserStats(supabaseClient, userId);
          } catch (error) {
            logger.error(`Error updating stats for user ${userId}:`, error);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Stats updated for ${userIds.length} users`,
            updated_count: userIds.length,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
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

