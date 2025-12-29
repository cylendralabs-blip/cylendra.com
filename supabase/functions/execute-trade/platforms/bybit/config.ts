/**
 * Bybit API Configuration
 * 
 * URLs and constants for Bybit API
 */

/**
 * Bybit API Base URLs
 */
export const BYBIT_URLS = {
    MAINNET: 'https://api.bybit.com',
    TESTNET: 'https://api-testnet.bybit.com',
} as const;

/**
 * Bybit API Endpoints
 */
export const BYBIT_ENDPOINTS = {
    // Market Data
    INSTRUMENTS_INFO: '/v5/market/instruments-info',
    TICKERS: '/v5/market/tickers',
    ORDERBOOK: '/v5/market/orderbook',

    // Trading
    PLACE_ORDER: '/v5/order/create',
    AMEND_ORDER: '/v5/order/amend',
    CANCEL_ORDER: '/v5/order/cancel',
    CANCEL_ALL_ORDERS: '/v5/order/cancel-all',
    GET_OPEN_ORDERS: '/v5/order/realtime',
    GET_ORDER_HISTORY: '/v5/order/history',

    // Position
    GET_POSITION: '/v5/position/list',
    SET_LEVERAGE: '/v5/position/set-leverage',
    SWITCH_MARGIN_MODE: '/v5/position/switch-isolated',
    SET_TP_SL: '/v5/position/trading-stop',

    // Account
    GET_WALLET_BALANCE: '/v5/account/wallet-balance',
    GET_ACCOUNT_INFO: '/v5/account/info',
} as const;

/**
 * Bybit API Request Window (milliseconds)
 */
export const BYBIT_RECV_WINDOW = 5000;

/**
 * Bybit Rate Limits (requests per second)
 */
export const BYBIT_RATE_LIMITS = {
    SPOT: 10,
    LINEAR: 10,
    INVERSE: 10,
} as const;

/**
 * Get Bybit base URL
 */
export function getBybitBaseUrl(testnet: boolean): string {
    return testnet ? BYBIT_URLS.TESTNET : BYBIT_URLS.MAINNET;
}
