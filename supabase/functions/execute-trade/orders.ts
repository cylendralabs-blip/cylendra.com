/**
 * Order Operations
 * 
 * Functions for placing and managing orders
 */

import { createSignature, formatQuantity, formatPrice, getBinanceServerTime, parseBinanceError } from './utils.ts';
import { getSymbolInfo, SymbolRules } from './symbol.ts';

/**
 * Format symbol for Binance API
 */
function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

/**
 * Order Response
 */
export interface OrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId?: string;
  price?: string;
  origQty: string;
  executedQty: string;
  status: string;
  type: string;
  side: string;
  [key: string]: any;
}

/**
 * Place Binance order
 */
export async function placeBinanceOrder(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  side: string,
  quantity: number,
  orderType: string,
  price: number | undefined,
  stopPrice: number | undefined,
  marketType: string,
  symbolRules?: SymbolRules | null
): Promise<OrderResponse> {
  try {
    // Use Binance server time to prevent sync issues
    const timestamp = await getBinanceServerTime(baseUrl);
    const formattedSymbol = formatSymbol(symbol);

    console.log(`Placing ${orderType} order for ${formattedSymbol}: ${side} ${quantity} at ${price || 'market price'}`);

    // Get symbol rules if not provided
    let rules = symbolRules;
    if (!rules) {
      rules = await getSymbolInfo(apiKey, secretKey, baseUrl, symbol, marketType);
      if (!rules) {
        throw new Error(`Unable to get trading rules for ${formattedSymbol}`);
      }
    }

    const { quantityPrecision, pricePrecision, tickSize, minQty, stepSize } = rules;

    // Format quantity
    let adjustedQuantity = quantity;
    if (stepSize > 0) {
      adjustedQuantity = Math.round(quantity / stepSize) * stepSize;
    }
    adjustedQuantity = Math.max(adjustedQuantity, minQty);
    const formattedQuantity = formatQuantity(adjustedQuantity, quantityPrecision, minQty);

    if (parseFloat(formattedQuantity) < minQty) {
      throw new Error(`Formatted quantity ${formattedQuantity} is below minimum ${minQty} for ${formattedSymbol}`);
    }

    // Build order parameters
    const params: any = {
      symbol: formattedSymbol,
      side: side.toUpperCase(),
      type: orderType.toUpperCase(),
      quantity: formattedQuantity,
      timestamp: timestamp,
      recvWindow: 120000  // Increased from 60000 to 120000 (2 minutes) for better tolerance
    };

    // Add price for limit orders
    if (orderType.toUpperCase() === 'LIMIT' && price) {
      params.price = formatPrice(price, pricePrecision, tickSize);
      params.timeInForce = 'GTC';
    }

    // Add stop price for stop orders
    if (orderType.toUpperCase() === 'STOP_MARKET' && stopPrice) {
      params.stopPrice = formatPrice(stopPrice, pricePrecision, tickSize);
    }

    if (orderType.toUpperCase() === 'TAKE_PROFIT_MARKET' && stopPrice) {
      params.stopPrice = formatPrice(stopPrice, pricePrecision, tickSize);
    }

    // Create signature and make request
    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString, secretKey);
    const finalQuery = `${queryString}&signature=${signature}`;

    const endpoint = marketType === 'futures' ? '/fapi/v1/order' : '/api/v3/order';
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalQuery
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Binance API error ${response.status}: ${responseText}`);
      const errorMessage = parseBinanceError(responseText);
      throw new Error(`Binance API error: ${errorMessage}`);
    }

    const responseData = JSON.parse(responseText);
    console.log(`Order placed successfully:`, responseData);
    return responseData;
  } catch (error) {
    console.error('Error placing Binance order:', error);
    throw error;
  }
}

/**
 * Cancel all orders for symbol
 */
export async function cancelAllOrdersForSymbol(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  marketType: string = 'spot'
): Promise<void> {
  try {
    console.log(`Cancelling all orders for ${symbol}`);

    // Use Binance server time
    const timestamp = await getBinanceServerTime(baseUrl);
    const formattedSymbol = formatSymbol(symbol);

    const params = {
      symbol: formattedSymbol,
      timestamp: timestamp.toString(),
      recvWindow: '120000',  // Increased to 120 seconds
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString, secretKey);
    const finalQuery = `${queryString}&signature=${signature}`;

    const endpoint = marketType === 'futures'
      ? '/fapi/v1/allOpenOrders'
      : '/api/v3/openOrders';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalQuery
    });

    if (response.ok) {
      console.log(`Successfully cancelled all orders for ${formattedSymbol}`);
    } else {
      console.log(`No orders to cancel for ${formattedSymbol} or error occurred`);
    }
  } catch (error) {
    console.error('Error cancelling orders:', error);
  }
}

