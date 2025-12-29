
import { createHmacSignature } from '../utils/crypto.ts';

export async function testBinanceConnection(apiKey: any) {
  console.log('Testing Binance connection with API key:', apiKey.api_key.substring(0, 8) + '...')
  
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}`
  
  try {
    const signature = await createHmacSignature(queryString, apiKey.secret_key)
    console.log('Generated signature for Binance')
    
    const response = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': apiKey.api_key
      }
    })

    console.log('Binance API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Binance API error response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(`Binance API error: ${errorJson.msg || errorText}`)
      } catch {
        throw new Error(`Binance API error: ${response.status} - ${errorText}`)
      }
    }

    const result = await response.json()
    console.log('Binance connection test successful')
    return result
  } catch (error) {
    console.error('Binance connection test failed:', error)
    throw error
  }
}

export async function getBinanceBalances(apiKey: any, marketType: string = 'spot') {
  console.log('Getting Binance balances for market type:', marketType)
  
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}`
  const signature = await createHmacSignature(queryString, apiKey.secret_key)
  
  // استخدام API مختلف حسب نوع السوق
  let apiUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;
  
  // إذا كان futures، استخدم futures API الحقيقي (وليس testnet)
  if (marketType === 'futures') {
    apiUrl = `https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`;
    console.log('🔥 Using LIVE Binance Futures API for market type:', marketType);
  }
  
  console.log('Using API URL:', apiUrl.split('?')[0], 'for market type:', marketType);
  
  const response = await fetch(apiUrl, {
    headers: {
      'X-MBX-APIKEY': apiKey.api_key
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Binance API error:', errorText)
    throw new Error(`Binance API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  if (marketType === 'futures') {
    // للفيوتشر، استخدم assets بدلاً من balances
    console.log('📊 Processing LIVE futures assets:', data.assets?.length || 0, 'assets found');
    return data.assets.map((asset: any) => ({
      symbol: asset.asset,
      free_balance: parseFloat(asset.availableBalance),
      locked_balance: parseFloat(asset.initialMargin) + parseFloat(asset.maintMargin),
      total_balance: parseFloat(asset.walletBalance)
    }))
  } else {
    // للسبوت، استخدم balances
    console.log('📊 Processing spot balances:', data.balances?.length || 0, 'balances found');
    return data.balances.map((balance: any) => ({
      symbol: balance.asset,
      free_balance: parseFloat(balance.free),
      locked_balance: parseFloat(balance.locked),
      total_balance: parseFloat(balance.free) + parseFloat(balance.locked)
    }))
  }
}

/**
 * Detect Binance platform type
 */
function getBinancePlatformType(platform: string): 'live' | 'demo' | 'old-testnet' | 'spot-testnet' {
  if (platform === 'binance-demo') {
    return 'demo';
  }
  if (platform === 'binance-futures-testnet') {
    return 'old-testnet';
  }
  if (platform === 'binance-spot-testnet') {
    return 'spot-testnet';
  }
  return 'live';
}

/**
 * Get Binance API Base URL based on platform and market type
 */
function getBinanceApiBaseUrl(platform: string, marketType: 'spot' | 'futures'): string {
  const platformType = getBinancePlatformType(platform);
  
  if (platformType === 'demo') {
    // New Demo Trading (demo.binance.com)
    // Try testnet endpoints first (as demo.binance.com API keys might work with testnet)
    if (marketType === 'futures') {
      // Try testnet futures first, fallback to live if needed
      return 'https://testnet.binancefuture.com';
    } else {
      // Use testnet spot endpoint (testnet.binance.vision)
      return 'https://testnet.binance.vision';
    }
  }
  
  if (platformType === 'spot-testnet') {
    // Binance Spot Testnet (old, but still working)
    return 'https://testnet.binance.vision';
  }
  
  if (platformType === 'old-testnet') {
    // Old Testnet (deprecated, kept for compatibility)
    if (marketType === 'futures') {
      return 'https://testnet.binancefuture.com';
    } else {
      return 'https://testnet.binance.vision';
    }
  }
  
  // Live (Mainnet)
  if (marketType === 'futures') {
    return 'https://fapi.binance.com';
  } else {
    return 'https://api.binance.com';
  }
}

/**
 * Test Binance Demo Trading Connection
 * Demo Trading supports both Spot and Futures, so we test both
 */
export async function testBinanceDemoConnection(apiKey: any, platform: string = 'binance-demo') {
  const platformType = getBinancePlatformType(platform);
  
  console.log(`Testing Binance Demo Trading connection for platform: ${platform}...`)
  
  // Demo Trading supports both Spot and Futures
  // Try Spot first (most common)
  let marketType: 'spot' | 'futures' = 'spot';
  let lastError: Error | null = null;
  
  // Try Spot first
  try {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = await createHmacSignature(queryString, apiKey.secret_key)
    
    const baseUrl = getBinanceApiBaseUrl(platform, 'spot');
    const endpoint = '/api/v3/account';
    const apiUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    console.log(`Testing Spot API: ${baseUrl}${endpoint}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey.api_key
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Binance Demo Trading Spot connection test successful`)
      return result
    } else {
      const errorText = await response.text()
      lastError = new Error(`Spot API error: ${response.status} - ${errorText}`)
      console.log(`⚠️ Spot test failed, trying Futures...`)
    }
  } catch (error: any) {
    lastError = error
    console.log(`⚠️ Spot test failed: ${error.message}, trying Futures...`)
  }
  
  // If Spot failed, try Futures
  try {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = await createHmacSignature(queryString, apiKey.secret_key)
    
    const baseUrl = getBinanceApiBaseUrl(platform, 'futures');
    const endpoint = '/fapi/v2/account';
    const apiUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    console.log(`Testing Futures API: ${baseUrl}${endpoint}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey.api_key
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Binance Demo Trading Futures connection test successful`)
      return result
    } else {
      const errorText = await response.text()
      throw new Error(`Futures API error: ${response.status} - ${errorText}`)
    }
  } catch (error: any) {
    // If both failed, throw the last error
    console.error(`❌ Both Spot and Futures tests failed for Binance Demo Trading`)
    throw lastError || error
  }
}

// Legacy function for backward compatibility
export async function testBinanceFuturesTestnetConnection(apiKey: any) {
  console.log('⚠️ testBinanceFuturesTestnetConnection is deprecated, using testBinanceDemoConnection');
  return testBinanceDemoConnection(apiKey, 'binance-futures-testnet');
}

/**
 * Get Binance Balances (supports Live, Demo, and Old Testnet)
 */
export async function getBinanceBalancesByPlatform(
  apiKey: any, 
  platform: string, 
  marketType: string = 'spot'
) {
  const platformType = getBinancePlatformType(platform);
  console.log(`Getting Binance balances for platform: ${platform} (${platformType}), market type: ${marketType}`)
  
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}`
  const signature = await createHmacSignature(queryString, apiKey.secret_key)
  
  const baseUrl = getBinanceApiBaseUrl(platform, marketType as 'spot' | 'futures');
  const endpoint = marketType === 'futures' 
    ? '/fapi/v2/account' 
    : '/api/v3/account';
  
  const apiUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  console.log(`Using API URL: ${baseUrl}${endpoint} for ${platformType} ${marketType}`);
  
  const response = await fetch(apiUrl, {
    headers: {
      'X-MBX-APIKEY': apiKey.api_key
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Binance ${platformType} API error:`, errorText)
    throw new Error(`Binance ${platformType} API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('📋 Raw API response data:', JSON.stringify(data, null, 2))
  
  if (marketType === 'futures') {
    // للفيوتشر، استخدم assets
    console.log(`📊 Processing ${platformType} Futures assets:`, data.assets?.length || 0, 'assets found');
    if (!data.assets || !Array.isArray(data.assets)) {
      console.warn('⚠️ No assets array found in Futures response, returning empty array');
      return [];
    }
    return data.assets.map((asset: any) => ({
      symbol: asset.asset,
      free_balance: parseFloat(asset.availableBalance || 0),
      locked_balance: parseFloat(asset.initialMargin || 0) + parseFloat(asset.maintMargin || 0),
      total_balance: parseFloat(asset.walletBalance || 0)
    }))
  } else {
    // للسبوت، استخدم balances
    console.log(`📊 Processing ${platformType} Spot balances:`, data.balances?.length || 0, 'balances found');
    if (!data.balances || !Array.isArray(data.balances)) {
      console.warn('⚠️ No balances array found in Spot response, returning empty array');
      return [];
    }
    return data.balances
      .filter((balance: any) => parseFloat(balance.free || 0) > 0 || parseFloat(balance.locked || 0) > 0)
      .map((balance: any) => ({
        symbol: balance.asset,
        free_balance: parseFloat(balance.free || 0),
        locked_balance: parseFloat(balance.locked || 0),
        total_balance: parseFloat(balance.free || 0) + parseFloat(balance.locked || 0)
      }))
  }
}

/**
 * Get Binance Demo Balances (for backward compatibility)
 */
export async function getBinanceDemoBalances(apiKey: any, marketType: string = 'spot', platform: string = 'binance-demo') {
  console.log('⚠️ getBinanceDemoBalances is deprecated, using getBinanceBalancesByPlatform');
  return getBinanceBalancesByPlatform(apiKey, platform, marketType);
}

/**
 * Test Binance Spot Testnet Connection
 */
export async function testBinanceSpotTestnetConnection(apiKey: any) {
  console.log('Testing Binance Spot Testnet connection...')
  
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}`
  const signature = await createHmacSignature(queryString, apiKey.secret_key)
  
  const response = await fetch(`https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`, {
    headers: {
      'X-MBX-APIKEY': apiKey.api_key
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Binance Spot Testnet API error:', errorText)
    throw new Error(`Binance Spot Testnet API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Binance Spot Testnet connection test successful')
  return result
}

/**
 * Get Binance Spot Testnet Balances
 */
export async function getBinanceSpotTestnetBalances(apiKey: any) {
  console.log('Getting Binance Spot Testnet balances...')
  
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}`
  const signature = await createHmacSignature(queryString, apiKey.secret_key)
  
  const response = await fetch(`https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`, {
    headers: {
      'X-MBX-APIKEY': apiKey.api_key
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Binance Spot Testnet API error:', errorText)
    throw new Error(`Binance Spot Testnet API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('📊 Processing Spot Testnet balances:', data.balances?.length || 0, 'balances found');
  
  if (!data.balances || !Array.isArray(data.balances)) {
    console.warn('⚠️ No balances array found in Spot Testnet response, returning empty array');
    return [];
  }
  
  return data.balances
    .filter((balance: any) => parseFloat(balance.free || 0) > 0 || parseFloat(balance.locked || 0) > 0)
    .map((balance: any) => ({
      symbol: balance.asset,
      free_balance: parseFloat(balance.free || 0),
      locked_balance: parseFloat(balance.locked || 0),
      total_balance: parseFloat(balance.free || 0) + parseFloat(balance.locked || 0)
    }))
}

// دالة قديمة للتوافق مع الكود القديم
export async function getBinanceFuturesTestnetBalances(apiKey: any) {
  console.log('⚠️ getBinanceFuturesTestnetBalances is deprecated, using getBinanceDemoBalances with futures');
  return getBinanceDemoBalances(apiKey, 'futures');
}
