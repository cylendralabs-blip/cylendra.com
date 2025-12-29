/**
 * Affiliate Dashboard Edge Function
 * 
 * Returns comprehensive dashboard data for affiliate
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get affiliate account
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If affiliate doesn't exist, return success with null affiliate
    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({
          success: true,
          affiliate: null,
          stats: null,
          referrals: [],
          rewards: [],
          cpuUnits: [],
          missions: [],
          missionLogs: [],
          campaigns: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get referrals
    const { data: referrals } = await supabaseClient
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get recent rewards
    const { data: rewards } = await supabaseClient
      .from('affiliate_rewards')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get LP balance
    const { data: lpTransactions } = await supabaseClient
      .from('lp_transactions')
      .select('lp_amount, transaction_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const lpBalance = lpTransactions?.reduce((balance, tx) => {
      if (tx.transaction_type === 'earn' || tx.transaction_type === 'bonus') {
        return balance + tx.lp_amount;
      } else {
        return balance - tx.lp_amount;
      }
    }, 0) || 0;

    // Get CPU units
    const { data: cpuUnits } = await supabaseClient
      .from('cpu_units')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('allocation_period', { ascending: false });

    const totalCPU = cpuUnits?.reduce((sum, unit) => sum + parseFloat(unit.units.toString()), 0) || 0;
    const totalCPUValue = cpuUnits?.reduce((sum, unit) => sum + (parseFloat(unit.estimated_value_usd?.toString() || '0')), 0) || 0;

    const { data: tokenRewards } = await supabaseClient
      .from('token_rewards')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const tokenTotals = (tokenRewards || []).reduce(
      (totals, reward) => {
        totals.total += parseFloat(reward.token_amount?.toString() || '0');
        if (reward.status === 'pending') totals.pending += parseFloat(reward.token_amount?.toString() || '0');
        if (reward.status === 'allocated') totals.allocated += parseFloat(reward.token_amount?.toString() || '0');
        if (reward.status === 'vested') totals.vested += parseFloat(reward.token_amount?.toString() || '0');
        if (reward.status === 'claimed') totals.claimed += parseFloat(reward.token_amount?.toString() || '0');
        return totals;
      },
      {
        total: 0,
        pending: 0,
        allocated: 0,
        vested: 0,
        claimed: 0,
      }
    );

    // Get active missions
    const { data: missions } = await supabaseClient
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .limit(10);

    // Get mission logs
    const { data: missionLogs } = await supabaseClient
      .from('mission_logs')
      .select('*, missions(*)')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get campaigns
    const { data: campaigns } = await supabaseClient
      .from('affiliate_campaigns')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    // Calculate stats
    const stats = {
      totalReferrals: affiliate.total_referrals || 0,
      activeReferrals: affiliate.active_referrals || 0,
      totalEarnings: parseFloat(affiliate.total_earnings_usd?.toString() || '0'),
      pendingEarnings: parseFloat(affiliate.pending_earnings_usd?.toString() || '0'),
      totalLP: lpBalance,
      totalCPU: totalCPU,
      totalCPUValue: totalCPUValue,
      totalTokens: tokenTotals.total,
      pendingTokens: tokenTotals.pending + tokenTotals.allocated,
      influenceWeight: parseFloat(affiliate.influence_weight?.toString() || '0'),
      tier: affiliate.tier,
    };

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: affiliate.id,
          affiliate_key: affiliate.affiliate_key,
          referral_code: affiliate.referral_code,
          status: affiliate.status,
          tier: affiliate.tier,
        },
        stats,
        referrals: referrals || [],
        rewards: rewards || [],
        cpuUnits: cpuUnits || [],
        tokenRewards: tokenRewards || [],
        missions: missions || [],
        missionLogs: missionLogs || [],
        campaigns: campaigns || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Affiliate dashboard error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

