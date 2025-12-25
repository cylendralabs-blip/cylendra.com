/**
 * Bybit Strategy Executor
 * 
 * Orchestrates complete trading strategies on Bybit
 * Supports both Spot and Perpetuals markets
 */

import { BybitClient, createBybitClient, BybitCredentials } from './bybit/index.ts';
import { SymbolRules } from '../symbol.ts';
import { DCALevel } from '../dca-orders.ts';
import { ExecuteTradeErrorCode, createError } from '../errors.ts';
import { withRetry } from '../retry.ts';

/**
 * Bybit Execution Context
 */
export interface BybitExecutionContext {
    apiKey: string;
    secretKey: string;
    symbol: string;
    marketType: 'spot' | 'futures';
    testnet: boolean;
    clientOrderId?: string;
}

/**
 * Bybit Strategy Parameters
 */
export interface BybitStrategyParams {
    orderType: 'market' | 'limit';
    entryPrice: number;
    quantity: number;
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
    dcaLevels: DCALevel[];
    leverage: number;
}

/**
 * Bybit Strategy Result
 */
export interface BybitStrategyResult {
    success: boolean;
    placedOrders: Array<any>;
    executionStatus: string;
    error?: string;
}

/**
 * Execute Bybit Spot Strategy
 */
async function executeBybitSpotStrategy(
    client: BybitClient,
    context: BybitExecutionContext,
    params: BybitStrategyParams,
    symbolRules: SymbolRules
): Promise<BybitStrategyResult> {
    const placedOrders: Array<any> = [];

    try {
        console.log('[Bybit Spot] Executing strategy...');

        // Cancel existing orders
        await client.spot.cancelAllOrders(context.symbol);

        // Place entry order
        let entryOrder;
        if (params.orderType === 'market') {
            entryOrder = await withRetry(() =>
                client.spot.placeMarketOrder(
                    context.symbol,
                    'Buy',
                    params.quantity,
                    symbolRules,
                    context.clientOrderId ? `${context.clientOrderId}-ENTRY` : undefined
                )
            );
        } else {
            entryOrder = await withRetry(() =>
                client.spot.placeLimitOrder(
                    context.symbol,
                    'Buy',
                    params.quantity,
                    params.entryPrice,
                    symbolRules,
                    context.clientOrderId ? `${context.clientOrderId}-ENTRY` : undefined
                )
            );
        }

        placedOrders.push({ ...entryOrder, orderType: 'ENTRY', level: 0 });
        console.log('[Bybit Spot] Entry order placed:', entryOrder);

        // Place DCA orders if provided
        if (params.dcaLevels && params.dcaLevels.length > 0) {
            for (const level of params.dcaLevels) {
                try {
                    const dcaQuantity = level.amount / level.targetPrice;
                    const dcaOrder = await client.spot.placeLimitOrder(
                        context.symbol,
                        'Buy',
                        dcaQuantity,
                        level.targetPrice,
                        symbolRules,
                        context.clientOrderId ? `${context.clientOrderId}-DCA-${level.level}` : undefined
                    );
                    placedOrders.push({ ...dcaOrder, orderType: 'DCA', level: level.level });
                    console.log(`[Bybit Spot] DCA Level ${level.level} placed`);
                } catch (dcaError) {
                    console.error(`[Bybit Spot] Failed to place DCA Level ${level.level}:`, dcaError);
                }
            }
        }

        // Note: Bybit Spot doesn't support TP/SL on the order itself
        // They need to be placed as separate orders after position is filled

        return {
            success: true,
            placedOrders,
            executionStatus: 'ACTIVE'
        };
    } catch (error) {
        console.error('[Bybit Spot] Strategy execution failed:', error);
        return {
            success: false,
            placedOrders,
            executionStatus: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Execute Bybit Perpetuals Strategy
 */
async function executeBybitPerpetualStrategy(
    client: BybitClient,
    context: BybitExecutionContext,
    params: BybitStrategyParams,
    symbolRules: SymbolRules
): Promise<BybitStrategyResult> {
    const placedOrders: Array<any> = [];

    try {
        console.log('[Bybit Perpetuals] Executing strategy...');

        // Set leverage if needed
        if (params.leverage > 1) {
            try {
                await client.perpetuals.setLeverage(context.symbol, params.leverage);
            } catch (leverageError) {
                console.error('[Bybit Perpetuals] Failed to set leverage:', leverageError);
                // Continue execution
            }
        }

        // Set margin mode to isolated
        try {
            await client.perpetuals.switchMarginMode(context.symbol, 1); // 1 = isolated
        } catch (marginError) {
            console.error('[Bybit Perpetuals] Failed to set margin mode:', marginError);
            // Continue execution
        }

        // Cancel existing orders
        await client.perpetuals.cancelAllOrders(context.symbol);

        // Place entry order
        let entryOrder;
        if (params.orderType === 'market') {
            entryOrder = await withRetry(() =>
                client.perpetuals.placeMarketOrder(
                    context.symbol,
                    'Buy',
                    params.quantity,
                    symbolRules,
                    context.clientOrderId ? `${context.clientOrderId}-ENTRY` : undefined
                )
            );
        } else {
            entryOrder = await withRetry(() =>
                client.perpetuals.placeLimitOrder(
                    context.symbol,
                    'Buy',
                    params.quantity,
                    params.entryPrice,
                    symbolRules,
                    context.clientOrderId ? `${context.clientOrderId}-ENTRY` : undefined
                )
            );
        }

        placedOrders.push({ ...entryOrder, orderType: 'ENTRY', level: 0 });
        console.log('[Bybit Perpetuals] Entry order placed:', entryOrder);

        // Place DCA orders if provided
        if (params.dcaLevels && params.dcaLevels.length > 0) {
            for (const level of params.dcaLevels) {
                try {
                    const dcaQuantity = level.amount / level.targetPrice;
                    const dcaOrder = await client.perpetuals.placeLimitOrder(
                        context.symbol,
                        'Buy',
                        dcaQuantity,
                        level.targetPrice,
                        symbolRules,
                        context.clientOrderId ? `${context.clientOrderId}-DCA-${level.level}` : undefined
                    );
                    placedOrders.push({ ...dcaOrder, orderType: 'DCA', level: level.level });
                    console.log(`[Bybit Perpetuals] DCA Level ${level.level} placed`);
                } catch (dcaError) {
                    console.error(`[Bybit Perpetuals] Failed to place DCA Level ${level.level}:`, dcaError);
                }
            }
        }

        // Set TP/SL for position (after entry order is filled)
        if (params.stopLossPrice || params.takeProfitPrice) {
            try {
                // Wait a bit for order to fill
                await new Promise(resolve => setTimeout(resolve, 1000));

                await client.perpetuals.setTPSL(
                    context.symbol,
                    'Buy',
                    params.stopLossPrice || undefined,
                    params.takeProfitPrice || undefined,
                    symbolRules
                );
                console.log('[Bybit Perpetuals] TP/SL set for position');
            } catch (tpslError) {
                console.error('[Bybit Perpetuals] Failed to set TP/SL:', tpslError);
                // Non-critical, continue
            }
        }

        return {
            success: true,
            placedOrders,
            executionStatus: 'ACTIVE'
        };
    } catch (error) {
        console.error('[Bybit Perpetuals] Strategy execution failed:', error);
        return {
            success: false,
            placedOrders,
            executionStatus: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Main Bybit Strategy Executor
 */
export async function executeBybitStrategy(
    context: BybitExecutionContext,
    params: BybitStrategyParams
): Promise<BybitStrategyResult> {
    try {
        // Create Bybit client
        const credentials: BybitCredentials = {
            apiKey: context.apiKey,
            secretKey: context.secretKey,
            testnet: context.testnet
        };

        const client = createBybitClient(credentials);

        // Get symbol rules
        let symbolRules: SymbolRules | null;
        if (context.marketType === 'spot') {
            symbolRules = await client.spot.getInstrumentInfo(context.symbol);
        } else {
            symbolRules = await client.perpetuals.getInstrumentInfo(context.symbol);
        }

        if (!symbolRules) {
            throw createError(
                ExecuteTradeErrorCode.SYMBOL_INFO_FAILED,
                'Failed to get Bybit symbol information'
            );
        }

        console.log('[Bybit] Symbol rules:', symbolRules);

        // Execute strategy based on market type
        if (context.marketType === 'spot') {
            return await executeBybitSpotStrategy(client, context, params, symbolRules);
        } else {
            return await executeBybitPerpetualStrategy(client, context, params, symbolRules);
        }
    } catch (error) {
        console.error('[Bybit] Strategy execution failed:', error);
        return {
            success: false,
            placedOrders: [],
            executionStatus: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
