/**
 * Bybit API Types and Interfaces
 * 
 * Type definitions for Bybit V5 API
 */

/**
 * Bybit Credentials
 */
export interface BybitCredentials {
    apiKey: string;
    secretKey: string;
    testnet: boolean;
}

/**
 * Bybit Market Category
 */
export type BybitCategory = 'spot' | 'linear' | 'inverse';

/**
 * Bybit Order Side
 */
export type BybitSide = 'Buy' | 'Sell';

/**
 * Bybit Order Type
 */
export type BybitOrderType = 'Market' | 'Limit';

/**
 * Bybit Time in Force
 */
export type BybitTimeInForce = 'GTC' | 'IOC' | 'FOK' | 'PostOnly';

/**
 * Bybit Order Status
 */
export type BybitOrderStatus =
    | 'Created'
    | 'New'
    | 'Rejected'
    | 'PartiallyFilled'
    | 'PartiallyFilledCanceled'
    | 'Filled'
    | 'Cancelled'
    | 'Untriggered'
    | 'Triggered'
    | 'Deactivated';

/**
 * Bybit Position Mode
 */
export type BybitPositionMode = 'MergedSingle' | 'BothSide';

/**
 * Bybit Margin Mode
 */
export type BybitMarginMode = 'ISOLATED_MARGIN' | 'REGULAR_MARGIN' | 'PORTFOLIO_MARGIN';

/**
 * Bybit Instrument Info Response
 */
export interface BybitInstrumentInfo {
    symbol: string;
    contractType?: string;
    status: string;
    baseCoin: string;
    quoteCoin: string;
    launchTime?: string;
    deliveryTime?: string;
    deliveryFeeRate?: string;
    priceScale: string;
    leverageFilter?: {
        minLeverage: string;
        maxLeverage: string;
        leverageStep: string;
    };
    priceFilter: {
        minPrice: string;
        maxPrice: string;
        tickSize: string;
    };
    lotSizeFilter: {
        maxOrderQty: string;
        minOrderQty: string;
        qtyStep: string;
        postOnlyMaxOrderQty?: string;
        basePrecision?: string;
        quotePrecision?: string;
        minOrderAmt?: string;
        maxOrderAmt?: string;
    };
}

/**
 * Bybit Order Request
 */
export interface BybitOrderRequest {
    category: BybitCategory;
    symbol: string;
    side: BybitSide;
    orderType: BybitOrderType;
    qty: string;
    price?: string;
    triggerPrice?: string;
    timeInForce?: BybitTimeInForce;
    orderLinkId?: string;
    reduceOnly?: boolean;
    closeOnTrigger?: boolean;
    stopLoss?: string;
    takeProfit?: string;
    tpTriggerBy?: string;
    slTriggerBy?: string;
}

/**
 * Bybit Order Response
 */
export interface BybitOrderResponse {
    orderId: string;
    orderLinkId: string;
}

/**
 * Bybit Position Info
 */
export interface BybitPositionInfo {
    symbol: string;
    side: string;
    size: string;
    positionValue: string;
    entryPrice: string;
    markPrice: string;
    leverage: string;
    positionMM: string;
    positionIM: string;
    unrealisedPnl: string;
    cumRealisedPnl: string;
    stopLoss: string;
    takeProfit: string;
    trailingStop: string;
    positionStatus: string;
}

/**
 * Bybit Balance Info
 */
export interface BybitBalanceInfo {
    coin: string;
    walletBalance: string;
    transferBalance: string;
    bonus: string;
    availableToWithdraw: string;
    availableToBorrow: string;
    borrowAmount: string;
    accruedInterest: string;
    totalOrderIM: string;
    totalPositionIM: string;
    totalPositionMM: string;
    unrealisedPnl: string;
    cumRealisedPnl: string;
}

/**
 * Bybit API Response Wrapper
 */
export interface BybitApiResponse<T = any> {
    retCode: number;
    retMsg: string;
    result: T;
    retExtInfo: Record<string, any>;
    time: number;
}

/**
 * Bybit Error Response
 */
export interface BybitErrorResponse {
    retCode: number;
    retMsg: string;
    retExtInfo?: Record<string, any>;
}
