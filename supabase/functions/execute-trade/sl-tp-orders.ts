/**
 * Stop Loss / Take Profit Orders Operations
 * 
 * Functions for placing SL/TP orders
 */

import { placeBinanceOrder, OrderResponse } from './orders.ts';
import { SymbolRules } from './symbol.ts';
import { sleep } from './utils.ts';
import { ORDER_DELAYS } from './config.ts';

/**
 * DCALevel interface
 */
interface DCALevel {
  level: number;
  targetPrice: number;
  amount: number;
}

/**
 * Calculate total quantity including DCA levels
 */
function calculateTotalQuantity(
  entryQuantity: number,
  dcaLevels?: DCALevel[]
): number {
  const dcaQuantity = dcaLevels?.reduce(
    (sum, level) => sum + (level.amount / level.targetPrice),
    0
  ) || 0;
  
  return entryQuantity + dcaQuantity;
}

/**
 * Place Stop Loss order
 */
export async function placeStopLossOrder(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  entryQuantity: number,
  stopLossPrice: number,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules,
  dcaLevels?: DCALevel[]
): Promise<(OrderResponse & { orderType: string; level: number }) | null> {
  if (!stopLossPrice) {
    return null;
  }
  
  try {
    console.log('Placing STOP LOSS order...');
    
    const totalQuantity = calculateTotalQuantity(entryQuantity, dcaLevels);
    
    const orderType = marketType === 'futures' ? 'STOP_MARKET' : 'STOP_LOSS_LIMIT';
    const limitPrice = marketType === 'futures'
      ? undefined
      : stopLossPrice * 0.999; // Slightly below stop price for spot
    
    const stopLossOrder = await placeBinanceOrder(
      apiKey,
      secretKey,
      baseUrl,
      symbol,
      'SELL',
      totalQuantity,
      orderType,
      limitPrice,
      stopLossPrice,
      marketType,
      symbolRules
    );
    
    console.log('Stop Loss order placed successfully - Order ID:', stopLossOrder.orderId);
    
    await sleep(ORDER_DELAYS.STOP_LOSS);
    
    return {
      ...stopLossOrder,
      orderType: 'STOP_LOSS',
      level: -1
    };
  } catch (stopLossError) {
    console.error('Failed to place Stop Loss order:', stopLossError);
    return null;
  }
}

/**
 * Place Take Profit order
 */
export async function placeTakeProfitOrder(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  entryQuantity: number,
  takeProfitPrice: number,
  marketType: 'spot' | 'futures',
  symbolRules: SymbolRules,
  dcaLevels?: DCALevel[]
): Promise<(OrderResponse & { orderType: string; level: number }) | null> {
  if (!takeProfitPrice) {
    return null;
  }
  
  try {
    console.log('Placing TAKE PROFIT order...');
    
    const totalQuantity = calculateTotalQuantity(entryQuantity, dcaLevels);
    
    const orderType = marketType === 'futures' ? 'TAKE_PROFIT_MARKET' : 'LIMIT';
    const stopPrice = marketType === 'futures' ? takeProfitPrice : undefined;
    
    const takeProfitOrder = await placeBinanceOrder(
      apiKey,
      secretKey,
      baseUrl,
      symbol,
      'SELL',
      totalQuantity,
      orderType,
      takeProfitPrice,
      stopPrice,
      marketType,
      symbolRules
    );
    
    console.log('Take Profit order placed successfully - Order ID:', takeProfitOrder.orderId);
    
    return {
      ...takeProfitOrder,
      orderType: 'TAKE_PROFIT',
      level: -2
    };
  } catch (takeProfitError) {
    console.error('Failed to place Take Profit order:', takeProfitError);
    return null;
  }
}


