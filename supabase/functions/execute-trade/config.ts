/**
 * Execute Trade Configuration
 * 
 * Configuration constants and endpoints
 */

/**
 * CORS Headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Binance API Endpoints
 */
export const BINANCE_ENDPOINTS = {
  // Live (Mainnet)
  FUTURES_MAINNET: 'https://fapi.binance.com',
  SPOT_MAINNET: 'https://api.binance.com',
  
  // Old Testnet (deprecated, kept for compatibility)
  FUTURES_TESTNET: 'https://testnet.binancefuture.com',
  SPOT_TESTNET: 'https://testnet.binance.vision',
  
  // New Demo Trading (demo.binance.com)
  // Demo Trading uses the SAME endpoints as Live, but with demo API keys
  FUTURES_DEMO: 'https://fapi.binance.com',  // Demo Futures uses Live Futures endpoint
  SPOT_DEMO: 'https://api.binance.com',      // Demo Spot uses Live Spot endpoint
} as const;

/**
 * Detect if platform is Demo Trading
 */
export function isBinanceDemo(platform: string): boolean {
  return platform === 'binance-demo';
}

/**
 * Detect if platform is old Testnet (deprecated)
 */
export function isBinanceOldTestnet(platform: string): boolean {
  return platform === 'binance-futures-testnet';
}

/**
 * Get Binance API Base URL
 * Supports Live, Old Testnet, and New Demo Trading
 */
export function getBinanceApiUrl(
  platform: string,
  marketType: 'spot' | 'futures',
  testnet: boolean
): string {
  // New Demo Trading (demo.binance.com)
  if (isBinanceDemo(platform)) {
    if (marketType === 'futures') {
      return BINANCE_ENDPOINTS.FUTURES_DEMO;
    } else {
      // Demo Spot uses testnet endpoint (as per Binance docs)
      return BINANCE_ENDPOINTS.SPOT_DEMO;
    }
  }
  
  // Old Testnet (deprecated, kept for compatibility)
  if (isBinanceOldTestnet(platform)) {
    if (marketType === 'futures') {
      return BINANCE_ENDPOINTS.FUTURES_TESTNET;
    } else {
      return BINANCE_ENDPOINTS.SPOT_TESTNET;
    }
  }
  
  // Live (Mainnet) - binance platform
  if (platform === 'binance') {
    if (marketType === 'futures') {
      return BINANCE_ENDPOINTS.FUTURES_MAINNET;
    } else {
      return BINANCE_ENDPOINTS.SPOT_MAINNET;
    }
  }

  // Default fallback to Demo Futures
  return BINANCE_ENDPOINTS.FUTURES_DEMO;
}

/**
 * Get Bybit API URL
 */
export function getBybitApiUrl(testnet: boolean): string {
  if (testnet) {
    return 'https://api-testnet.bybit.com';
  }
  return 'https://api.bybit.com';
}

/**
 * Order Type Delays (in milliseconds)
 */
export const ORDER_DELAYS = {
  ENTRY: 300,
  DCA: 500,
  STOP_LOSS: 300,
  TAKE_PROFIT: 300,
} as const;
