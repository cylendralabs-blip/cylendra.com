/**
 * Bybit API Utilities
 * 
 * Helper functions for Bybit API interactions
 */

import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { BybitCredentials } from './types.ts';
import { getBybitBaseUrl, BYBIT_RECV_WINDOW } from './config.ts';

/**
 * Format symbol for Bybit (remove separators)
 * Example: BTC/USDT -> BTCUSDT
 */
export function formatBybitSymbol(symbol: string): string {
    return symbol.replace(/[\/\-]/g, '').toUpperCase();
}

/**
 * Create HMAC SHA256 signature for Bybit API
 */
export function createBybitSignature(
    timestamp: number,
    apiKey: string,
    recvWindow: number,
    queryString: string,
    secretKey: string
): string {
    const message = `${timestamp}${apiKey}${recvWindow}${queryString}`;
    return createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }

    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            if (params[key] !== undefined && params[key] !== null) {
                acc[key] = params[key];
            }
            return acc;
        }, {} as Record<string, any>);

    return new URLSearchParams(sortedParams).toString();
}

/**
 * Make authenticated request to Bybit API
 */
export async function makeBybitRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST',
    credentials: BybitCredentials,
    params?: Record<string, any>
): Promise<T> {
    const baseUrl = getBybitBaseUrl(credentials.testnet);
    const timestamp = Date.now();
    const recvWindow = BYBIT_RECV_WINDOW;

    let queryString = '';
    let url = `${baseUrl}${endpoint}`;

    if (method === 'GET' && params) {
        queryString = buildQueryString(params);
        if (queryString) {
            url += `?${queryString}`;
        }
    } else if (method === 'POST' && params) {
        queryString = JSON.stringify(params);
    }

    // Create signature
    const signature = createBybitSignature(
        timestamp,
        credentials.apiKey,
        recvWindow,
        queryString,
        credentials.secretKey
    );

    // Build headers
    const headers: Record<string, string> = {
        'X-BAPI-API-KEY': credentials.apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp.toString(),
        'X-BAPI-RECV-WINDOW': recvWindow.toString(),
        'Content-Type': 'application/json',
    };

    console.log(`[Bybit] ${method} ${endpoint}`, { testnet: credentials.testnet });

    // Make request
    const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' && params ? JSON.stringify(params) : undefined,
    });

    const responseText = await response.text();

    if (!response.ok) {
        let errorData: any;
        try {
            errorData = JSON.parse(responseText);
        } catch {
            errorData = { retMsg: responseText };
        }

        console.error('[Bybit] API Error:', errorData);
        throw new Error(errorData.retMsg || `Bybit API error: ${response.status}`);
    }

    const data = JSON.parse(responseText);

    // Check Bybit response code
    if (data.retCode !== 0) {
        console.error('[Bybit] API Error:', data);
        throw new Error(data.retMsg || 'Bybit API error');
    }

    return data.result as T;
}

/**
 * Format quantity according to step size
 */
export function formatBybitQuantity(
    quantity: number,
    stepSize: number,
    minQty: number
): string {
    // Round down to step size
    const steps = Math.floor(quantity / stepSize);
    const formatted = steps * stepSize;

    // Ensure minimum quantity
    const final = Math.max(formatted, minQty);

    // Calculate precision from step size
    const precision = stepSize >= 1 ? 0 : -Math.floor(Math.log10(stepSize));

    return final.toFixed(precision);
}

/**
 * Format price according to tick size
 */
export function formatBybitPrice(
    price: number,
    tickSize: number
): string {
    // Round to tick size
    const ticks = Math.round(price / tickSize);
    const formatted = ticks * tickSize;

    // Calculate precision from tick size
    const precision = tickSize >= 1 ? 0 : -Math.floor(Math.log10(tickSize));

    return formatted.toFixed(precision);
}

/**
 * Parse Bybit error and return user-friendly message
 */
export function parseBybitError(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error.retMsg) {
        return error.retMsg;
    }

    if (error.message) {
        return error.message;
    }

    return 'Unknown Bybit error';
}
