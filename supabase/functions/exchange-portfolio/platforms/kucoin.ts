
import { createHmacSignature } from '../utils/crypto.ts';

export async function testKuCoinConnection(apiKey: any) {
  const timestamp = Date.now().toString()
  const method = 'GET'
  const endpoint = '/api/v1/accounts'
  const message = timestamp + method + endpoint
  const signature = await createHmacSignature(message, apiKey.secret_key, 'base64')
  
  const response = await fetch(`https://api.kucoin.com${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey.api_key,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': await createHmacSignature(apiKey.passphrase || '', apiKey.secret_key, 'base64'),
      'KC-API-KEY-VERSION': '2'
    }
  })

  if (!response.ok) {
    throw new Error(`KuCoin API error: ${response.status}`)
  }

  return await response.json()
}

export async function getKuCoinBalances(apiKey: any) {
  const timestamp = Date.now().toString()
  const method = 'GET'
  const endpoint = '/api/v1/accounts'
  const message = timestamp + method + endpoint
  const signature = await createHmacSignature(message, apiKey.secret_key, 'base64')
  
  const response = await fetch(`https://api.kucoin.com${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey.api_key,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': await createHmacSignature(apiKey.passphrase || '', apiKey.secret_key, 'base64'),
      'KC-API-KEY-VERSION': '2'
    }
  })

  if (!response.ok) {
    throw new Error(`KuCoin API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data.map((account: any) => ({
    symbol: account.currency,
    free_balance: parseFloat(account.available),
    locked_balance: parseFloat(account.holds),
    total_balance: parseFloat(account.balance)
  }))
}
