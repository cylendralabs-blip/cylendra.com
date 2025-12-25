/**
 * Affiliate Leaderboard Edge Function
 * 
 * Returns leaderboard rankings
 * 
 * Phase 11A: Influence Economy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'current'; // current, last_month
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const periodType = url.searchParams.get('period_type') || 'monthly';

    let periodDate: string;

    if (period === 'current') {
      const now = new Date();
      periodDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      periodDate = period;
    }

    // Get leaderboard snapshot
    const { data: leaderboard, error: leaderboardError } = await supabaseClient
      .from('leaderboard_snapshots')
      .select(`
        *,
        affiliates!inner (
          id,
          affiliate_key,
          referral_code,
          tier,
          user_id
        )
      `)
      .eq('period', periodDate)
      .eq('period_type', periodType)
      .order('rank', { ascending: true })
      .limit(limit);

    if (leaderboardError) {
      console.error('Leaderboard error:', leaderboardError);
      // If no snapshot exists, calculate from current data
      return await getCurrentLeaderboard(supabaseClient, limit);
    }

    // Format response
    const formatted = leaderboard?.map((entry: any) => ({
      rank: entry.rank,
      affiliate_id: entry.affiliate_id,
      affiliate_key: entry.affiliates?.affiliate_key,
      referral_code: entry.affiliates?.referral_code,
      tier: entry.affiliates?.tier,
      influence_weight: parseFloat(entry.influence_weight?.toString() || '0'),
      total_referrals: entry.total_referrals,
      active_referrals: entry.active_referrals,
      total_earnings_usd: parseFloat(entry.total_earnings_usd?.toString() || '0'),
      rewards: entry.rewards,
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        period: periodDate,
        period_type: periodType,
        leaderboard: formatted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Get current leaderboard from live data
 */
async function getCurrentLeaderboard(supabaseClient: any, limit: number) {
  const { data: affiliates, error } = await supabaseClient
    .from('affiliates')
    .select('*')
    .eq('status', 'active')
    .order('influence_weight', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const leaderboard = affiliates?.map((affiliate: any, index: number) => ({
    rank: index + 1,
    affiliate_id: affiliate.id,
    affiliate_key: affiliate.affiliate_key,
    referral_code: affiliate.referral_code,
    tier: affiliate.tier,
    influence_weight: parseFloat(affiliate.influence_weight?.toString() || '0'),
    total_referrals: affiliate.total_referrals,
    active_referrals: affiliate.active_referrals,
    total_earnings_usd: parseFloat(affiliate.total_earnings_usd?.toString() || '0'),
  })) || [];

  return new Response(
    JSON.stringify({
      success: true,
      period: 'current',
      period_type: 'monthly',
      leaderboard,
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}

