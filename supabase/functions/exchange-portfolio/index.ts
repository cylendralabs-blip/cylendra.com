
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getBalance, testConnection, refreshAllBalances } from './handlers/balance.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, api_key_id, platform, market_type } = requestBody
    console.log('Edge function called with:', { action, api_key_id, platform, market_type })

    switch (action) {
      case 'test-connection':
        return await testConnection(supabaseClient, api_key_id)
      case 'get_balance':
        return await getBalance(supabaseClient, api_key_id, platform, market_type)
      case 'refresh-all-balances':
        return await refreshAllBalances(supabaseClient)
      default:
        console.error('Invalid action:', action)
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
