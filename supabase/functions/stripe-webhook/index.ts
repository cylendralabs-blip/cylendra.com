/**
 * Stripe Webhook Handler Edge Function
 * 
 * Phase Admin Billing: Handle Stripe webhook events
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get webhook signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get raw body for signature verification
    const body = await req.text()

    // Verify webhook signature (in production, use Stripe SDK)
    // For now, we'll skip verification in development
    // In production, use: stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)

    let event: any
    try {
      event = JSON.parse(body)
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Stripe webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabaseAdmin, event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabaseAdmin, event.data.object)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabaseAdmin, event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabaseAdmin, event.data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabaseAdmin, event.data.object)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in stripe-webhook:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(supabaseAdmin: any, paymentIntent: any) {
  try {
    // Find user by customer ID or metadata
    const customerId = paymentIntent.customer
    const userId = paymentIntent.metadata?.user_id

    if (!userId) {
      console.error('No user_id in payment intent metadata')
      return
    }

    // Create payment history record
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        payment_method: 'stripe',
        payment_status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        transaction_id: paymentIntent.id,
        payment_gateway: 'stripe',
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
        metadata: {
          payment_intent: paymentIntent,
        },
      })

    console.log('✅ Payment intent succeeded recorded:', paymentIntent.id)
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(supabaseAdmin: any, paymentIntent: any) {
  try {
    const userId = paymentIntent.metadata?.user_id

    if (!userId) {
      return
    }

    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        payment_method: 'stripe',
        payment_status: 'failed',
        stripe_payment_intent_id: paymentIntent.id,
        transaction_id: paymentIntent.id,
        payment_gateway: 'stripe',
        metadata: {
          payment_intent: paymentIntent,
          failure_reason: paymentIntent.last_payment_error?.message,
        },
      })

    console.log('❌ Payment intent failed recorded:', paymentIntent.id)
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(supabaseAdmin: any, subscription: any) {
  try {
    const userId = subscription.metadata?.user_id
    const customerId = subscription.customer

    if (!userId) {
      console.error('No user_id in subscription metadata')
      return
    }

    // Get plan code from metadata or subscription items
    const planCode = subscription.metadata?.plan_code || 'BASIC'
    
    // Get plan from database
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('code', planCode)
      .single()

    if (!plan) {
      console.error('Plan not found:', planCode)
      return
    }

    // Calculate expiration date
    const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()
    const activatedAt = new Date(subscription.current_period_start * 1000).toISOString()

    // Determine status
    let status = 'active'
    if (subscription.status === 'trialing') {
      status = 'trial'
    } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
      status = 'canceled'
    }

    // Update or create user plan
    await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status,
        payment_method: 'stripe',
        expires_at: expiresAt,
        activated_at: activatedAt,
        metadata: {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          stripe_status: subscription.status,
        },
      }, {
        onConflict: 'user_id'
      })

    console.log('✅ Subscription updated:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(supabaseAdmin: any, subscription: any) {
  try {
    const userId = subscription.metadata?.user_id

    if (!userId) {
      return
    }

    // Update subscription status to canceled
    await supabaseAdmin
      .from('user_plans')
      .update({
        status: 'canceled',
        metadata: {
          ...((await supabaseAdmin
            .from('user_plans')
            .select('metadata')
            .eq('user_id', userId)
            .single())?.data?.metadata || {}),
          canceled_at: new Date().toISOString(),
          stripe_subscription_id: subscription.id,
        },
      })
      .eq('user_id', userId)

    console.log('✅ Subscription canceled:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(supabaseAdmin: any, invoice: any) {
  try {
    const userId = invoice.metadata?.user_id
    const subscriptionId = invoice.subscription

    if (!userId) {
      return
    }

    // Create payment history record
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: userId, // user_id is used as subscription_id in user_plans
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'stripe',
        payment_status: 'completed',
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: invoice.customer,
        transaction_id: invoice.payment_intent,
        payment_gateway: 'stripe',
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
        metadata: {
          invoice: invoice,
        },
      })

    console.log('✅ Invoice payment succeeded recorded:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(supabaseAdmin: any, invoice: any) {
  try {
    const userId = invoice.metadata?.user_id

    if (!userId) {
      return
    }

    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'stripe',
        payment_status: 'failed',
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer,
        payment_gateway: 'stripe',
        metadata: {
          invoice: invoice,
          failure_reason: invoice.last_payment_error?.message,
        },
      })

    console.log('❌ Invoice payment failed recorded:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

