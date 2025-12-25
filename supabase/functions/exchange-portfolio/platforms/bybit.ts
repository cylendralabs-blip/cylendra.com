
import { createHmacSignature } from '../utils/crypto.ts';

/**
 * Get Bybit base URL based on testnet flag
 */
function getBybitBaseUrl(testnet: boolean): string {
  return testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
}

export async function testBybitConnection(apiKey: any) {
  const isTestnet = apiKey.platform === 'bybit-testnet' || apiKey.testnet === true;
  const baseUrl = getBybitBaseUrl(isTestnet);
  
  console.log('Testing Bybit connection...', { 
    platform: apiKey.platform, 
    testnet: apiKey.testnet,
    baseUrl 
  });
  
  const timestamp = Date.now().toString();
  const queryString = `api_key=${apiKey.api_key}&timestamp=${timestamp}`;
  const signature = await createHmacSignature(queryString, apiKey.secret_key);
  
  const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED&${queryString}&sign=${signature}`)

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Bybit API error response:', errorText);
    throw new Error(`Bybit API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (result.retCode !== 0) {
    console.error('Bybit API returned error code:', result.retCode, result.retMsg);
    throw new Error(`Bybit API error: ${result.retMsg || 'Unknown error'}`);
  }

  console.log('Bybit connection test successful');
  return {
    ok: true,
    raw: result
  };
}

export async function getBybitBalances(apiKey: any) {
  const isTestnet = apiKey.platform === 'bybit-testnet' || apiKey.testnet === true;
  const baseUrl = getBybitBaseUrl(isTestnet);
  
  console.log('Fetching Bybit balances...', { 
    isTestnet,
    baseUrl 
  });
  
  const timestamp = Date.now().toString();
  const queryString = `accountType=UNIFIED&api_key=${apiKey.api_key}&timestamp=${timestamp}`;
  const signature = await createHmacSignature(queryString, apiKey.secret_key);
  
  const response = await fetch(`${baseUrl}/v5/account/wallet-balance?${queryString}&sign=${signature}`)

  if (!response.ok) {
    throw new Error(`Bybit API error: ${response.status}`)
  }

  const data = await response.json();
  
  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg || 'Unknown error'}`);
  }
  
  // Normalize balances to standard format
  const balances: Array<{
    asset: string;
    total: number;
    available: number;
    inOrder: number;
  }> = [];
  
  if (data.result && data.result.list && data.result.list.length > 0) {
    for (const account of data.result.list) {
      for (const coin of account.coin) {
        balances.push({
          asset: coin.coin,
          total: parseFloat(coin.walletBalance || '0'),
          available: parseFloat(coin.availableToWithdraw || '0'),
          inOrder: parseFloat(coin.locked || '0')
        });
      }
    }
  }

  return balances;
}
