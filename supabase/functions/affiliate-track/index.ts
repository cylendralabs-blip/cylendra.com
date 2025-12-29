/**
 * Affiliate Track Edge Function
 * 
 * Tracks referral conversions and activities
 * 
 * Phase 11A: Influence Economy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Fraud detection - inline implementation for Edge Function
function detectFraud(data: {
  ipAddress?: string;
  deviceId?: string;
  browserFingerprint?: string;
  userAgent?: string;
}): { fraud_score: number; flags: string[]; is_fraud: boolean } {
  const flags: string[] = [];
  let fraudScore = 0;

  // Basic fraud detection
  if (data.userAgent) {
    const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i];
    if (suspiciousPatterns.some(pattern => pattern.test(data.userAgent!))) {
      flags.push('bot_user_agent');
      fraudScore += 25;
    }
  }

  fraudScore = Math.max(0, Math.min(100, fraudScore));
  return {
    fraud_score: fraudScore,
    flags,
    is_fraud: fraudScore >= 50,
  };
}

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      referralCode,
      referralLink,
      utmSource,
      utmMedium,
      utmCampaign,
      userId,
      ipAddress,
      deviceId,
      browserFingerprint,
      userAgent,
    } = await req.json();

    if (!referralCode && !referralLink) {
      return new Response(
        JSON.stringify({ error: 'Missing referral code or link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find affiliate by referral code
    let affiliateId: string | null = null;
    if (referralCode) {
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    if (!affiliateId) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already referred
    if (userId) {
      const { data: existing } = await supabaseClient
        .from('affiliate_users')
        .select('id')
        .eq('referred_user_id', userId)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'User already referred', affiliate_user_id: existing.id }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fraud detection
    const fraudResult = detectFraud({
      ipAddress,
      deviceId,
      browserFingerprint,
      userAgent,
    });

    // Create referral record
    const { data: affiliateUser, error: createError } = await supabaseClient
      .from('affiliate_users')
      .insert({
        affiliate_id: affiliateId,
        referred_user_id: userId || null,
        referral_source: referralLink ? 'link' : 'code',
        referral_link: referralLink,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        ip_address: ipAddress,
        device_id: deviceId,
        browser_fingerprint: browserFingerprint,
        fraud_score: fraudResult.fraud_score,
        fraud_flags: fraudResult.flags,
        status: fraudResult.is_fraud ? 'fraud' : 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating affiliate user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        affiliate_user_id: affiliateUser.id,
        fraud_detection: {
          fraud_score: fraudResult.fraud_score,
          is_fraud: fraudResult.is_fraud,
          flags: fraudResult.flags,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Affiliate track error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

