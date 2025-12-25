/**
 * Bybit Client - Main Entry Point
 * 
 * Unified interface for Bybit trading operations
 * Supports both Spot and Perpetuals markets
 */

export * from './types.ts';
export * from './config.ts';
export * from './utils.ts';
export * from './spot.ts';
export * from './perpetuals.ts';

import { BybitCredentials } from './types.ts';
import {
    getBybitSpotInstrumentInfo,
    placeBybitSpotMarketOrder,
    placeBybitSpotLimitOrder,
    cancelAllBybitSpotOrders,
    getBybitSpotBalance,
    getBybitSpotOrderStatus,
} from './spot.ts';
import {
    getBybitPerpetualInstrumentInfo,
    setBybitPerpetualLeverage,
    switchBybitMarginMode,
    placeBybitPerpetualMarketOrder,
    placeBybitPerpetualLimitOrder,
    setBybitPerpetualTPSL,
    cancelAllBybitPerpetualOrders,
    getBybitPosition,
    getBybitPerpetualOrderStatus,
} from './perpetuals.ts';
import { SymbolRules } from '../../symbol.ts';

/**
 * Bybit Client Class
 * Provides a unified interface for all Bybit operations
 */
export class BybitClient {
    constructor(private credentials: BybitCredentials) { }

    /**
     * Spot Trading Methods
     */
    spot = {
        getInstrumentInfo: (symbol: string) =>
            getBybitSpotInstrumentInfo(this.credentials, symbol),

        placeMarketOrder: (symbol: string, side: 'Buy' | 'Sell', quantity: number, symbolRules: SymbolRules, orderLinkId?: string) =>
            placeBybitSpotMarketOrder(this.credentials, symbol, side, quantity, symbolRules, orderLinkId),

        placeLimitOrder: (symbol: string, side: 'Buy' | 'Sell', quantity: number, price: number, symbolRules: SymbolRules, orderLinkId?: string) =>
            placeBybitSpotLimitOrder(this.credentials, symbol, side, quantity, price, symbolRules, orderLinkId),

        cancelAllOrders: (symbol: string) =>
            cancelAllBybitSpotOrders(this.credentials, symbol),

        getOrderStatus: (orderId?: string, orderLinkId?: string) =>
            getBybitSpotOrderStatus(this.credentials, orderId, orderLinkId),

        getBalance: (coin?: string) =>
            getBybitSpotBalance(this.credentials, coin),
    };

    /**
     * Perpetuals Trading Methods
     */
    perpetuals = {
        getInstrumentInfo: (symbol: string) =>
            getBybitPerpetualInstrumentInfo(this.credentials, symbol),

        setLeverage: (symbol: string, leverage: number) =>
            setBybitPerpetualLeverage(this.credentials, symbol, leverage),

        switchMarginMode: (symbol: string, tradeMode: 0 | 1) =>
            switchBybitMarginMode(this.credentials, symbol, tradeMode),

        placeMarketOrder: (symbol: string, side: 'Buy' | 'Sell', quantity: number, symbolRules: SymbolRules, orderLinkId?: string, reduceOnly?: boolean) =>
            placeBybitPerpetualMarketOrder(this.credentials, symbol, side, quantity, symbolRules, orderLinkId, reduceOnly),

        placeLimitOrder: (symbol: string, side: 'Buy' | 'Sell', quantity: number, price: number, symbolRules: SymbolRules, orderLinkId?: string, reduceOnly?: boolean) =>
            placeBybitPerpetualLimitOrder(this.credentials, symbol, side, quantity, price, symbolRules, orderLinkId, 'GTC', reduceOnly),

        setTPSL: (symbol: string, positionSide: 'Buy' | 'Sell', stopLoss?: number, takeProfit?: number, symbolRules?: SymbolRules) =>
            setBybitPerpetualTPSL(this.credentials, symbol, positionSide, stopLoss, takeProfit, symbolRules),

        getPosition: (symbol: string) =>
            getBybitPosition(this.credentials, symbol),

        cancelAllOrders: (symbol: string) =>
            cancelAllBybitPerpetualOrders(this.credentials, symbol),

        getOrderStatus: (orderId?: string, orderLinkId?: string) =>
            getBybitPerpetualOrderStatus(this.credentials, orderId, orderLinkId),
    };

    /**
     * Test connection to Bybit API
     */
    async testConnection(): Promise<boolean> {
        try {
            // Try to get account info or any simple endpoint
            await this.spot.getBalance('USDT');
            return true;
        } catch (error) {
            console.error('[Bybit] Connection test failed:', error);
            return false;
        }
    }
}

/**
 * Create Bybit client instance
 */
export function createBybitClient(credentials: BybitCredentials): BybitClient {
    return new BybitClient(credentials);
}
