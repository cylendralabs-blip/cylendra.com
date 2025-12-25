
import { 
  testBinanceConnection, 
  getBinanceBalances, 
  testBinanceDemoConnection,
  testBinanceSpotTestnetConnection,
  testBinanceFuturesTestnetConnection, 
  getBinanceFuturesTestnetBalances,
  getBinanceSpotTestnetBalances,
  getBinanceDemoBalances,
  getBinanceBalancesByPlatform
} from '../platforms/binance.ts'
import { testOKXConnection, getOKXBalances } from '../platforms/okx.ts'
import { testBybitConnection, getBybitBalances } from '../platforms/bybit.ts'
import { testKuCoinConnection, getKuCoinBalances } from '../platforms/kucoin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export async function testConnection(supabaseClient: any, apiKeyId: string) {
  console.log('Testing connection for API key ID:', apiKeyId)

  try {
    // جلب مفتاح API من قاعدة البيانات
    const { data: apiKeyData, error: fetchError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('id', apiKeyId)
      .single()

    if (fetchError) {
      console.error('Error fetching API key:', fetchError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!apiKeyData) {
      console.error('API key data is null')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Found API key for platform:', apiKeyData.platform)

    const startTime = Date.now()
    let testResult

    // اختبار الاتصال حسب المنصة
    try {
      switch (apiKeyData.platform) {
        case 'binance':
          console.log('Testing Binance connection...')
          testResult = await testBinanceConnection(apiKeyData)
          break
        case 'binance-demo':
          console.log(`Testing Binance Demo Trading connection for platform: ${apiKeyData.platform}...`)
          testResult = await testBinanceDemoConnection(apiKeyData, apiKeyData.platform)
          break
        case 'binance-spot-testnet':
          console.log('Testing Binance Spot Testnet connection...')
          testResult = await testBinanceSpotTestnetConnection(apiKeyData)
          break
        case 'binance-futures-testnet':
          console.log('Testing Binance Futures Testnet connection (deprecated)...')
          testResult = await testBinanceFuturesTestnetConnection(apiKeyData)
          break
        case 'okx':
        case 'okx-demo':
          console.log('Testing OKX connection...')
          testResult = await testOKXConnection(apiKeyData)
          break
        case 'bybit':
        case 'bybit-testnet':
          console.log('Testing Bybit connection...')
          testResult = await testBybitConnection(apiKeyData)
          break
        case 'kucoin':
          console.log('Testing KuCoin connection...')
          testResult = await testKuCoinConnection(apiKeyData)
          break
        default:
          throw new Error(`Unsupported platform: ${apiKeyData.platform}`)
      }

      console.log('Connection test result:', testResult)
    } catch (connectionError) {
      console.error('Connection test failed:', connectionError)

      // حفظ حالة الاتصال الفاشلة
      await supabaseClient
        .from('connection_status')
        .upsert({
          user_id: apiKeyData.user_id,
          api_key_id: apiKeyId,
          status: 'error',
          last_checked: new Date().toISOString(),
          error_message: connectionError.message,
          response_time_ms: null
        })

      return new Response(
        JSON.stringify({
          success: false,
          error: connectionError.message,
          responseTime: null
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const responseTime = Date.now() - startTime
    console.log('Connection test successful, response time:', responseTime, 'ms')

    // حفظ حالة الاتصال الناجحة
    await supabaseClient
      .from('connection_status')
      .upsert({
        user_id: apiKeyData.user_id,
        api_key_id: apiKeyId,
        status: 'connected',
        last_checked: new Date().toISOString(),
        error_message: null,
        response_time_ms: responseTime
      })

    return new Response(
      JSON.stringify({
        success: true,
        responseTime,
        result: testResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in testConnection:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function getBalance(supabaseClient: any, apiKeyId: string, platform: string, marketType: string) {
  console.log('Getting balance for:', { apiKeyId, platform, marketType })

  try {
    const { data: apiKeyData, error: fetchError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('id', apiKeyId)
      .single()

    if (fetchError || !apiKeyData) {
      console.error('Error fetching API key:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'API key not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let balances
    console.log('🔍 Getting balances for platform:', platform, 'market type:', marketType, 'api_key_id:', apiKeyId)
    console.log('🔑 API Key data:', { 
      platform: apiKeyData.platform, 
      testnet: apiKeyData.testnet,
      has_api_key: !!apiKeyData.api_key,
      has_secret: !!apiKeyData.secret_key
    })
    
    switch (platform) {
      case 'binance':
        console.log('📊 Fetching Binance balances with market type:', marketType)
        balances = await getBinanceBalances(apiKeyData, marketType)
        break
      case 'binance-demo':
        console.log('📊 Fetching Binance Demo Trading balances for platform:', platform, 'market type:', marketType)
        // Binance Demo Trading (demo.binance.com) يدعم Spot و Futures
        // استخدام marketType لتحديد نوع السوق
        // استخدام testnet endpoints لأن demo.binance.com API keys تعمل مع testnet
        const demoMarketType = marketType || 'spot';
        balances = await getBinanceBalancesByPlatform(apiKeyData, 'binance-demo', demoMarketType)
        break
      case 'binance-spot-testnet':
        console.log('📊 Fetching Binance Spot Testnet balances...')
        // Binance Spot Testnet (testnet.binance.vision) - Spot only
        balances = await getBinanceSpotTestnetBalances(apiKeyData)
        break
      case 'binance-futures-testnet':
        console.log('📊 Fetching Binance Old Testnet balances (deprecated) for market type:', marketType)
        // Old Testnet (deprecated, kept for compatibility)
        const oldTestnetMarketType = marketType || 'futures';
        balances = await getBinanceBalancesByPlatform(apiKeyData, platform, oldTestnetMarketType)
        break
      case 'okx':
      case 'okx-demo':
        console.log('📊 Fetching OKX balances for platform:', platform, 'testnet:', apiKeyData.testnet)
        try {
          balances = await getOKXBalances(apiKeyData)
          console.log('✅ OKX balances fetched:', balances?.length || 0, 'assets')
          if (!balances || balances.length === 0) {
            console.log('⚠️ OKX returned empty balances array - this is normal for empty accounts')
          }
        } catch (okxError: any) {
          console.error('❌ Error fetching OKX balances:', okxError)
          console.error('❌ Error details:', {
            message: okxError.message,
            stack: okxError.stack
          })
          // Return empty array instead of throwing to allow UI to show error message
          balances = []
        }
        break
      case 'bybit':
      case 'bybit-testnet':
        console.log('📊 Fetching Bybit balances for platform:', platform, 'testnet:', apiKeyData.testnet)
        balances = await getBybitBalances(apiKeyData)
        console.log('✅ Bybit balances fetched:', balances?.length || 0, 'assets')
        break
      case 'kucoin':
        console.log('📊 Fetching KuCoin balances')
        balances = await getKuCoinBalances(apiKeyData)
        break
      default:
        console.error('❌ Unsupported platform:', platform)
        throw new Error(`Unsupported platform: ${platform}`)
    }
    
    console.log('💰 Raw balances received:', balances?.length || 0, 'items')
    
    // التحقق من أن balances موجودة ومصفوفة
    if (!balances || !Array.isArray(balances)) {
      console.warn('⚠️ Balances is not an array, returning empty balances');
      balances = [];
    }

    // Normalize balances to support both old and new formats
    const normalizedBalances = balances.map((balance: any) => {
      // Support new format (asset, total, available, inOrder)
      if (balance.asset !== undefined) {
        return {
          symbol: balance.asset,
          free_balance: balance.available || 0,
          locked_balance: balance.inOrder || 0,
          total_balance: balance.total || 0,
          asset: balance.asset,
          available: balance.available || 0,
          inOrder: balance.inOrder || 0,
          total: balance.total || 0
        };
      }
      // Support old format (symbol, free_balance, locked_balance, total_balance)
      return {
        symbol: balance.symbol,
        free_balance: balance.free_balance || 0,
        locked_balance: balance.locked_balance || 0,
        total_balance: balance.total_balance || 0,
        asset: balance.symbol,
        available: balance.free_balance || 0,
        inOrder: balance.locked_balance || 0,
        total: balance.total_balance || 0
      };
    });

    // تصفية الأرصدة لإظهار العملات التي لها رصيد فقط
    // لكن نسمح بالرصيد الصفر إذا كان هناك بيانات (للتشخيص)
    const filteredBalances = normalizedBalances.filter((balance: any) => {
      const total = balance.total_balance || balance.total || 0;
      const hasBalance = total > 0;
      console.log('🔍 Filtering balance:', {
        symbol: balance.symbol || balance.asset,
        total,
        hasBalance
      });
      return hasBalance;
    })

    console.log('🔍 Filtered balances for', platform, 'market type', marketType, ':', filteredBalances.length, 'assets')
    
    // Log raw balances for debugging
    if (normalizedBalances.length > 0) {
      console.log('📋 Raw normalized balances:', normalizedBalances.map((b: any) => ({
        symbol: b.symbol || b.asset,
        total: b.total || b.total_balance,
        available: b.available || b.free_balance,
        inOrder: b.inOrder || b.locked_balance
      })));
    } else {
      console.log('⚠️ No normalized balances to filter - original balances array was empty');
    }

    // حفظ الأرصدة في قاعدة البيانات
    if (filteredBalances.length > 0) {
      // حذف الأرصدة الموجودة لنفس المنصة ونوع السوق
      await supabaseClient
        .from('portfolio_balances')
        .delete()
        .eq('user_id', apiKeyData.user_id)
        .eq('api_key_id', apiKeyId)
        .eq('market_type', marketType)

      const balanceRecords = filteredBalances.map((balance: any) => ({
        user_id: apiKeyData.user_id,
        api_key_id: apiKeyId,
        platform: platform,
        symbol: balance.symbol || balance.asset,
        free_balance: balance.free_balance || balance.available || 0,
        locked_balance: balance.locked_balance || balance.inOrder || 0,
        total_balance: balance.total_balance || balance.total || 0,
        market_type: marketType,
        last_updated: new Date().toISOString()
      }))

      const { error: insertError } = await supabaseClient
        .from('portfolio_balances')
        .insert(balanceRecords)

      if (insertError) {
        console.error('Error saving balances:', insertError)
      } else {
        console.log('Successfully saved balances for', platform, 'market type', marketType, ':', balanceRecords.length, 'records')
      }
    }

    // Always return success, even if balances are empty (to show in UI)
    const responseData = {
      success: true,
      balances: filteredBalances,
      total_assets: filteredBalances.length,
      market_type: marketType,
      platform: platform,
      message: filteredBalances.length === 0 
        ? `No balances found for ${platform}. This may indicate an empty account or API issue.`
        : undefined
    };
    
    console.log('📤 Returning balance response:', {
      success: responseData.success,
      balancesCount: responseData.balances.length,
      platform: responseData.platform,
      marketType: responseData.market_type
    });
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error getting balance:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      platform,
      marketType,
      apiKeyId
    })
    
    // إرجاع استجابة ناجحة مع رسالة خطأ بدلاً من 500
    // هذا يسمح للواجهة بعرض الرسالة بدلاً من خطأ عام
    return new Response(
      JSON.stringify({ 
        success: true, 
        balances: [],
        total_assets: 0,
        market_type: marketType,
        platform: platform,
        error: error.message || 'Unknown error occurred',
        message: `Error fetching balances: ${error.message}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

export async function refreshAllBalances(supabaseClient: any) {
  console.log('Refreshing all balances...')

  try {
    const { data: apiKeys, error: fetchError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching API keys:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: Array<{
      platform: string;
      success: boolean;
      balances?: any[];
      error?: string;
    }> = []
    for (const apiKey of apiKeys || []) {
      try {
        const marketType = apiKey.platform.includes('futures') ? 'futures' : 'spot'
        const response = await getBalance(supabaseClient, apiKey.id, apiKey.platform, marketType)
        const responseData = await response.json()
        results.push({
          platform: apiKey.platform,
          success: responseData.success,
          balances: responseData.balances || [],
          error: responseData.error
        })
      } catch (error: any) {
        console.error(`Error refreshing balance for ${apiKey.platform}:`, error)
        results.push({
          platform: apiKey.platform,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        updated_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error refreshing all balances:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
