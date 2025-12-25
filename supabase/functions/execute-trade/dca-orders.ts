/**
 * DCA Orders Operations
 * 
 * Functions for placing DCA (Dollar Cost Averaging) orders
 */

import { placeBinanceOrder, OrderResponse } from './orders.ts';
import { SymbolRules } from './symbol.ts';
import { sleep } from './utils.ts';
import { ORDER_DELAYS } from './config.ts';

/**
 * DCA Level
 */
export interface DCALevel {
  level: number;
  targetPrice: number;
  amount: number;
}

/**
 * Place DCA order
 */
async function placeDCAOrder(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  level: DCALevel,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules
): Promise<OrderResponse & { orderType: string; level: number }> {
  const dcaQuantity = level.amount / level.targetPrice;
  
  console.log(`Placing DCA Level ${level.level}: quantity=${dcaQuantity} at price=${level.targetPrice}`);
  
  const dcaOrder = await placeBinanceOrder(
    apiKey,
    secretKey,
    baseUrl,
    symbol,
    'BUY',
    dcaQuantity,
    'LIMIT',
    level.targetPrice,
    undefined,
    marketType,
    symbolRules
  );
  
  console.log(`DCA Level ${level.level} order placed successfully - Order ID: ${dcaOrder.orderId}`);
  
  return {
    ...dcaOrder,
    orderType: 'DCA',
    level: level.level
  };
}

/**
 * Place all DCA orders
 */
export async function placeDCAOrders(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  dcaLevels: DCALevel[],
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules
): Promise<Array<OrderResponse & { orderType: string; level: number }>> {
  const placedOrders: Array<OrderResponse & { orderType: string; level: number }> = [];
  
  if (!dcaLevels || dcaLevels.length === 0) {
    return placedOrders;
  }
  
  console.log(`Placing ${dcaLevels.length} DCA orders...`);
  
  // Sort DCA levels to ensure correct order (1, 2, 3, 4, 5)
  const sortedDcaLevels = [...dcaLevels].sort((a, b) => a.level - b.level);
  
  for (const level of sortedDcaLevels) {
    try {
      const order = await placeDCAOrder(
        apiKey,
        secretKey,
        baseUrl,
        symbol,
        level,
        marketType,
        symbolRules
      );
      
      placedOrders.push(order);
      
      // Longer delay between DCA orders to avoid rate limits
      await sleep(ORDER_DELAYS.DCA);
    } catch (dcaError) {
      console.error(`Failed to place DCA Level ${level.level} order:`, dcaError);
      console.error(`DCA Level ${level.level} error details:`, {
        targetPrice: level.targetPrice,
        quantity: level.amount / level.targetPrice,
        amount: level.amount
      });
      // Continue with other orders even if one fails
    }
  }
  
  console.log(
    `Completed DCA order placement. Successfully placed: ${placedOrders.length} out of ${dcaLevels.length} DCA orders`
  );
  
  return placedOrders;
}


