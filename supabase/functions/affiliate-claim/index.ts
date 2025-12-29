/**
 * Affiliate Claim Edge Function
 * 
 * Handles claiming of rewards (cash, LP, CPU, tokens)
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

    const { claimType, amount, rewardIds } = await req.json();

    if (!claimType || !['cash', 'lp', 'cpu', 'tokens'].includes(claimType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid claim type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get affiliate account
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({ error: 'Affiliate account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (claimType === 'cash') {
      // Claim cash rewards
      const pendingAmount = parseFloat(affiliate.pending_earnings_usd?.toString() || '0');
      
      if (amount && amount > pendingAmount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient pending earnings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const claimAmount = amount || pendingAmount;

      // Update affiliate
      const { error: updateError } = await supabaseClient
        .from('affiliates')
        .update({
          pending_earnings_usd: pendingAmount - claimAmount,
          total_earnings_usd: parseFloat(affiliate.total_earnings_usd?.toString() || '0') + claimAmount,
        })
        .eq('id', affiliate.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update rewards status if rewardIds provided
      if (rewardIds && Array.isArray(rewardIds)) {
        await supabaseClient
          .from('affiliate_rewards')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .in('id', rewardIds)
          .eq('affiliate_id', affiliate.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          claimed_amount: claimAmount,
          message: 'Cash rewards claimed successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (claimType === 'lp') {
      // LP is automatically available, no claiming needed
      return new Response(
        JSON.stringify({
          success: true,
          message: 'LP is automatically available in your account',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (claimType === 'cpu') {
      // Claim vested CPU units
      const { data: vestedCPU } = await supabaseClient
        .from('cpu_units')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'vested');

      if (!vestedCPU || vestedCPU.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No vested CPU units available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const totalVested = vestedCPU.reduce((sum, unit) => sum + parseFloat(unit.units.toString()), 0);

      // Update CPU units status
      await supabaseClient
        .from('cpu_units')
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        })
        .in('id', vestedCPU.map(u => u.id))
        .eq('affiliate_id', affiliate.id);

      return new Response(
        JSON.stringify({
          success: true,
          claimed_cpu: totalVested,
          message: 'CPU units claimed successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (claimType === 'tokens') {
      // Claim token rewards (future implementation)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Token claiming will be available when tokens are launched',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid claim type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Affiliate claim error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

