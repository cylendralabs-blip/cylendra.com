/**
 * Beta Activate Edge Function
 * 
 * Beta Free Billing Mode: Activate plan for free during beta phase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check beta mode from database settings
    const { data: betaSetting, error: betaSettingError } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'beta_mode_enabled')
      .maybeSingle()

    const betaEnabled = betaSetting?.value === true || betaSetting?.value === 'true'

    if (!betaEnabled) {
      return new Response(
        JSON.stringify({ 
          error: 'Beta mode is not enabled',
          message: 'Beta mode must be enabled in Admin Settings first'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get beta duration and end date
    const { data: durationSetting } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'beta_duration_days')
      .maybeSingle()

    const { data: endDateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'beta_end_date')
      .maybeSingle()

    const durationDays = durationSetting?.value?.days || 60
    const betaEndDate = endDateSetting?.value || null

    // Parse request body
    const body = await req.json()
    const { planCode } = body

    if (!planCode) {
      return new Response(
        JSON.stringify({ error: 'planCode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: `Plan ${planCode} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate expiration date
    // Use MIN(user_activation_date + durationDays, beta_end_date)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)
    
    // If beta_end_date exists and is earlier, use it
    if (betaEndDate) {
      const endDate = new Date(betaEndDate)
      if (endDate < expiresAt) {
        expiresAt.setTime(endDate.getTime())
      }
    }

    // Create payment record for beta activation
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        plan_code: planCode,
        amount_usd: plan.price_usd, // Store original price for reference
        currency: 'USD',
        payment_method: 'beta_free',
        provider: 'internal',
        provider_payment_id: `beta-${user.id}-${Date.now()}`,
        status: 'finished',
        completed_at: new Date().toISOString(),
        metadata: {
          beta_mode: true,
          original_price: plan.price_usd,
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating beta payment:', paymentError)
      return new Response(
        JSON.stringify({ error: `Failed to create payment record: ${paymentError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log payment event
    await supabaseAdmin
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        event_type: 'created',
        provider_status: 'finished',
        raw_payload: {
          beta_mode: true,
          plan_code: planCode,
        },
      })

    // Activate subscription using existing billing logic
    // Update or create user plan
    const { data: userPlan, error: userPlanError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        payment_method: 'beta_free',
        expires_at: expiresAt.toISOString(),
        activated_at: new Date().toISOString(),
        metadata: {
          payment_id: payment.id,
          provider: 'internal',
          beta_mode: true,
        },
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (userPlanError) {
      console.error('Error activating user plan:', userPlanError)
      return new Response(
        JSON.stringify({ error: `Failed to activate plan: ${userPlanError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log plan activation event
    await supabaseAdmin
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        event_type: 'plan_activated',
        provider_status: 'finished',
        raw_payload: {
          plan_code: planCode,
          expires_at: expiresAt.toISOString(),
          beta_mode: true,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Plan activated successfully (Beta Free Mode)',
        payment: {
          id: payment.id,
          plan_code: planCode,
          amount_usd: Number(payment.amount_usd),
          payment_method: 'beta_free',
          status: 'finished',
        },
        subscription: {
          plan_code: planCode,
          plan_name: plan.name,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          payment_method: 'beta_free',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in beta-activate:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

