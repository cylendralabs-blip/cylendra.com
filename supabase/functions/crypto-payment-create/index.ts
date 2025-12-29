/**
 * Crypto Payment Create Edge Function
 * 
 * Phase Crypto Payments: Create payment via NOWPayments
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
    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY')
    const nowpaymentsBaseUrl = Deno.env.get('NOWPAYMENTS_BASE_URL') || 'https://api.nowpayments.io/v1'
    
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

    // Parse request body
    const body = await req.json()
    const { userId, planCode, currency = 'USDTTRC20' } = body

    if (!userId || !planCode) {
      return new Response(
        JSON.stringify({ error: 'userId and planCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user can only create payment for themselves (unless admin)
    if (userId !== user.id) {
      // Check if user is admin
      const { data: roleAssignments } = await supabaseAdmin
        .from('user_role_assignments')
        .select('role:roles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      
      const roles = (roleAssignments || []).map((a: any) => a.role?.name).filter(Boolean)
      const isAdmin = roles.includes('owner') || roles.includes('admin')
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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

    const amountUsd = Number(plan.price_usd)

    // Check if NOWPayments API key is configured
    if (!nowpaymentsApiKey) {
      console.warn('NOWPayments API key not configured in Supabase Secrets')
      return new Response(
        JSON.stringify({ 
          error: 'NOWPayments API key not configured',
          message: 'Please configure NOWPAYMENTS_API_KEY in Supabase Edge Functions Secrets',
          code: 'NOWPAYMENTS_NOT_CONFIGURED'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/crypto-payment-webhook`

    // Create payment with NOWPayments
    const nowpaymentsResponse = await fetch(`${nowpaymentsBaseUrl}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': nowpaymentsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amountUsd,
        price_currency: 'usd',
        pay_currency: currency.toLowerCase(),
        order_id: `orbitra-${userId}-${Date.now()}`,
        order_description: `Orbitra AI ${plan.name} subscription`,
        ipn_callback_url: webhookUrl,
      }),
    })

    if (!nowpaymentsResponse.ok) {
      const error = await nowpaymentsResponse.json()
      console.error('NOWPayments API error:', error)
      return new Response(
        JSON.stringify({ error: `NOWPayments API error: ${error.message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nowpaymentsData = await nowpaymentsResponse.json()

    // Map NOWPayments status to our status
    const statusMap: Record<string, string> = {
      'waiting': 'pending',
      'confirming': 'confirming',
      'finished': 'finished',
      'failed': 'failed',
      'expired': 'expired',
      'refunded': 'refunded',
    }

    const status = statusMap[nowpaymentsData.payment_status] || 'pending'

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        plan_code: planCode,
        amount_usd: amountUsd,
        currency: currency.toUpperCase(),
        payment_method: 'crypto',
        provider: 'NOWPayments',
        provider_payment_id: nowpaymentsData.payment_id?.toString(),
        payment_url: nowpaymentsData.redirect_url || nowpaymentsData.invoice_url,
        pay_address: nowpaymentsData.pay_address,
        pay_amount: nowpaymentsData.pay_amount ? Number(nowpaymentsData.pay_amount) : null,
        status,
        metadata: {
          nowpayments_response: nowpaymentsData,
          order_id: `orbitra-${userId}-${Date.now()}`,
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
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
        provider_status: nowpaymentsData.payment_status,
        raw_payload: nowpaymentsData,
      })

    return new Response(
      JSON.stringify({
        payment: {
          id: payment.id,
          user_id: payment.user_id,
          plan_code: payment.plan_code,
          amount_usd: Number(payment.amount_usd),
          currency: payment.currency,
          payment_method: payment.payment_method,
          provider: payment.provider,
          provider_payment_id: payment.provider_payment_id,
          payment_url: payment.payment_url,
          pay_address: payment.pay_address,
          pay_amount: payment.pay_amount ? Number(payment.pay_amount) : null,
          status: payment.status,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          completed_at: payment.completed_at,
          metadata: payment.metadata,
        },
        payment_url: payment.payment_url,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in crypto-payment-create:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

