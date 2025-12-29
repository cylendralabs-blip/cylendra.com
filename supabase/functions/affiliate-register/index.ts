/**
 * Affiliate Register Edge Function
 * 
 * Registers a new affiliate account
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

    // Check if affiliate already exists
    const { data: existingAffiliate } = await supabaseClient
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingAffiliate) {
      return new Response(
        JSON.stringify({ error: 'Affiliate account already exists', affiliate_id: existingAffiliate.id }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create affiliate account
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .insert({
        user_id: user.id,
        status: 'pending',
        tier: 'bronze',
      })
      .select()
      .single();

    if (affiliateError) {
      console.error('Error creating affiliate:', affiliateError);
      return new Response(
        JSON.stringify({ error: affiliateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Affiliate register error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

