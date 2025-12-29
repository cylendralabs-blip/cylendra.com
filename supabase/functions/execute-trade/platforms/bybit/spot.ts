/**
 * Bybit Spot Trading Module
 * 
 * Handles spot market operations on Bybit
 */

import { BybitCredentials, BybitInstrumentInfo, BybitOrderRequest, BybitOrderResponse } from './types.ts';
import { BYBIT_ENDPOINTS } from './config.ts';
import { makeBybitRequest, formatBybitSymbol, formatBybitQuantity, formatBybitPrice } from './utils.ts';
import { SymbolRules } from '../../symbol.ts';

/**
 * Get spot instrument information
 */
export async function getBybitSpotInstrumentInfo(
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
                category: 'spot',
                symbol: formattedSymbol,
            }
        );

        if (!response.list || response.list.length === 0) {
            throw new Error(`Symbol ${symbol} not found on Bybit Spot`);
        }

        const instrument = response.list[0];
        const { priceFilter, lotSizeFilter } = instrument;

        const tickSize = parseFloat(priceFilter.tickSize);
        const stepSize = parseFloat(lotSizeFilter.qtyStep);
        const minQty = parseFloat(lotSizeFilter.minOrderQty);
        const minNotional = lotSizeFilter.minOrderAmt ? parseFloat(lotSizeFilter.minOrderAmt) : undefined;

        // Calculate precision
        const pricePrecision = tickSize >= 1 ? 0 : -Math.floor(Math.log10(tickSize));
        const quantityPrecision = stepSize >= 1 ? 0 : -Math.floor(Math.log10(stepSize));

        return {
            quantityPrecision: Math.max(0, quantityPrecision),
            pricePrecision: Math.max(0, pricePrecision),
            tickSize,
            minQty,
            stepSize,
            minNotional,
        };
    } catch (error) {
        console.error('[Bybit Spot] Error getting instrument info:', error);
        throw error;
    }
}

/**
 * Place spot market order
 */
export async function placeBybitSpotMarketOrder(
    credentials: BybitCredentials,
    symbol: string,
    side: 'Buy' | 'Sell',
    quantity: number,
    symbolRules: SymbolRules,
    orderLinkId?: string
): Promise<BybitOrderResponse> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);
        const formattedQty = formatBybitQuantity(quantity, symbolRules.stepSize, symbolRules.minQty);

        const orderParams: BybitOrderRequest = {
            category: 'spot',
            symbol: formattedSymbol,
            side,
            orderType: 'Market',
            qty: formattedQty,
            timeInForce: 'IOC', // Immediate or Cancel for market orders
        };

        if (orderLinkId) {
            orderParams.orderLinkId = orderLinkId;
        }

        console.log('[Bybit Spot] Placing market order:', orderParams);

        const response = await makeBybitRequest<BybitOrderResponse>(
            BYBIT_ENDPOINTS.PLACE_ORDER,
            'POST',
            credentials,
            orderParams
        );

        console.log('[Bybit Spot] Order placed:', response);

        return response;
    } catch (error) {
        console.error('[Bybit Spot] Error placing market order:', error);
        throw error;
    }
}

/**
 * Place spot limit order
 */
export async function placeBybitSpotLimitOrder(
    credentials: BybitCredentials,
    symbol: string,
    side: 'Buy' | 'Sell',
    quantity: number,
    price: number,
    symbolRules: SymbolRules,
    orderLinkId?: string,
    timeInForce: 'GTC' | 'IOC' | 'FOK' | 'PostOnly' = 'GTC'
): Promise<BybitOrderResponse> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);
        const formattedQty = formatBybitQuantity(quantity, symbolRules.stepSize, symbolRules.minQty);
        const formattedPrice = formatBybitPrice(price, symbolRules.tickSize);

        const orderParams: BybitOrderRequest = {
            category: 'spot',
            symbol: formattedSymbol,
            side,
            orderType: 'Limit',
            qty: formattedQty,
            price: formattedPrice,
            timeInForce,
        };

        if (orderLinkId) {
            orderParams.orderLinkId = orderLinkId;
        }

        console.log('[Bybit Spot] Placing limit order:', orderParams);

        const response = await makeBybitRequest<BybitOrderResponse>(
            BYBIT_ENDPOINTS.PLACE_ORDER,
            'POST',
            credentials,
            orderParams
        );

        console.log('[Bybit Spot] Limit order placed:', response);

        return response;
    } catch (error) {
        console.error('[Bybit Spot] Error placing limit order:', error);
        throw error;
    }
}

/**
 * Cancel spot order
 */
export async function cancelBybitSpotOrder(
    credentials: BybitCredentials,
    symbol: string,
    orderId?: string,
    orderLinkId?: string
): Promise<void> {
    try {
        const formattedSymbol = formatBybitSymbol(symbol);

        const params: any = {
            category: 'spot',
            symbol: formattedSymbol,
        };

        if (orderId) {
            params.orderId = orderId;
        } else if (orderLinkId) {
            params.orderLinkId = orderLinkId;
        } else {
            throw new Error('Either orderId or orderLinkId must be provided');
        }

        await makeBybitRequest(
            BYBIT_ENDPOINTS.CANCEL_ORDER,
            'POST',
            credentials,
            params
        );

        console.log('[Bybit Spot] Order cancelled');
    } catch (error) {
        console.error('[Bybit Spot] Error cancelling order:', error);
        throw error;
    }
}

/**
 * Get Bybit spot order status
 */
export async function getBybitSpotOrderStatus(
    credentials: BybitCredentials,
    orderId?: string,
    orderLinkId?: string
): Promise<BybitOrderResponse | null> {
    try {
        const params: any = {
            category: 'spot',
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
        console.error('[Bybit Spot] Error getting order status:', error);
        throw error;
    }
}

/**
 * Cancel all spot orders for symbol
 */
export async function cancelAllBybitSpotOrders(
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
                category: 'spot',
                symbol: formattedSymbol,
            }
        );

        console.log('[Bybit Spot] All orders cancelled for', formattedSymbol);
    } catch (error) {
        console.error('[Bybit Spot] Error cancelling all orders:', error);
        // Non-critical, continue
    }
}

/**
 * Get spot wallet balance
 */
export async function getBybitSpotBalance(
    credentials: BybitCredentials,
    coin?: string
): Promise<any> {
    try {
        const params: any = {
            accountType: 'SPOT',
        };

        if (coin) {
            params.coin = coin;
        }

        const response = await makeBybitRequest(
            BYBIT_ENDPOINTS.GET_WALLET_BALANCE,
            'GET',
            credentials,
            params
        );

        return response;
    } catch (error) {
        console.error('[Bybit Spot] Error getting balance:', error);
        throw error;
    }
}
