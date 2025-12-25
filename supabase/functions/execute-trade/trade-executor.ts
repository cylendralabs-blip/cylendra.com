/**
 * Trade Executor
 * 
 * Main trade execution orchestration
 * Supports Binance and OKX exchanges
 */

import { getBinanceApiUrl } from './config.ts';
import { DCALevel } from './dca-orders.ts';
import { executeBinanceStrategy } from './platforms/binance.ts';
import * as okxPlatform from './platforms/okx.ts';
import { ExecuteTradeError, ExecuteTradeErrorCode, createError } from './errors.ts';
import { checkOrderExists, generateClientOrderId, storeClientOrderId } from './idempotency.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Trade Execution Request
 */
export interface TradeExecutionRequest {
  platform: 'binance' | 'okx' | 'bybit';
  symbol: string;
  marketType: 'spot' | 'futures';
  orderType: 'market' | 'limit';
  entryPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  initialAmount: number;
  dcaLevels?: DCALevel[];
  leverage: number;
  strategy?: string;
  signalId?: string;
  autoExecute: boolean;
  apiKey: string;
  secretKey: string;
  passphrase?: string; // For OKX
  testnet: boolean;
  userId: string;
  supabaseClient?: ReturnType<typeof createClient>;
}

/**
 * Trade Execution Result
 */
export interface TradeExecutionResult {
  success: boolean;
  placedOrders: Array<any>;
  executionStatus: string;
  error?: string;
}

/**
 * Execute OKX trade strategy
 */
