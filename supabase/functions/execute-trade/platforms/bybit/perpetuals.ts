/**
 * Bybit Perpetuals Trading Module
 * 
 * Handles perpetual futures operations on Bybit
 */

import { BybitCredentials, BybitInstrumentInfo, BybitOrderRequest, BybitOrderResponse, BybitPositionInfo } from './types.ts';
import { BYBIT_ENDPOINTS } from './config.ts';
import { makeBybitRequest, formatBybitSymbol, formatBybitQuantity, formatBybitPrice } from './utils.ts';
import { SymbolRules } from '../../symbol.ts';

/**
 * Get perpetuals instrument information
 */
export async function getBybitPerpetualInstrumentInfo(
    credentials: BybitCredentials,
    symbol: string
): Promise<SymbolRules | null> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        const response = await makeBybitRequest<{ list: BybitInstrumentInfo[] }>(
            BYBIT_ENDPOINTS.INSTRUMENTS_INFO,
            'GET',
            credentials,
            {
                category: 'linear',
                symbol: formattedSymbol,
            }
        );

        if (!response.list || response.list.length === 0) {
            throw new Error(`Symbol ${symbol} not found on Bybit Perpetuals`);
        }

        const instrument = response.list[0];
        const { priceFilter, lotSizeFilter } = instrument;

        const tickSize = parseFloat(priceFilter.tickSize);
        const stepSize = parseFloat(lotSizeFilter.qtyStep);
        const minQty = parseFloat(lotSizeFilter.minOrderQty);

        // Calculate precision
        const pricePrecision = tickSize >= 1 ? 0 : -Math.floor(Math.log10(tickSize));
        const quantityPrecision = stepSize >= 1 ? 0 : -Math.floor(Math.log10(stepSize));

        return {
            quantityPrecision: Math.max(0, quantityPrecision),
            pricePrecision: Math.max(0, pricePrecision),
            tickSize,
            minQty,
            stepSize,
        };
    } catch (error) {
        console.error('[Bybit Perpetuals] Error getting instrument info:', error);
        throw error;
    }
}

/**
 * Set leverage for perpetuals
 */
export async function setBybitPerpetualLeverage(
    credentials: BybitCredentials,
    symbol: string,
    leverage: number
): Promise<void> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        await makeBybitRequest(
            BYBIT_ENDPOINTS.SET_LEVERAGE,
            'POST',
            credentials,
            {
                category: 'linear',
                symbol: formattedSymbol,
                buyLeverage: leverage.toString(),
                sellLeverage: leverage.toString(),
            }
        );

        console.log(`[Bybit Perpetuals] Leverage set to ${leverage}x for ${formattedSymbol}`);
    } catch (error) {
        console.error('[Bybit Perpetuals] Error setting leverage:', error);
        throw error;
    }
}

/**
 * Switch margin mode (isolated/cross)
 */
export async function switchBybitMarginMode(
    credentials: BybitCredentials,
    symbol: string,
    tradeMode: 0 | 1 // 0: cross margin, 1: isolated margin
): Promise<void> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        await makeBybitRequest(
            BYBIT_ENDPOINTS.SWITCH_MARGIN_MODE,
            'POST',
            credentials,
            {
                category: 'linear',
                symbol: formattedSymbol,
                tradeMode,
                buyLeverage: '10', // Default leverage
                sellLeverage: '10',
            }
        );

        console.log(`[Bybit Perpetuals] Margin mode switched to ${tradeMode === 0 ? 'cross' : 'isolated'}`);
    } catch (error) {
        console.error('[Bybit Perpetuals] Error switching margin mode:', error);
        // Non-critical, continue
    }
}

/**
 * Place perpetuals market order
 */
export async function placeBybitPerpetualMarketOrder(
    credentials: BybitCredentials,
    symbol: string,
    side: 'Buy' | 'Sell',
    quantity: number,
    symbolRules: SymbolRules,
    orderLinkId?: string,
    reduceOnly: boolean = false
): Promise<BybitOrderResponse> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);
        const formattedQty = formatBybitQuantity(quantity, symbolRules.stepSize, symbolRules.minQty);

        const orderParams: BybitOrderRequest = {
            category: 'linear',
            symbol: formattedSymbol,
            side,
            orderType: 'Market',
            qty: formattedQty,
            reduceOnly,
        };

        if (orderLinkId) {
            orderParams.orderLinkId = orderLinkId;
        }

        console.log('[Bybit Perpetuals] Placing market order:', orderParams);

        const response = await makeBybitRequest<BybitOrderResponse>(
            BYBIT_ENDPOINTS.PLACE_ORDER,
            'POST',
            credentials,
            orderParams
        );

        console.log('[Bybit Perpetuals] Order placed:', response);

        return response;
    } catch (error) {
        console.error('[Bybit Perpetuals] Error placing market order:', error);
        throw error;
    }
}

