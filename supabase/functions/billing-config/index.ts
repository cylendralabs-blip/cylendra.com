/**
 * Billing Config Edge Function
 * 
 * Returns current billing mode configuration
 * Checks database settings first, then falls back to environment variables
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

    // Get beta mode from database settings
    const { data: betaSetting } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'beta_mode_enabled')
      .maybeSingle()

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

    const betaEnabled = betaSetting?.value === true || betaSetting?.value === 'true'
    const durationDays = durationSetting?.value?.days || 60
    const endDate = endDateSetting?.value || null

    // Fallback to environment variable if database setting not found
    const envBillingMode = Deno.env.get('BILLING_MODE') || 'live'
    const billingMode = betaEnabled ? 'beta_free' : envBillingMode

    return new Response(
      JSON.stringify({
        mode: billingMode,
        betaExpirationDays: durationDays,
        betaEndDate: endDate,
        features: {
          stripe: billingMode === 'live',
          crypto: billingMode === 'live',
          betaFree: betaEnabled,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in billing-config:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

