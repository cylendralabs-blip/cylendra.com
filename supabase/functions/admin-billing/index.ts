/**
 * Admin Billing Edge Function
 * 
 * Phase Admin Billing: Full Subscription & Payment Control Layer
 * 
 * Handles all billing operations:
 * - List all subscriptions
 * - Get user subscription details
 * - Change plan
 * - Renew subscription
 * - Extend subscription
 * - Activate trial
 * - Cancel subscription
 * - Downgrade to free
 * - Mark payment received
 * - Get billing analytics
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
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client for checking user permissions
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

    // Check if user is admin (Phase Admin F: RBAC)
    const { data: roleAssignments, error: roleError } = await supabaseAdmin
      .from('user_role_assignments')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    
    if (roleError) {
      console.error('Error checking user roles:', roleError)
      // Fallback to old method
      const { data: isAdminData, error: isAdminError } = await supabaseAuth.rpc('is_admin', { _user_id: user.id })
      if (isAdminError || !isAdminData) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Check if user has owner or admin role
      const roles = (roleAssignments || [])
        .map((assignment: any) => assignment.role?.name)
        .filter(Boolean)
      
      const hasAdminAccess = roles.includes('owner') || roles.includes('admin')
      
      if (!hasAdminAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Admin or Owner role required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse request body
    let requestBody = {}
    if (req.method === 'POST' && req.body) {
      try {
        requestBody = await req.json()
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const url = new URL(req.url)
    const action = requestBody.action || url.searchParams.get('action') || 'list'

    console.log('Admin Billing action:', action)

    switch (action) {
      case 'list':
        return await listAllSubscriptions(supabaseAdmin, corsHeaders)
      
      case 'get-user':
        const userId = requestBody.userId || url.searchParams.get('userId')
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await getUserSubscription(supabaseAdmin, userId, corsHeaders)
      
      case 'change-plan':
        return await changePlan(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'renew':
        return await renewSubscription(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'extend':
        return await extendSubscription(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'activate-trial':
        return await activateTrial(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'cancel':
        return await cancelSubscription(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'downgrade-free':
        return await downgradeToFree(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'mark-paid':
        return await markPaymentReceived(supabaseAdmin, user.id, requestBody, corsHeaders)
      
      case 'analytics':
        return await getBillingAnalytics(supabaseAdmin, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in admin-billing function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * List all user subscriptions
 */
