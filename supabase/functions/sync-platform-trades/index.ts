
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const { platform, api_key_id } = await req.json()
    console.log('🔄 Syncing trades from platform:', platform, 'with API key:', api_key_id)

    // الحصول على معلومات API key
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', api_key_id)
      .single()

    if (apiKeyError || !apiKey) {
      throw new Error('API key not found')
    }

    console.log('🔑 Found API key for platform:', apiKey.platform)

    // Phase 18: Exchange API Integration
    // Note: Full exchange API integration (Binance, OKX, etc.) should be implemented
    // in production to fetch real-time positions and trades from exchange APIs.
    // Current implementation syncs existing trades from database and updates sync status.
    // For production, implement exchange-specific API clients to:
    // 1. Fetch open positions from exchange
    // 2. Fetch order history
    // 3. Update positions with real-time PnL
    // 4. Sync balances and portfolio data
    
    console.log('📊 Fetching existing trades for sync...')
    
    // Get existing trades for this user and platform
    const { data: existingTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', apiKey.user_id)
      .eq('platform', platform)
      .eq('status', 'ACTIVE')

    if (fetchError) {
      console.error('❌ Error fetching existing trades:', fetchError)
      throw fetchError
    }

    if (!existingTrades || existingTrades.length === 0) {
      console.log('ℹ️ No active trades found to sync')
      
      // Update sync status even if no trades
      const { error: syncError } = await supabase
        .from('platform_sync_status')
        .upsert({
          user_id: apiKey.user_id,
          exchange: platform,
          last_portfolio_sync_at: new Date().toISOString(),
          last_positions_sync_at: new Date().toISOString(),
          status: 'ok',
          last_error: null,
        }, {
          onConflict: 'user_id,exchange',
        })

      if (syncError) {
        console.error('❌ Error updating sync status:', syncError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          trades_count: 0,
          platform: platform,
          synced_at: new Date().toISOString(),
          message: 'No active trades to sync'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update sync timestamps for existing trades
    const { data: insertedTrades, error: insertError } = await supabase
      .from('trades')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('user_id', apiKey.user_id)
      .eq('platform', platform)
      .eq('status', 'ACTIVE')
      .select()

    if (insertError) {
      console.error('❌ Error inserting trades:', insertError)
      throw insertError
    }

    // تحديث حالة المزامنة
    const { error: syncError } = await supabase
      .from('platform_sync_status')
      .upsert({
        user_id: apiKey.user_id,
        exchange: platform,
        last_portfolio_sync_at: new Date().toISOString(),
        last_positions_sync_at: new Date().toISOString(),
        status: 'ok',
        last_error: null,
      }, {
        onConflict: 'user_id,exchange',
      })

    if (syncError) {
      console.error('❌ Error updating sync status:', syncError)
    }

    console.log('✅ Successfully synced', insertedTrades.length, 'trades from', platform)

    return new Response(
      JSON.stringify({
        success: true,
        trades_count: insertedTrades.length,
        platform: platform,
        synced_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error syncing platform trades:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to sync platform trades',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
