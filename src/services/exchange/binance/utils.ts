/**
 * Binance Exchange Utilities
 * 
 * Helper functions for Binance API operations
 */

import { SymbolRules } from './types';

/**
 * Create HMAC SHA256 signature
 */
export function createSignature(queryString: string, secretKey: string): string {
  // Note: In browser environment, we need to use Web Crypto API
  // For Node.js/Deno, use the crypto module
  // This is a placeholder - actual implementation depends on environment
  
  // For Deno (Edge Functions):
  // import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'
  // return createHmac('sha256', secretKey).update(queryString).digest('hex')
  
  // For browser, we'll need to use SubtleCrypto or send to Edge Function
  // For now, this will be handled in Edge Functions
  throw new Error('Signature creation should be done in Edge Functions');
}

/**
 * Format quantity according to symbol rules
 */
export function formatQuantity(
  quantity: number,
  rules: SymbolRules
): string {
  const adjustedQuantity = Math.max(quantity, rules.minQty);
  const stepSize = rules.stepSize || Math.pow(10, -rules.quantityPrecision);
  const rounded = Math.round(adjustedQuantity / stepSize) * stepSize;
  const finalQuantity = Math.max(rounded, rules.minQty);
  
  return finalQuantity.toFixed(rules.quantityPrecision);
}

/**
 * Format price according to symbol rules
 */
export function formatPrice(
  price: number,
  rules: SymbolRules
): string {
  const roundedPrice = Math.round(price / rules.tickSize) * rules.tickSize;
  return roundedPrice.toFixed(rules.pricePrecision);
}

/**
 * Detect Binance platform type
 */
export function isBinanceDemo(platform: string): boolean {
  return platform === 'binance-demo';
}

export function isBinanceOldTestnet(platform: string): boolean {
  return platform === 'binance-futures-testnet';
}

/**
 * Get Binance API base URL
 * Supports Live, Demo Trading, and Old Testnet
 */
export function getBinanceBaseUrl(
  marketType: 'spot' | 'futures',
  testnet: boolean,
  platform?: string
): string {
  // If platform is specified, use it to determine endpoint
  if (platform) {
    if (isBinanceDemo(platform)) {
      // New Demo Trading (demo.binance.com)
      // Demo Trading uses the SAME endpoints as Live, but with demo API keys
      if (marketType === 'futures') {
        return 'https://fapi.binance.com';  // Demo Futures uses Live Futures endpoint
      } else {
        return 'https://api.binance.com';  // Demo Spot uses Live Spot endpoint
      }
    }
    
    if (isBinanceOldTestnet(platform)) {
      // Old Testnet (deprecated)
      if (marketType === 'futures') {
        return 'https://testnet.binancefuture.com';
      } else {
        return 'https://testnet.binance.vision';
      }
    }
  }
  
  // Default behavior (Live or Old Testnet based on testnet flag)
  if (marketType === 'futures') {
    return testnet
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com';
  }
  
  return testnet
    ? 'https://testnet.binance.vision'
    : 'https://api.binance.com';
}

/**
 * Format symbol for Binance API (remove / separator)
 */
export function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

/**
 * Parse symbol from Binance format (add / separator)
 */
export function parseSymbol(symbol: string): string {
  // Try to detect quote asset (common ones: USDT, BUSD, BTC, ETH)
  const quoteAssets = ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB'];
  
  for (const quote of quoteAssets) {
    if (symbol.endsWith(quote)) {
      const base = symbol.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
  }
  
  return symbol;
}

/**
 * Validate symbol format
 */
export function validateSymbol(symbol: string): boolean {
  // Basic validation - symbol should be like BTCUSDT
  return /^[A-Z0-9]{6,20}$/.test(formatSymbol(symbol));
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


