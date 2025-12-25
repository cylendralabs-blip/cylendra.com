/**
 * OKX Platform Implementation
 * 
 * OKX exchange integration with full demo mode support
 */

import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { SymbolRules } from '../symbol.ts';
import { formatQuantity, formatPrice } from '../utils.ts';
import { ExecuteTradeError, ExecuteTradeErrorCode, createError, parseExchangeError } from '../errors.ts';
import { withRetry } from '../retry.ts';

/**
 * OKX API Configuration
 */
const OKX_BASE_URL = 'https://www.okx.com';

/**
 * Get OKX base URL
 * Note: OKX uses the same base URL for both live and demo trading
 * Demo mode is controlled via the x-simulated-trading header
 */
function getOKXBaseUrl(testnet: boolean): string {
  return OKX_BASE_URL; // Same URL for both modes
}

/**
 * OKX Credentials
 */
interface OKXCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  testnet: boolean; // Demo mode flag
}

/**
 * Format symbol for OKX (BTC/USDT -> BTC-USDT)
 */
function formatOKXSymbol(symbol: string): string {
  return symbol.replace('/', '-');
}

/**
 * Create OKX signature (HMAC SHA256 Base64)
 */
function createOKXSignature(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const message = timestamp + method + requestPath + body;
  return createHmac('sha256', secretKey).update(message).digest('base64');
}

/**
 * Make authenticated OKX request
 */
async function makeOKXRequest(
  endpoint: string,
  method: string,
  credentials: OKXCredentials,
  body?: any
): Promise<any> {
  const baseUrl = getOKXBaseUrl(credentials.testnet);
  const timestamp = new Date().toISOString();
  const requestPath = endpoint;
  const bodyString = body ? JSON.stringify(body) : '';

  const signature = createOKXSignature(
    timestamp,
    method,
    requestPath,
    bodyString,
    credentials.secretKey
  );

  const headers: Record<string, string> = {
    'OK-ACCESS-KEY': credentials.apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': credentials.passphrase,
    'Content-Type': 'application/json'
  };

  // IMPORTANT: Add demo trading header if testnet mode
  if (credentials.testnet) {
    headers['x-simulated-trading'] = '1';
  }

  const url = `${baseUrl}${endpoint}`;

  console.log(`[OKX${credentials.testnet ? ' Demo' : ''}] ${method} ${endpoint}`);

  const response = await fetch(url, {
    method,
    headers,
    body: bodyString || undefined
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { msg: responseText };
    }

    console.error('[OKX] API Error:', errorData);
    throw parseExchangeError(errorData, 'okx');
  }

  const data = JSON.parse(responseText);

  // OKX returns code "0" for success
  if (data.code && data.code !== '0') {
    console.error('[OKX] API Error:', data);
    throw createError(
      ExecuteTradeErrorCode.EXCHANGE_API_ERROR,
      data.msg || 'OKX API error'
    );
  }

  return data.data || data;
}

/**
 * Get OKX instrument info
 */
export async function getOKXInstrumentInfo(
  credentials: OKXCredentials,
  symbol: string,
  marketType: 'spot' | 'futures'
): Promise<SymbolRules | null> {
  try {
    const formattedSymbol = formatOKXSymbol(symbol);
    const instType = marketType === 'futures' ? 'SWAP' : 'SPOT';

    const endpoint = `/api/v5/public/instruments?instType=${instType}&instId=${formattedSymbol}`;
    const data = await withRetry(() => makeOKXRequest(endpoint, 'GET', credentials));

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw createError(ExecuteTradeErrorCode.SYMBOL_NOT_SUPPORTED, `Symbol ${symbol} not found on OKX`);
    }

    const instrument = data[0];

    // Extract trading rules
    const lotSz = instrument.lotSz || '0.001';
    const minSz = instrument.minSz || '0.001';
    const tickSz = instrument.tickSz || '0.01';

    const stepSize = parseFloat(lotSz);
    const minQty = parseFloat(minSz);
    const tickSize = parseFloat(tickSz);

    const quantityPrecision = stepSize >= 1 ? 0 : -Math.floor(Math.log10(stepSize));
    const pricePrecision = tickSize >= 1 ? 0 : -Math.floor(Math.log10(tickSize));

    return {
      quantityPrecision: Math.max(0, quantityPrecision),
      pricePrecision: Math.max(0, pricePrecision),
      tickSize,
      minQty,
      stepSize
    };
  } catch (error) {
    console.error('[OKX] Error getting instrument info:', error);
    throw error;
  }
}

/**
 * Set OKX leverage
 */
export async function setOKXLeverage(
  credentials: OKXCredentials,
  symbol: string,
  leverage: number
): Promise<void> {
  try {
    const formattedSymbol = formatOKXSymbol(symbol);

    const endpoint = '/api/v5/account/set-leverage';
    const body = {
      instId: formattedSymbol,
      lever: leverage.toString(),
      mgnMode: 'isolated' // or 'cross'
    };

    await withRetry(() => makeOKXRequest(endpoint, 'POST', credentials, body));
    console.log(`[OKX] Leverage set to ${leverage}x for ${formattedSymbol}`);
  } catch (error) {
    console.error('[OKX] Error setting leverage:', error);
    throw error;
  }
}

/**
 * Place OKX order
 */
