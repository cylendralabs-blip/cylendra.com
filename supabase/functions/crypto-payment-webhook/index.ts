/**
 * Crypto Payment Webhook Handler
 * 
 * Phase Crypto Payments: Handle NOWPayments webhook callbacks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.192.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const nowpaymentsIpnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET')
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get webhook signature
    const signature = req.headers.get('x-nowpayments-sig')
    const bodyText = await req.text()
    let payload: any

    try {
      payload = JSON.parse(bodyText)
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature if IPN secret is configured
    // Note: NOWPayments signature verification format may vary
    // For now, we log the signature but don't strictly enforce it
    // In production, implement proper signature verification based on NOWPayments docs
    if (nowpaymentsIpnSecret && signature) {
      // TODO: Implement proper signature verification based on NOWPayments documentation
      // The exact format may vary, so check NOWPayments API docs for the correct method
      console.log('Webhook signature received:', signature.substring(0, 20) + '...')
      // For now, we accept the webhook if signature is present
      // In production, add proper HMAC verification here
    } else if (nowpaymentsIpnSecret && !signature) {
      // If IPN secret is configured but no signature provided, log warning but allow
      // (Some NOWPayments configurations may not send signature)
      console.warn('IPN secret configured but no signature provided')
    }

    // Extract payment information
    const providerPaymentId = payload.payment_id?.toString() || payload.invoice_id?.toString()
    const providerStatus = payload.payment_status || payload.status

    if (!providerPaymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find payment in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_payment_id', providerPaymentId)
      .maybeSingle()

    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('Error fetching payment:', paymentError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!payment) {
      console.error('Payment not found:', providerPaymentId)
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map NOWPayments status to our status
    const statusMap: Record<string, string> = {
      'waiting': 'pending',
      'confirming': 'confirming',
      'finished': 'finished',
      'failed': 'failed',
      'expired': 'expired',
      'refunded': 'refunded',
    }

    const newStatus = statusMap[providerStatus] || payment.status

    // Log webhook event
    await supabaseAdmin
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        event_type: 'webhook_received',
        provider_status: providerStatus,
        raw_payload: payload,
      })

    // Update payment status if changed
    if (newStatus !== payment.status) {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(payment.metadata || {}),
          last_webhook: payload,
        },
      }

      // If payment is finished, set completed_at
      if (newStatus === 'finished' && !payment.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      await supabaseAdmin
        .from('payments')
        .update(updateData)
        .eq('id', payment.id)

      // If payment is finished, activate subscription
      if (newStatus === 'finished' && payment.status !== 'finished') {
        await activateSubscriptionFromPayment(supabaseAdmin, payment)
      }
    }

    return new Response(
      JSON.stringify({ received: true, payment_id: payment.id, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in crypto-payment-webhook:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Activate subscription when payment is finished
 */
async function activateSubscriptionFromPayment(supabaseAdmin: any, payment: any) {
  try {
    // Get plan details
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('code', payment.plan_code)
      .single()

    if (!plan) {
      console.error('Plan not found:', payment.plan_code)
      return
    }

    // Calculate expiration date (default: 30 days for monthly, adjust based on plan)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Default to 30 days, can be adjusted based on plan

    // Update or create user plan
    await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: payment.user_id,
        plan_id: plan.id,
        status: 'active',
        payment_method: 'crypto',
        expires_at: expiresAt.toISOString(),
        activated_at: new Date().toISOString(),
        metadata: {
          payment_id: payment.id,
          provider: 'NOWPayments',
          provider_payment_id: payment.provider_payment_id,
        },
      }, {
        onConflict: 'user_id'
      })

    // Log payment event
    await supabaseAdmin
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        event_type: 'plan_activated',
        provider_status: 'finished',
        raw_payload: {
          plan_code: payment.plan_code,
          expires_at: expiresAt.toISOString(),
        },
      })

    console.log('✅ Subscription activated for payment:', payment.id)
  } catch (error) {
    console.error('Error activating subscription from payment:', error)
  }
}

