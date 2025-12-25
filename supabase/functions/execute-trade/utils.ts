/**
 * Execute Trade Utilities
 * 
 * Helper functions for trade execution
 */

import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

/**
 * Create HMAC SHA256 signature
 */
export function createSignature(queryString: string, secretKey: string): string {
  return createHmac('sha256', secretKey).update(queryString).digest('hex');
}

/**
 * Format quantity with precision and step size
 */
export function formatQuantity(
  quantity: number,
  precision: number,
  minQty: number = 0.001
): string {
  const adjustedQuantity = Math.max(quantity, minQty);
  const stepSize = Math.pow(10, -precision);
  const rounded = Math.round(adjustedQuantity / stepSize) * stepSize;
  const finalQuantity = Math.max(rounded, minQty);

  return finalQuantity.toFixed(precision);
}

/**
 * Format price with precision and tick size
 */
export function formatPrice(
  price: number,
  precision: number,
  tickSize: number
): string {
  const roundedPrice = Math.round(price / tickSize) * tickSize;
  return roundedPrice.toFixed(precision);
}

/**
 * Format symbol for Binance API (remove / separator)
 */
export function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

/**
 * Calculate precision from step size
 */
export function calculatePrecision(stepSize: number): number {
  if (stepSize >= 1) return 0;
  const str = stepSize.toString();
  const match = str.match(/\.0*1/);
  return match ? match[0].length - 2 : 0;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Binance server time
 * Prevents timestamp synchronization issues
 */
export async function getBinanceServerTime(baseUrl: string): Promise<number> {
  try {
    const response = await fetch(`${baseUrl}/api/v3/time`);
    if (!response.ok) {
      console.warn(`Failed to get Binance server time (${response.status}), using local time`);
      return Date.now();
    }
    const data = await response.json();
    return data.serverTime;
  } catch (error) {
    console.warn('Error getting Binance server time, using local time:', error);
    return Date.now();
  }
}

/**
 * Validate symbol format for exchange
 */
export function validateSymbolFormat(symbol: string, exchange: string = 'binance'): boolean {
  if (exchange === 'binance') {
    // Binance symbols: uppercase, 3-10 chars + USDT/BUSD/BTC etc
    return /^[A-Z]{3,10}(USDT|BUSD|BTC|ETH|BNB)$/.test(symbol.replace('/', ''));
  }
  return true; // Other exchanges - no validation yet
}

/**
 * Binance error codes mapping
 */
export const BINANCE_ERROR_CODES: Record<string, string> = {
  '-1021': 'Timestamp sync issue - Server time mismatch. Try again.',
  '-2015': 'API key permissions or IP whitelist issue. Check API settings.',
  '-1022': 'Invalid signature - Verify API keys are correct.',
  '-1100': 'Invalid parameter sent.',
  '-2010': 'Insufficient balance.',
  '-1111': 'Precision exceeds maximum defined for this asset.',
  '-2011': 'Unknown order type.',
  '-1013': 'Invalid quantity - Check min/max limits.',
  '-1003': 'Too many requests - Rate limit exceeded.',
};

/**
 * Parse Binance error and return user-friendly message
 */
export function parseBinanceError(error: any): string {
  try {
    if (typeof error === 'string') {
      const parsed = JSON.parse(error);
      const code = parsed.code?.toString();
      const msg = parsed.msg || 'Unknown error';

      if (code && BINANCE_ERROR_CODES[code]) {
        return `${BINANCE_ERROR_CODES[code]} (Code: ${code})`;
      }
      return `Binance error: ${msg} (Code: ${code || 'unknown'})`;
    }

    if (error.code) {
      const code = error.code.toString();
      if (BINANCE_ERROR_CODES[code]) {
        return `${BINANCE_ERROR_CODES[code]} (Code: ${code})`;
      }
      return `Binance error: ${error.msg || error.message} (Code: ${code})`;
    }

    return error.message || error.msg || 'Unknown Binance error';
  } catch {
    return error.toString();
  }
}