export async function placeOKXOrder(
  credentials: OKXCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  orderType: 'MARKET' | 'LIMIT',
  quantity: number,
  price: number | undefined,
  stopPrice: number | undefined,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules,
  clientOrderId?: string
): Promise<any> {
  try {
    const formattedSymbol = formatOKXSymbol(symbol);
    const instType = marketType === 'futures' ? 'SWAP' : 'SPOT';

    // Format quantity and price
    const formattedQuantity = formatQuantity(
      quantity,
      symbolRules.quantityPrecision,
      symbolRules.minQty
    );

    const orderParams: any = {
      instId: formattedSymbol,
      tdMode: marketType === 'futures' ? 'isolated' : 'cash',
      side: side.toLowerCase(),
      ordType: orderType === 'MARKET' ? 'market' : 'limit',
      sz: formattedQuantity
    };

    if (orderType === 'LIMIT' && price) {
      orderParams.px = formatPrice(price, symbolRules.pricePrecision, symbolRules.tickSize);
    }

    if (stopPrice) {
      orderParams.slTriggerPx = formatPrice(stopPrice, symbolRules.pricePrecision, symbolRules.tickSize);
      orderParams.slTriggerPxType = 'last';
    }

    if (clientOrderId) {
      orderParams.clOrdId = clientOrderId;
    }

    const endpoint = '/api/v5/trade/order';
    const response = await withRetry(() => makeOKXRequest(endpoint, 'POST', credentials, orderParams));

    console.log('[OKX] Order placed:', response);

    return response;
  } catch (error) {
    console.error('[OKX] Error placing order:', error);
    throw error;
  }
}

/**
 * Cancel all OKX orders for symbol
 */
export async function cancelAllOKXOrders(
  credentials: OKXCredentials,
  symbol: string,
  marketType: 'spot' | 'futures'
): Promise<void> {
  try {
    const formattedSymbol = formatOKXSymbol(symbol);
    const instType = marketType === 'futures' ? 'SWAP' : 'SPOT';

    const endpoint = `/api/v5/trade/cancel-all-after?instType=${instType}&instId=${formattedSymbol}`;

    await withRetry(() => makeOKXRequest(endpoint, 'POST', credentials));
    console.log(`[OKX] Cancelled all orders for ${formattedSymbol}`);
  } catch (error) {
    console.error('[OKX] Error cancelling orders:', error);
    // Non-critical, continue
  }
}

/**
 * Get OKX wallet balance
 */
export async function getOKXBalance(
  credentials: OKXCredentials,
  currency?: string
): Promise<any> {
  try {
    const endpoint = '/api/v5/account/balance';
    const params = currency ? { ccy: currency } : undefined;

    const response = await withRetry(() => makeOKXRequest(endpoint, 'GET', credentials, params));

    return response;
  } catch (error) {
    console.error('[OKX] Error getting balance:', error);
    throw error;
  }
}

/**
 * Get OKX order status
 */
export async function getOKXOrderStatus(
  credentials: OKXCredentials,
  orderId: string,
  clientOrderId?: string,
  marketType: 'spot' | 'futures' = 'spot'
): Promise<any> {
  try {
    const instType = marketType === 'futures' ? 'SWAP' : 'SPOT';
    let endpoint = `/api/v5/trade/order?instType=${instType}`;
    
    if (orderId) {
      endpoint += `&ordId=${orderId}`;
    } else if (clientOrderId) {
      endpoint += `&clOrdId=${clientOrderId}`;
    } else {
      throw createError(ExecuteTradeErrorCode.INVALID_PARAMETERS, 'Either orderId or clientOrderId is required');
    }

    const data = await withRetry(() => makeOKXRequest(endpoint, 'GET', credentials));
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('[OKX] Error getting order status:', error);
    throw error;
  }
}

/**
 * Place OKX conditional order (for Stop-Loss/Take-Profit)
 */
export async function placeOKXConditionalOrder(
  credentials: OKXCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  orderType: 'MARKET' | 'LIMIT',
  quantity: number,
  triggerPrice: number,
  price: number | undefined,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules,
  clientOrderId?: string
): Promise<any> {
  try {
    const formattedSymbol = formatOKXSymbol(symbol);
    const instType = marketType === 'futures' ? 'SWAP' : 'SPOT';

    const formattedQuantity = formatQuantity(
      quantity,
      symbolRules.quantityPrecision,
      symbolRules.minQty
    );

    const orderParams: any = {
      instId: formattedSymbol,
      tdMode: marketType === 'futures' ? 'isolated' : 'cash',
      side: side.toLowerCase(),
      ordType: orderType === 'MARKET' ? 'market' : 'limit',
      sz: formattedQuantity,
      triggerPx: formatPrice(triggerPrice, symbolRules.pricePrecision, symbolRules.tickSize),
      triggerPxType: 'last' // or 'index', 'mark'
    };

    if (orderType === 'LIMIT' && price) {
      orderParams.orderPx = formatPrice(price, symbolRules.pricePrecision, symbolRules.tickSize);
    }

    if (clientOrderId) {
      orderParams.clOrdId = clientOrderId;
    }

    const endpoint = '/api/v5/trade/order-algo';
    const response = await withRetry(() => makeOKXRequest(endpoint, 'POST', credentials, orderParams));

    console.log('[OKX] Conditional order placed:', response);

    return response;
  } catch (error) {
    console.error('[OKX] Error placing conditional order:', error);
    throw error;
  }
}

/**
 * Test OKX connection
 */
export async function testOKXConnection(credentials: OKXCredentials): Promise<boolean> {
  try {
    await getOKXBalance(credentials);
    return true;
  } catch (error) {
    console.error('[OKX] Connection test failed:', error);
    return false;
  }
}