async function listAllSubscriptions(supabaseAdmin: any, corsHeaders: any) {
  try {
    // Get all auth users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      throw new Error(`Failed to fetch users: ${authError.message}`)
    }

    // Get all user plans
    const { data: userPlans, error: plansError } = await supabaseAdmin
      .from('user_plans')
      .select(`
        *,
        plan:plans(code, name)
      `)
      .order('activated_at', { ascending: false })

    if (plansError) {
      throw new Error(`Failed to fetch user plans: ${plansError.message}`)
    }

    // Create a map of user_id to plan
    const planMap = new Map()
    ;(userPlans || []).forEach((up: any) => {
      planMap.set(up.user_id, up)
    })

    // Build subscriptions array
    const subscriptions = []

    for (const authUser of (authUsers || [])) {
      const userId = authUser.id
      const userPlan = planMap.get(userId)
      
      if (userPlan && userPlan.plan) {
        const expiresAt = userPlan.expires_at
        const daysRemaining = expiresAt
          ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null

        subscriptions.push({
          user_id: userId,
          email: authUser.email,
          plan_code: userPlan.plan.code,
          plan_name: userPlan.plan.name,
          status: userPlan.status,
          activated_at: userPlan.activated_at,
          expires_at: expiresAt,
          days_remaining: daysRemaining,
          payment_method: userPlan.payment_method,
          payment_reference: userPlan.metadata?.payment_reference || null,
          transaction_id: userPlan.metadata?.transaction_id || null,
          payment_gateway: userPlan.metadata?.payment_gateway || null,
        })
      } else {
        // User has no plan, default to FREE
        subscriptions.push({
          user_id: userId,
          email: authUser.email,
          plan_code: 'FREE',
          plan_name: 'Free',
          status: 'active',
          activated_at: new Date().toISOString(),
          expires_at: null,
          days_remaining: null,
          payment_method: null,
        })
      }
    }

    return new Response(
      JSON.stringify({ subscriptions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in listAllSubscriptions:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Get user subscription details
 */
async function getUserSubscription(supabaseAdmin: any, userId: string, corsHeaders: any) {
  try {
    const { data: userPlan, error } = await supabaseAdmin
      .from('user_plans')
      .select(`
        *,
        plan:plans(code, name)
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user plan: ${error.message}`)
    }

    // Get user email
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError) {
      console.error('Error fetching auth user:', authError)
    }

    if (!userPlan || !userPlan.plan) {
      // Return FREE plan as default
      return new Response(
        JSON.stringify({
          subscription: {
            user_id: userId,
            email: authUser?.email || 'N/A',
            plan_code: 'FREE',
            plan_name: 'Free',
            status: 'active',
            activated_at: new Date().toISOString(),
            expires_at: null,
            days_remaining: null,
            payment_method: null,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expiresAt = userPlan.expires_at
    const daysRemaining = expiresAt
      ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    return new Response(
      JSON.stringify({
        subscription: {
          user_id: userId,
          email: authUser?.email || 'N/A',
          plan_code: userPlan.plan.code,
          plan_name: userPlan.plan.name,
          status: userPlan.status,
          activated_at: userPlan.activated_at,
          expires_at: expiresAt,
          days_remaining: daysRemaining,
          payment_method: userPlan.payment_method,
          payment_reference: userPlan.metadata?.payment_reference || null,
          transaction_id: userPlan.metadata?.transaction_id || null,
          payment_gateway: userPlan.metadata?.payment_gateway || null,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getUserSubscription:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Change user plan
 */
async function changePlan(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId, planCode, paymentMethod = 'manual', expiresAt, metadata } = body

    if (!userId || !planCode) {
      return new Response(
        JSON.stringify({ error: 'userId and planCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan
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

    // Get current plan
    const { data: currentPlan } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const oldPlanCode = currentPlan?.plan_id ? 
      (await supabaseAdmin.from('plans').select('code').eq('id', currentPlan.plan_id).single()).data?.code : 'FREE'

    // Upsert user plan
    const { error: upsertError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        payment_method: paymentMethod,
        expires_at: expiresAt || null,
        activated_at: new Date().toISOString(),
        metadata: metadata || {},
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      throw new Error(`Failed to update plan: ${upsertError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'plan_change',
        target_type: 'user',
        target_id: userId,
        metadata: {
          old_plan: oldPlanCode,
          new_plan: planCode,
          payment_method: paymentMethod,
          expires_at: expiresAt,
          ...metadata,
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in changePlan:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Renew subscription
 */
async function renewSubscription(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId, renewalPeriodMonths, paymentMethod = 'manual', metadata } = body

    if (!userId || !renewalPeriodMonths) {
      return new Response(
        JSON.stringify({ error: 'userId and renewalPeriodMonths are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current subscription
    const { data: currentPlan, error: currentError } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (currentError && currentError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current plan: ${currentError.message}`)
    }

    const currentExpiresAt = currentPlan?.expires_at
      ? new Date(currentPlan.expires_at)
      : new Date()

    // Add renewal period
    const newExpiresAt = new Date(currentExpiresAt)
    newExpiresAt.setMonth(newExpiresAt.getMonth() + renewalPeriodMonths)

    // Update subscription
    const { error: updateError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: currentPlan?.plan_id,
        activated_at: new Date().toISOString(),
        expires_at: newExpiresAt.toISOString(),
        payment_method: paymentMethod,
        status: 'active',
        metadata: {
          ...(currentPlan?.metadata || {}),
          ...(metadata || {}),
        },
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      throw new Error(`Failed to renew subscription: ${updateError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'subscription_renewal',
        target_type: 'user',
        target_id: userId,
        metadata: {
          renewal_period_months: renewalPeriodMonths,
          old_expires_at: currentPlan?.expires_at,
          new_expires_at: newExpiresAt.toISOString(),
          payment_method: paymentMethod,
          ...metadata,
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in renewSubscription:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Extend subscription by days
 */
async function extendSubscription(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId, days, metadata } = body

    if (!userId || !days) {
      return new Response(
        JSON.stringify({ error: 'userId and days are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current subscription
    const { data: currentPlan, error: currentError } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (currentError && currentError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current plan: ${currentError.message}`)
    }

    if (!currentPlan) {
      return new Response(
        JSON.stringify({ error: 'User subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentExpiresAt = currentPlan.expires_at
      ? new Date(currentPlan.expires_at)
      : new Date()

    // Add days
    const newExpiresAt = new Date(currentExpiresAt)
    newExpiresAt.setDate(newExpiresAt.getDate() + days)

    // Update subscription
    const { error: updateError } = await supabaseAdmin
      .from('user_plans')
      .update({
        expires_at: newExpiresAt.toISOString(),
        status: 'active',
        metadata: {
          ...(currentPlan.metadata || {}),
          ...(metadata || {}),
        },
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Failed to extend subscription: ${updateError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'subscription_extend',
        target_type: 'user',
        target_id: userId,
        metadata: {
          days_added: days,
          old_expires_at: currentPlan.expires_at,
          new_expires_at: newExpiresAt.toISOString(),
          ...metadata,
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in extendSubscription:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Activate free trial
 */
async function activateTrial(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId, planCode, durationDays } = body

    if (!userId || !planCode || !durationDays) {
      return new Response(
        JSON.stringify({ error: 'userId, planCode, and durationDays are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan
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

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    // Upsert user plan with trial status
    const { error: upsertError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: 'trial',
        payment_method: 'trial',
        expires_at: expiresAt.toISOString(),
        activated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      throw new Error(`Failed to activate trial: ${upsertError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'trial_activation',
        target_type: 'user',
        target_id: userId,
        metadata: {
          plan_code: planCode,
          duration_days: durationDays,
          expires_at: expiresAt.toISOString(),
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in activateTrial:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId } = body

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current plan
    const { data: currentPlan, error: currentError } = await supabaseAdmin
      .from('user_plans')
      .select('*, plan:plans(code)')
      .eq('user_id', userId)
      .single()

    if (currentError && currentError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current plan: ${currentError.message}`)
    }

    if (!currentPlan) {
      return new Response(
        JSON.stringify({ error: 'User subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to canceled
    const { error: updateError } = await supabaseAdmin
      .from('user_plans')
      .update({ status: 'canceled' })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'subscription_cancel',
        target_type: 'user',
        target_id: userId,
        metadata: {
          old_plan: currentPlan.plan?.code || 'FREE',
          canceled_at: new Date().toISOString(),
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cancelSubscription:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Downgrade to FREE plan
 */
async function downgradeToFree(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId } = body

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get FREE plan
    const { data: freePlan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('code', 'FREE')
      .eq('is_active', true)
      .single()

    if (planError || !freePlan) {
      return new Response(
        JSON.stringify({ error: 'FREE plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current plan
    const { data: currentPlan } = await supabaseAdmin
      .from('user_plans')
      .select('*, plan:plans(code)')
      .eq('user_id', userId)
      .maybeSingle()

    const oldPlanCode = currentPlan?.plan?.code || 'FREE'

    // Upsert FREE plan
    const { error: upsertError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_id: freePlan.id,
        status: 'active',
        payment_method: 'manual',
        expires_at: null,
        activated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      throw new Error(`Failed to downgrade to FREE: ${upsertError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'plan_downgrade',
        target_type: 'user',
        target_id: userId,
        metadata: {
          old_plan: oldPlanCode,
          new_plan: 'FREE',
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in downgradeToFree:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Mark payment as received
 */
async function markPaymentReceived(supabaseAdmin: any, adminId: string, body: any, corsHeaders: any) {
  try {
    const { userId, paymentMethod, paymentReference, transactionId, paymentGateway } = body

    if (!userId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'userId and paymentMethod are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current plan
    const { data: currentPlan, error: currentError } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (currentError && currentError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current plan: ${currentError.message}`)
    }

    if (!currentPlan) {
      return new Response(
        JSON.stringify({ error: 'User subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment info and activate subscription
    const { error: updateError } = await supabaseAdmin
      .from('user_plans')
      .update({
        payment_method: paymentMethod,
        status: 'active',
        metadata: {
          ...(currentPlan.metadata || {}),
          payment_reference: paymentReference,
          transaction_id: transactionId,
          payment_gateway: paymentGateway,
        },
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Failed to mark payment: ${updateError.message}`)
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'payment_marked_received',
        target_type: 'user',
        target_id: userId,
        metadata: {
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          transaction_id: transactionId,
          payment_gateway: paymentGateway,
        },
      })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in markPaymentReceived:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Get billing analytics
 */
async function getBillingAnalytics(supabaseAdmin: any, corsHeaders: any) {
  try {
    // Get all subscriptions
    const { data: userPlans, error: plansError } = await supabaseAdmin
      .from('user_plans')
      .select(`
        *,
        plan:plans(code)
      `)

    if (plansError) {
      throw new Error(`Failed to fetch user plans: ${plansError.message}`)
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const analytics = {
      total_active_subscriptions: (userPlans || []).filter(
        (up: any) => up.status === 'active' || up.status === 'trial'
      ).length,
      active_pro_users: (userPlans || []).filter(
        (up: any) => up.plan?.code === 'PRO' && (up.status === 'active' || up.status === 'trial')
      ).length,
      active_vip_users: (userPlans || []).filter(
        (up: any) => up.plan?.code === 'VIP' && (up.status === 'active' || up.status === 'trial')
      ).length,
      expiring_in_7_days: (userPlans || []).filter(
        (up: any) =>
          up.expires_at &&
          new Date(up.expires_at) <= sevenDaysFromNow &&
          new Date(up.expires_at) > now &&
          (up.status === 'active' || up.status === 'trial')
      ).length,
      total_manual_renewals: (userPlans || []).filter(
        (up: any) => up.payment_method === 'manual' && up.status === 'active'
      ).length,
      total_trials_active: (userPlans || []).filter((up: any) => up.status === 'trial').length,
    }

    return new Response(
      JSON.stringify({ analytics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getBillingAnalytics:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