async function executeOKXStrategy(
  request: TradeExecutionRequest
): Promise<TradeExecutionResult> {
  const {
    symbol,
    marketType,
    orderType,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    initialAmount,
    dcaLevels,
    leverage,
    apiKey,
    secretKey,
    passphrase,
    testnet,
    userId,
    signalId
  } = request;

  if (!passphrase) {
    throw createError(ExecuteTradeErrorCode.API_KEY_INVALID, 'OKX requires passphrase');
  }

  const credentials = {
    apiKey,
    secretKey,
    passphrase,
    testnet
  };

  const placedOrders: Array<any> = [];
  let executionStatus = 'PENDING';

  try {
    console.log('Executing OKX trade strategy...');

    // Generate client order ID for idempotency
    const clientOrderId = generateClientOrderId(userId, signalId, symbol);

    // Get symbol info
    const symbolRules = await okxPlatform.getOKXInstrumentInfo(
      credentials,
      symbol,
      marketType
    );

    if (!symbolRules) {
      throw createError(ExecuteTradeErrorCode.SYMBOL_INFO_FAILED, 'Failed to get symbol information');
    }

    // Set leverage for futures
    if (marketType === 'futures' && leverage > 1) {
      try {
        await okxPlatform.setOKXLeverage(credentials, symbol, leverage);
      } catch (leverageError) {
        console.error('Failed to set leverage:', leverageError);
      }
    }

    // Cancel existing orders
    await okxPlatform.cancelAllOKXOrders(credentials, symbol, marketType);

    // Calculate quantity
    const quantity = initialAmount / entryPrice;

    // Place entry order
    const entryOrder = await okxPlatform.placeOKXOrder(
      credentials,
      symbol,
      'BUY',
      orderType.toUpperCase() as 'MARKET' | 'LIMIT',
      quantity,
      orderType === 'limit' ? entryPrice : undefined,
      undefined,
      marketType,
      symbolRules,
      `${clientOrderId}-ENTRY`
    );
    placedOrders.push({ ...entryOrder, orderType: 'ENTRY', level: 0 });

    // Place DCA orders
    if (dcaLevels && dcaLevels.length > 0) {
      for (const level of dcaLevels) {
        try {
          const dcaQuantity = level.amount / level.targetPrice;
          const dcaOrder = await okxPlatform.placeOKXOrder(
            credentials,
            symbol,
            'BUY',
            'LIMIT',
            dcaQuantity,
            level.targetPrice,
            undefined,
            marketType,
            symbolRules,
            `${clientOrderId}-DCA-${level.level}`
          );
          placedOrders.push({ ...dcaOrder, orderType: 'DCA', level: level.level });
        } catch (dcaError) {
          console.error(`Failed to place DCA Level ${level.level}:`, dcaError);
        }
      }
    }

    // Place Stop Loss using Conditional Order
    if (stopLossPrice) {
      const totalQuantity = quantity + (dcaLevels?.reduce((sum, l) => sum + (l.amount / l.targetPrice), 0) || 0);
      try {
        // Use conditional order for SL: trigger when price hits stopLossPrice, then execute market sell
        const slOrder = await okxPlatform.placeOKXConditionalOrder(
          credentials,
          symbol,
          'SELL',
          'MARKET',
          totalQuantity,
          stopLossPrice, // trigger price
          undefined, // market order, no limit price
          marketType,
          symbolRules,
          `${clientOrderId}-SL`
        );
        placedOrders.push({ ...slOrder, orderType: 'STOP_LOSS', level: -1 });
        console.log('[OKX] Stop Loss conditional order placed');
      } catch (slError) {
        console.error('Failed to place Stop Loss:', slError);
        // Non-critical, continue execution
      }
    }

    // Place Take Profit using Conditional Order
    if (takeProfitPrice) {
      const totalQuantity = quantity + (dcaLevels?.reduce((sum, l) => sum + (l.amount / l.targetPrice), 0) || 0);
      try {
        // Use conditional order for TP: trigger when price hits takeProfitPrice, then execute limit sell
        const tpOrder = await okxPlatform.placeOKXConditionalOrder(
          credentials,
          symbol,
          'SELL',
          'LIMIT',
          totalQuantity,
          takeProfitPrice, // trigger price
          takeProfitPrice, // limit price (same as trigger for TP)
          marketType,
          symbolRules,
          `${clientOrderId}-TP`
        );
        placedOrders.push({ ...tpOrder, orderType: 'TAKE_PROFIT', level: -2 });
        console.log('[OKX] Take Profit conditional order placed');
      } catch (tpError) {
        console.error('Failed to place Take Profit:', tpError);
        // Non-critical, continue execution
      }
    }

    executionStatus = placedOrders.length > 0 ? 'ACTIVE' : 'FAILED';

    return {
      success: placedOrders.length > 0,
      placedOrders,
      executionStatus
    };
  } catch (error) {
    console.error('OKX execution failed:', error);
    return {
      success: false,
      placedOrders,
      executionStatus: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute complete trade strategy (unified entry point)
 */
export async function executeTradeStrategy(
  request: TradeExecutionRequest
): Promise<TradeExecutionResult> {
  const {
    platform,
    autoExecute,
    userId,
    signalId,
    supabaseClient
  } = request;

  const placedOrders: Array<any> = [];
  let executionStatus = 'PENDING';

  if (!autoExecute) {
    return {
      success: true,
      placedOrders: [],
      executionStatus: 'PENDING'
    };
  }

  try {
    // Check idempotency if clientOrderId is provided
    if (signalId && supabaseClient) {
      const clientOrderId = generateClientOrderId(userId, signalId, request.symbol);
      const existingOrder = await checkOrderExists(supabaseClient, clientOrderId, userId);

      if (existingOrder.exists) {
        console.log('Order already exists (idempotency check):', existingOrder);
        return {
          success: true,
          placedOrders: [],
          executionStatus: 'DUPLICATE',
          error: 'Order already exists'
        };
      }
    }

    // Route to appropriate platform
    let result: TradeExecutionResult;

    if (platform === 'binance') {
      const baseUrl = getBinanceApiUrl('binance', request.marketType, request.testnet);
      const clientOrderId = signalId ? generateClientOrderId(userId, signalId, request.symbol) : undefined;

      result = await executeBinanceStrategy(
        {
          apiKey: request.apiKey,
          secretKey: request.secretKey,
          baseUrl,
          symbol: request.symbol,
          marketType: request.marketType,
          testnet: request.testnet,
          clientOrderId
        },
        {
          orderType: request.orderType,
          entryPrice: request.entryPrice,
          quantity: request.initialAmount / request.entryPrice,
          stopLossPrice: request.stopLossPrice,
          takeProfitPrice: request.takeProfitPrice,
          dcaLevels: request.dcaLevels || [],
          leverage: request.leverage
        }
      );
    } else if (platform === 'okx') {
      result = await executeOKXStrategy(request);
    } else if (platform === 'bybit') {
      // Import Bybit strategy executor
      const { executeBybitStrategy } = await import('./platforms/bybit-strategy.ts');

      const clientOrderId = signalId ? generateClientOrderId(userId, signalId, request.symbol) : undefined;

      result = await executeBybitStrategy(
        {
          apiKey: request.apiKey,
          secretKey: request.secretKey,
          symbol: request.symbol,
          marketType: request.marketType,
          testnet: request.testnet,
          clientOrderId
        },
        {
          orderType: request.orderType,
          entryPrice: request.entryPrice,
          quantity: request.initialAmount / request.entryPrice,
          stopLossPrice: request.stopLossPrice,
          takeProfitPrice: request.takeProfitPrice,
          dcaLevels: request.dcaLevels || [],
          leverage: request.leverage
        }
      );
    } else {
      throw createError(
        ExecuteTradeErrorCode.EXCHANGE_NOT_SUPPORTED,
        `Exchange ${platform} is not supported`
      );
    }

    // Store client order ID if signalId exists
    if (signalId && supabaseClient && result.placedOrders.length > 0) {
      const clientOrderId = generateClientOrderId(userId, signalId, request.symbol);
      // clientOrderId will be stored in database.ts when creating trade record
    }

    return result;
  } catch (error) {
    console.error('Trade execution failed:', error);
    return {
      success: false,
      placedOrders,
      executionStatus: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

