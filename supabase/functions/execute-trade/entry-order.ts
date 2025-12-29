/**
 * Entry Order Operations
 * 
 * Functions for placing entry orders
 */

import { placeBinanceOrder, OrderResponse } from './orders.ts';
import { SymbolRules } from './symbol.ts';
import { sleep } from './utils.ts';
import { ORDER_DELAYS } from './config.ts';

/**
 * Place entry order
 */
export async function placeEntryOrder(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  quantity: number,
  orderType: 'market' | 'limit',
  entryPrice: number | undefined,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules
): Promise<OrderResponse & { orderType: string; level: number }> {
  try {
    console.log(`Placing ENTRY order: ${orderType.toUpperCase()} ${quantity} ${symbol}`);
    
    const entryOrder = await placeBinanceOrder(
      apiKey,
      secretKey,
      baseUrl,
      symbol,
      'BUY',
      quantity,
      orderType.toUpperCase(),
      orderType === 'limit' ? entryPrice : undefined,
      undefined,
      marketType,
      symbolRules
    );
    
    console.log('Entry order placed successfully - Order ID:', entryOrder.orderId);
    
    // Small delay before next operation
    await sleep(ORDER_DELAYS.ENTRY);
    
    return {
      ...entryOrder,
      orderType: 'ENTRY',
      level: 0
    };
  } catch (error) {
    console.error('Failed to place entry order:', error);
    throw error;
  }
}


