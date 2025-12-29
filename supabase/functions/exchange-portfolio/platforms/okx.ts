
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

/**
 * Get OKX base URL
 * Note: OKX uses the same base URL for both live and demo trading
 * Demo mode is controlled via the x-simulated-trading header
 */
function getOKXBaseUrl(): string {
  return 'https://www.okx.com';
}

/**
 * Build OKX headers with proper demo mode support
 * Note: timestamp and signature should be set by caller to ensure consistency
 */
function buildOKXHeaders(apiKey: any, isDemo: boolean, timestamp: string): Record<string, string> {
  // Note: Passphrase and signature will be set by caller to ensure consistency
  const headers: Record<string, string> = {
    'OK-ACCESS-KEY': apiKey.api_key,
    'OK-ACCESS-SIGN': '', // Will be set after signature calculation
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': '', // Will be set to passphrase (as-is) by caller
    'Content-Type': 'application/json'
  };

  // IMPORTANT: Add demo trading header if demo/testnet mode
  if (isDemo) {
    headers['x-simulated-trading'] = '1';
  }

  return headers;
}

export async function testOKXConnection(apiKey: any) {
  console.log('Testing OKX connection...', { 
    platform: apiKey.platform, 
    testnet: apiKey.testnet 
  });
  
  const isDemo = apiKey.platform === 'okx-demo' || apiKey.testnet === true;
  const timestamp = new Date().toISOString();
  const method = 'GET';
  const requestPath = '/api/v5/account/balance';
  const body = ''; // Empty body for GET request
  
  // OKX requires: timestamp + method + requestPath + body (even if empty)
  const message = timestamp + method + requestPath + body;
  console.log('🔐 Signature message:', message);
  
  // Use same createHmac as execute-trade for consistency
  const signature = createHmac('sha256', apiKey.secret_key).update(message).digest('base64');
  console.log('✅ Signature created:', signature.substring(0, 20) + '...');
  
  if (!apiKey.passphrase) {
    throw new Error('OKX requires a passphrase to connect. Please add the passphrase in your API settings.');
  }
  
  // OKX passphrase should be sent as-is (not base64 encoded)
  // According to OKX documentation and execute-trade implementation
  // IMPORTANT: Use same timestamp for headers and signature
  const headers = buildOKXHeaders(apiKey, isDemo, timestamp);
  headers['OK-ACCESS-SIGN'] = signature;
  headers['OK-ACCESS-PASSPHRASE'] = apiKey.passphrase;
  
  console.log('Making OKX API request...', { 
    url: `${getOKXBaseUrl()}${requestPath}`,
    isDemo,
    hasDemoHeader: !!headers['x-simulated-trading']
  });
  
  try {
    const response = await fetch(`${getOKXBaseUrl()}${requestPath}`, {
      headers
    })

    console.log('OKX API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OKX API error response:', errorText)
      throw new Error(`OKX API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    
    if (result.code !== "0") {
      console.error('OKX API returned error code:', result.code, result.msg)
      throw new Error(`OKX API error: ${result.msg}`)
    }

    console.log('OKX connection test successful')
    return result
  } catch (error) {
    console.error('OKX connection test failed:', error)
    throw error
  }
}

export async function getOKXBalances(apiKey: any) {
  const isDemo = apiKey.platform === 'okx-demo' || apiKey.testnet === true;
  const timestamp = new Date().toISOString();
  const method = 'GET';
  const requestPath = '/api/v5/account/balance';
  const body = ''; // Empty body for GET request
  
  console.log('🔍 Starting OKX balance fetch...', {
    platform: apiKey.platform,
    isDemo,
    hasPassphrase: !!apiKey.passphrase,
    hasApiKey: !!apiKey.api_key,
    hasSecretKey: !!apiKey.secret_key
  });
  
  // OKX requires: timestamp + method + requestPath + body (even if empty)
  const message = timestamp + method + requestPath + body;
  console.log('🔐 Creating signature with message:', {
    timestamp,
    method,
    requestPath,
    bodyLength: body.length,
    messageLength: message.length,
    messagePreview: message.substring(0, 50) + '...',
    fullMessage: message
  });
  
  // Use same createHmac as execute-trade for consistency
  const signature = createHmac('sha256', apiKey.secret_key).update(message).digest('base64');
  console.log('✅ Signature created, length:', signature.length, 'preview:', signature.substring(0, 20) + '...');
  
  if (!apiKey.passphrase) {
    console.error('❌ OKX passphrase missing');
    throw new Error('OKX requires a passphrase to fetch balances');
  }
  
  // OKX passphrase should be sent as-is (not base64 encoded)
  // According to OKX documentation and execute-trade implementation
  // IMPORTANT: Use same timestamp for headers and signature
  const headers = buildOKXHeaders(apiKey, isDemo, timestamp);
  headers['OK-ACCESS-SIGN'] = signature;
  headers['OK-ACCESS-PASSPHRASE'] = apiKey.passphrase;
  
  console.log('📋 Headers:', {
    'OK-ACCESS-KEY': headers['OK-ACCESS-KEY']?.substring(0, 10) + '...',
    'OK-ACCESS-TIMESTAMP': headers['OK-ACCESS-TIMESTAMP'],
    'OK-ACCESS-PASSPHRASE': headers['OK-ACCESS-PASSPHRASE'] ? '***' : 'missing',
    'OK-ACCESS-SIGN': headers['OK-ACCESS-SIGN']?.substring(0, 20) + '...',
    'x-simulated-trading': headers['x-simulated-trading']
  });
  
  console.log('📡 Making OKX API request...', { 
    url: `${getOKXBaseUrl()}${requestPath}`,
    isDemo,
    hasDemoHeader: !!headers['x-simulated-trading'],
    timestamp
  });
  
  try {
    const response = await fetch(`${getOKXBaseUrl()}${requestPath}`, {
      headers
    });

    console.log('📥 OKX API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OKX API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`OKX API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Log full response for debugging (but mask sensitive data)
    console.log('📋 OKX API response structure:', {
      code: data.code,
      msg: data.msg,
      hasData: !!data.data,
      dataType: typeof data.data,
      isArray: Array.isArray(data.data),
      dataLength: data.data?.length || 0,
      firstAccountKeys: data.data?.[0] ? Object.keys(data.data[0]) : null,
      firstAccountDetailsLength: data.data?.[0]?.details?.length || 0
    });
    
    // ALWAYS log full response for debugging OKX issues
    console.log('🔍 Full OKX API response (for debugging):', JSON.stringify(data, null, 2));
    
    // Log response text if data is empty
    if (!data.data || data.data.length === 0) {
      console.log('⚠️ OKX API returned empty data array');
      console.log('📋 Response code:', data.code);
      console.log('📋 Response message:', data.msg);
      console.log('📋 Full response object:', JSON.stringify(data, null, 2));
    }
    
    if (data.code !== "0") {
      console.error('❌ OKX API error:', data.code, data.msg);
      throw new Error(`OKX API error: ${data.msg || 'Unknown error'}`);
    }

    // Normalize balances to standard format
    const balances: Array<{
      asset: string;
      total: number;
      available: number;
      inOrder: number;
    }> = [];
    
    // OKX API response structure: { code: "0", data: [{ details: [{ ccy, bal, availBal, frozenBal }] }] }
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log('📊 Processing OKX account data, number of accounts:', data.data.length);
      
      for (let i = 0; i < data.data.length; i++) {
        const account = data.data[i];
        console.log(`📦 Processing account ${i + 1}:`, {
          accountKeys: Object.keys(account),
          hasDetails: !!account.details,
          detailsType: Array.isArray(account.details) ? 'array' : typeof account.details,
          detailsLength: account.details?.length || 0
        });
        
        // OKX returns details as an array
        if (account.details && Array.isArray(account.details) && account.details.length > 0) {
          for (const balance of account.details) {
            if (!balance.ccy) {
              console.log('⚠️ Skipping balance item without ccy:', balance);
              continue;
            }
            
            // OKX API fields: bal (total), availBal (available), frozenBal (in order)
            // If bal is 0 or missing, try cashBal or calculate from available + frozen
            let total = parseFloat(balance.bal || balance.balance || '0');
            const available = parseFloat(balance.availBal || balance.avail || balance.available || '0');
            const inOrder = parseFloat(balance.frozenBal || balance.frozen || balance.locked || '0');
            
            // If total is 0 but we have available or inOrder, use cashBal or calculate total
            if (total === 0 && (available > 0 || inOrder > 0)) {
              // Try cashBal (cash balance) as total
              const cashBal = parseFloat(balance.cashBal || '0');
              if (cashBal > 0) {
                total = cashBal;
              } else {
                // Calculate total from available + inOrder
                total = available + inOrder;
              }
            }
            
            console.log('💰 OKX balance item:', {
              ccy: balance.ccy,
              total,
              available,
              inOrder,
              bal: balance.bal,
              cashBal: balance.cashBal,
              availBal: balance.availBal,
              frozenBal: balance.frozenBal
            });
            
            // إضافة الرصيد حتى لو كان صفراً (لكن سنفلتره لاحقاً)
            balances.push({
              asset: balance.ccy,
              total,
              available,
              inOrder
            });
          }
        } else {
          console.log('⚠️ Account has no details array or details is empty');
          console.log('📋 Account structure:', JSON.stringify(account, null, 2));
        }
      }
    } else {
      console.log('⚠️ OKX API returned no data or empty data array');
      console.log('📋 Full API response structure:', JSON.stringify(data, null, 2));
      console.log('📋 Data type:', typeof data.data, 'Is array:', Array.isArray(data.data));
      console.log('⚠️ Possible reasons for empty data:');
      console.log('   1. Account is empty (no funds)');
      console.log('   2. API Key does not have balance read permissions');
      console.log('   3. OKX Demo account with no simulated balance');
      console.log('   4. API response format changed');
    }

    console.log('✅ OKX balances normalized:', balances.length, 'items');
    if (balances.length > 0) {
      console.log('📊 OKX balances summary:', balances.map(b => ({
        asset: b.asset,
        total: b.total,
        available: b.available,
        inOrder: b.inOrder
      })));
      
      // Filter out zero balances for logging
      const nonZeroBalances = balances.filter(b => b.total > 0);
      if (nonZeroBalances.length > 0) {
        console.log('💵 OKX non-zero balances:', nonZeroBalances.length, 'items');
      } else {
        console.log('⚠️ All OKX balances are zero - account may be empty');
      }
    } else {
      console.log('⚠️ No balances found - this may indicate:');
      console.log('   1. Empty account (no funds)');
      console.log('   2. API response format issue');
      console.log('   3. Demo account with no simulated balance');
      console.log('   4. API key permissions issue');
    }

    return balances;
  } catch (error) {
    console.error('💥 Error in getOKXBalances:', error);
    throw error;
  }
}