/**
 * Place perpetuals limit order
 */
export async function placeBybitPerpetualLimitOrder(
    credentials: BybitCredentials,
    symbol: string,
    side: 'Buy' | 'Sell',
    quantity: number,
    price: number,
    symbolRules: SymbolRules,
    orderLinkId?: string,
    timeInForce: 'GTC' | 'IOC' | 'FOK' | 'PostOnly' = 'GTC',
    reduceOnly: boolean = false
): Promise<BybitOrderResponse> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);
        const formattedQty = formatBybitQuantity(quantity, symbolRules.stepSize, symbolRules.minQty);
        const formattedPrice = formatBybitPrice(price, symbolRules.tickSize);

        const orderParams: BybitOrderRequest = {
            category: 'linear',
            symbol: formattedSymbol,
            side,
            orderType: 'Limit',
            qty: formattedQty,
            price: formattedPrice,
            timeInForce,
            reduceOnly,
        };

        if (orderLinkId) {
            orderParams.orderLinkId = orderLinkId;
        }

        console.log('[Bybit Perpetuals] Placing limit order:', orderParams);

        const response = await makeBybitRequest<BybitOrderResponse>(
            BYBIT_ENDPOINTS.PLACE_ORDER,
            'POST',
            credentials,
            orderParams
        );

        console.log('[Bybit Perpetuals] Limit order placed:', response);

        return response;
    } catch (error) {
        console.error('[Bybit Perpetuals] Error placing limit order:', error);
        throw error;
    }
}

/**
 * Set stop-loss and take-profit for position
 */
export async function setBybitPerpetualTPSL(
    credentials: BybitCredentials,
    symbol: string,
    positionSide: 'Buy' | 'Sell',
    stopLoss?: number,
    takeProfit?: number,
    symbolRules?: SymbolRules
): Promise<void> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        const params: any = {
            category: 'linear',
            symbol: formattedSymbol,
            positionIdx: 0, // One-way mode
        };

        if (stopLoss && symbolRules) {
            params.stopLoss = formatBybitPrice(stopLoss, symbolRules.tickSize);
        }

        if (takeProfit && symbolRules) {
            params.takeProfit = formatBybitPrice(takeProfit, symbolRules.tickSize);
        }

        await makeBybitRequest(
            BYBIT_ENDPOINTS.SET_TP_SL,
            'POST',
            credentials,
            params
        );

        console.log('[Bybit Perpetuals] TP/SL set for position');
    } catch (error) {
        console.error('[Bybit Perpetuals] Error setting TP/SL:', error);
        throw error;
    }
}

/**
 * Get position information
 */
export async function getBybitPosition(
    credentials: BybitCredentials,
    symbol: string
): Promise<BybitPositionInfo | null> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        const response = await makeBybitRequest<{ list: BybitPositionInfo[] }>(
            BYBIT_ENDPOINTS.GET_POSITION,
            'GET',
            credentials,
            {
                category: 'linear',
                symbol: formattedSymbol,
            }
        );

        if (!response.list || response.list.length === 0) {
            return null;
        }

        return response.list[0];
    } catch (error) {
        console.error('[Bybit Perpetuals] Error getting position:', error);
        throw error;
    }
}

/**
 * Get Bybit perpetuals order status
 */
export async function getBybitPerpetualOrderStatus(
    credentials: BybitCredentials,
    orderId?: string,
    orderLinkId?: string
): Promise<BybitOrderResponse | null> {
    try {
        const params: any = {
            category: 'linear',
        };

        if (orderId) {
            params.orderId = orderId;
        } else if (orderLinkId) {
            params.orderLinkId = orderLinkId;
        } else {
            throw new Error('Either orderId or orderLinkId is required');
        }

        const response = await makeBybitRequest<{ list: BybitOrderResponse[] }>(
            BYBIT_ENDPOINTS.GET_OPEN_ORDERS,
            'GET',
            credentials,
            params
        );

        if (!response.list || response.list.length === 0) {
            return null;
        }

        return response.list[0];
    } catch (error) {
        console.error('[Bybit Perpetuals] Error getting order status:', error);
        throw error;
    }
}

/**
 * Cancel all perpetuals orders for symbol
 */
export async function cancelAllBybitPerpetualOrders(
    credentials: BybitCredentials,
    symbol: string
): Promise<void> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        await makeBybitRequest(
            BYBIT_ENDPOINTS.CANCEL_ALL_ORDERS,
            'POST',
            credentials,
            {
                category: 'linear',
                symbol: formattedSymbol,
            }
        );

        console.log('[Bybit Perpetuals] All orders cancelled for', formattedSymbol);
    } catch (error) {
        console.error('[Bybit Perpetuals] Error cancelling all orders:', error);
        // Non-critical, continue
    }
}
