/**
 * Binance Platform Implementation
 * 
 * Binance exchange integration for execute-trade
 * Extracted from main executor for modularity
 */

import { getBinanceApiUrl } from '../config.ts';
import { getSymbolInfo, SymbolRules } from '../symbol.ts';
import { cancelAllOrdersForSymbol } from '../orders.ts';
import { setBinanceLeverage } from '../leverage.ts';
import { placeEntryOrder } from '../entry-order.ts';
import { placeDCAOrders, DCALevel } from '../dca-orders.ts';
import { placeStopLossOrder, placeTakeProfitOrder } from '../sl-tp-orders.ts';
import { ExecuteTradeError, ExecuteTradeErrorCode, createError } from '../errors.ts';
import { withRetry } from '../retry.ts';
import { generateClientOrderId } from '../idempotency.ts';

/**
 * Binance Execution Context
 */
export interface BinanceExecutionContext {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  symbol: string;
  marketType: 'spot' | 'futures';
  testnet: boolean;
  clientOrderId?: string;
}

/**
 * Execute Binance trade strategy
 */
export async function executeBinanceStrategy(
  context: BinanceExecutionContext,
  params: {
    orderType: 'market' | 'limit';
    entryPrice: number;
    quantity: number;
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
    dcaLevels: DCALevel[];
    leverage: number;
  }
): Promise<{
  success: boolean;
  placedOrders: Array<any>;
  executionStatus: string;
  error?: string;
}> {
  const placedOrders: Array<any> = [];
  let executionStatus = 'PENDING';

  try {
    // Get symbol rules
    const symbolRules = await withRetry(() =>
      getSymbolInfo(
        context.apiKey,
        context.secretKey,
        context.baseUrl,
        context.symbol,
        context.marketType
      )
    );

    if (!symbolRules) {
      throw createError(ExecuteTradeErrorCode.SYMBOL_INFO_FAILED, 'Failed to get symbol information');
    }

    // Set leverage for futures
    if (context.marketType === 'futures' && params.leverage > 1) {
      try {
        await withRetry(() =>
          setBinanceLeverage(
            context.apiKey,
            context.secretKey,
            context.baseUrl,
            context.symbol,
            params.leverage
          )
        );
      } catch (leverageError) {
        console.error('Failed to set leverage:', leverageError);
        // Continue execution
      }
    }

    // Cancel existing orders
    await cancelAllOrdersForSymbol(
      context.apiKey,
      context.secretKey,
      context.baseUrl,
      context.symbol,
      context.marketType
    );

    // Generate client order ID if not provided
    const clientOrderId = context.clientOrderId || generateClientOrderId(
      'user', // userId will be provided from context
      undefined,
      context.symbol
    );

    // Place entry order
    const entryOrder = await withRetry(() =>
      placeEntryOrder(
        context.apiKey,
        context.secretKey,
        context.baseUrl,
        context.symbol,
        params.quantity,
        params.orderType,
        params.orderType === 'limit' ? params.entryPrice : undefined,
        context.marketType,
        symbolRules
      )
    );
    placedOrders.push(entryOrder);

    // Place DCA orders
    if (params.dcaLevels && params.dcaLevels.length > 0) {
      const dcaOrders = await placeDCAOrders(
        context.apiKey,
        context.secretKey,
        context.baseUrl,
        context.symbol,
        params.dcaLevels,
        context.marketType,
        symbolRules
      );
      placedOrders.push(...dcaOrders);
    }

    // Place Stop Loss
    if (params.stopLossPrice) {
      const slOrder = await placeStopLossOrder(
        context.apiKey,
        context.secretKey,
        context.baseUrl,
        context.symbol,
        params.quantity,
        params.stopLossPrice,
        context.marketType,
        symbolRules,
        params.dcaLevels
      );
      if (slOrder) {
        placedOrders.push(slOrder);
      }
    }

    // Place Take Profit
    if (params.takeProfitPrice) {
      const tpOrder = await placeTakeProfitOrder(
        context.apiKey,
        context.secretKey,
        context.baseUrl,
        context.symbol,
        params.quantity,
        params.takeProfitPrice,
        context.marketType,
        symbolRules,
        params.dcaLevels
      );
      if (tpOrder) {
        placedOrders.push(tpOrder);
      }
    }

    executionStatus = placedOrders.length > 0 ? 'ACTIVE' : 'FAILED';

    return {
      success: placedOrders.length > 0,
      placedOrders,
      executionStatus
    };
  } catch (error) {
    console.error('Binance execution failed:', error);
    return {
      success: false,
      placedOrders,
      executionStatus: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


