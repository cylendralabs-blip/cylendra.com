/**
 * Leverage Operations
 * 
 * Functions for setting leverage in futures trading
 */

import { createSignature, getBinanceServerTime } from './utils.ts';

/**
 * Format symbol for Binance API
 */
function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

/**
 * Set leverage for futures trading
 */
export async function setBinanceLeverage(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  leverage: number
): Promise<void> {
  try {
    // Use Binance server time
    const timestamp = await getBinanceServerTime(baseUrl);
    const formattedSymbol = formatSymbol(symbol);

    const params = {
      symbol: formattedSymbol,
      leverage: leverage.toString(),
      timestamp: timestamp.toString(),
      recvWindow: '120000',  // Increased to 120 seconds
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString, secretKey);
    const finalQuery = `${queryString}&signature=${signature}`;

    console.log(`Setting leverage for ${formattedSymbol} to ${leverage}x`);

    const response = await fetch(`${baseUrl}/fapi/v1/leverage`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalQuery
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Failed to set leverage: ${responseText}`);
      throw new Error(`Failed to set leverage: ${response.status} - ${responseText}`);
    }

    const responseData = JSON.parse(responseText);
    console.log(`Leverage set successfully:`, responseData);
  } catch (error) {
    console.error('Error setting leverage:', error);
    throw error;
  }
}

