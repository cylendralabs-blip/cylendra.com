/**
 * Symbol Information Operations
 * 
 * Functions for getting symbol trading rules and information
 */

import { createSignature } from './utils.ts';

/**
 * Format symbol for Binance API (remove / separator)
 */
function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

/**
 * Symbol Trading Rules
 */
export interface SymbolRules {
  quantityPrecision: number;
  pricePrecision: number;
  tickSize: number;
  minQty: number;
  stepSize: number;
}

/**
 * Extract trading rules from symbol info
 */
export function extractSymbolRules(symbolInfo: any, marketType: string = 'spot'): SymbolRules {
  let quantityPrecision = 3; // default for futures
  let pricePrecision = 2; // default for futures
  let tickSize = 0.01;
  let minQty = 0.001;
  let stepSize = 0.001;
  
  if (marketType === 'futures') {
    quantityPrecision = symbolInfo.quantityPrecision || 3;
    pricePrecision = symbolInfo.pricePrecision || 2;
    
    const lotSizeFilter = symbolInfo.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
    if (lotSizeFilter) {
      minQty = parseFloat(lotSizeFilter.minQty || '0.001');
      stepSize = parseFloat(lotSizeFilter.stepSize || '0.001');
      
      if (stepSize > 0) {
        const calculatedPrecision = Math.max(0, -Math.floor(Math.log10(stepSize)));
        quantityPrecision = Math.max(quantityPrecision, calculatedPrecision);
      }
    }
    
    const priceFilter = symbolInfo.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');
    if (priceFilter) {
      tickSize = parseFloat(priceFilter.tickSize || '0.01');
      if (tickSize > 0) {
        const calculatedPricePrecision = Math.max(0, -Math.floor(Math.log10(tickSize)));
        pricePrecision = Math.max(pricePrecision, calculatedPricePrecision);
      }
    }
  } else {
    // Spot market rules
    const lotSizeFilter = symbolInfo.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
    if (lotSizeFilter) {
      stepSize = parseFloat(lotSizeFilter.stepSize || '0.001');
      minQty = parseFloat(lotSizeFilter.minQty || '0.001');
      
      if (stepSize > 0) {
        quantityPrecision = Math.max(0, -Math.floor(Math.log10(stepSize)));
      }
    }
    
    const priceFilter = symbolInfo.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');
    if (priceFilter) {
      tickSize = parseFloat(priceFilter.tickSize || '0.01');
      if (tickSize > 0) {
        pricePrecision = Math.max(0, -Math.floor(Math.log10(tickSize)));
      }
    }
  }
  
  return { quantityPrecision, pricePrecision, tickSize, minQty, stepSize };
}

/**
 * Get symbol information from exchange
 */
export async function getSymbolInfo(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  symbol: string,
  marketType: string = 'spot'
): Promise<SymbolRules | null> {
  try {
    console.log(`Getting symbol info for ${symbol} in ${marketType} market`);
    
    const timestamp = Date.now();
    const formattedSymbol = formatSymbol(symbol);
    
    const endpoint = marketType === 'futures'
      ? '/fapi/v1/exchangeInfo'
      : '/api/v3/exchangeInfo';
    
    const params: any = { timestamp };
    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString, secretKey);
    const finalQuery = `${queryString}&signature=${signature}`;
    
    const response = await fetch(`${baseUrl}${endpoint}?${finalQuery}`, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to get symbol info: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const symbolInfo = data.symbols?.find((s: any) => s.symbol === formattedSymbol);
    
    if (!symbolInfo) {
      console.error(`Symbol ${formattedSymbol} not found`);
      return null;
    }
    
    const tradingRules = extractSymbolRules(symbolInfo, marketType);
    
    console.log(`Symbol ${formattedSymbol} trading rules:`, {
      quantityPrecision: tradingRules.quantityPrecision,
      pricePrecision: tradingRules.pricePrecision,
      tickSize: tradingRules.tickSize,
      minQty: tradingRules.minQty,
      stepSize: tradingRules.stepSize
    });
    
    return tradingRules;
  } catch (error) {
    console.error('Error getting symbol info:', error);
    // Return default rules as fallback
    return {
      quantityPrecision: 3,
      pricePrecision: 2,
      tickSize: 0.01,
      minQty: 0.001,
      stepSize: 0.001
    };
  }
}

