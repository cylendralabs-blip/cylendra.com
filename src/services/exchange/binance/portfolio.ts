/**
 * Binance Portfolio Service
 * 
 * Fetches portfolio data from Binance exchange
 * Normalizes data to unified format
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 1
 */

import { SpotBalance, FuturesBalance, ExchangePosition, Equity } from '@/core/models/Equity';

/**
 * Binance Spot Account Response
 */
interface BinanceSpotAccount {
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

/**
 * Binance Futures Account Response
 */
interface BinanceFuturesAccount {
  assets: Array<{
    asset: string;
    availableBalance: string;
    walletBalance: string;
    unrealizedProfit: string;
  }>;
  positions: Array<{
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    markPrice: string;
    unRealizedProfit: string;
    liquidationPrice: string;
    leverage: string;
    positionSide: 'LONG' | 'SHORT';
  }>;
}

/**
 * Binance Credentials
 */
export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
}

/**
 * Get Binance Spot Balances
 * Note: This should be called from Edge Function with API credentials
 */
export async function getBinanceSpotBalances(
  credentials: BinanceCredentials
): Promise<SpotBalance[]> {
  // This is a client-side interface
  // Actual API call should be made from Edge Function
  // See supabase/functions/exchange-portfolio/platforms/binance.ts for implementation
  
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Get Binance Futures Balances
 */
export async function getBinanceFuturesBalances(
  credentials: BinanceCredentials
): Promise<FuturesBalance[]> {
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Get Binance Open Positions
 */
export async function getBinanceOpenPositions(
  credentials: BinanceCredentials
): Promise<ExchangePosition[]> {
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Normalize Binance Spot Balance
 */
export function normalizeBinanceSpotBalance(
  binanceBalance: { asset: string; free: string; locked: string },
  usdPrice: number
): SpotBalance {
  const free = parseFloat(binanceBalance.free || '0');
  const locked = parseFloat(binanceBalance.locked || '0');
  const total = free + locked;
  
  return {
    symbol: binanceBalance.asset,
    free,
    locked,
    total,
    valueUsd: total * usdPrice,
    exchange: 'binance'
  };
}

/**
 * Normalize Binance Futures Balance
 */
export function normalizeBinanceFuturesBalance(
  binanceAsset: {
    asset: string;
    availableBalance: string;
    walletBalance: string;
    unrealizedProfit: string;
  },
  usdPrice: number,
  leverage?: number
): FuturesBalance {
  const available = parseFloat(binanceAsset.availableBalance || '0');
  const walletBalance = parseFloat(binanceAsset.walletBalance || '0');
  const unrealizedPnl = parseFloat(binanceAsset.unrealizedProfit || '0');
  const margin = walletBalance - available;
  
  return {
    symbol: binanceAsset.asset,
    available,
    margin,
    unrealizedPnl,
    walletBalance,
    valueUsd: walletBalance * usdPrice,
    leverage,
    exchange: 'binance'
  };
}

/**
 * Normalize Binance Position
 */
export function normalizeBinancePosition(
  binancePosition: {
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    markPrice: string;
    unRealizedProfit: string;
    liquidationPrice: string;
    leverage: string;
    positionSide: 'LONG' | 'SHORT';
  }
): ExchangePosition {
  const size = parseFloat(binancePosition.positionAmt || '0');
  const absSize = Math.abs(size);
  const side = size > 0 ? 'long' : 'short';
  
  return {
    symbol: binancePosition.symbol,
    side,
    size: absSize,
    entryPrice: parseFloat(binancePosition.entryPrice || '0'),
    markPrice: parseFloat(binancePosition.markPrice || '0'),
    unrealizedPnl: parseFloat(binancePosition.unRealizedProfit || '0'),
    liquidationPrice: binancePosition.liquidationPrice 
      ? parseFloat(binancePosition.liquidationPrice) 
      : undefined,
    leverage: parseInt(binancePosition.leverage || '1'),
    marketType: 'futures',
    exchange: 'binance'
  };
}

/**
 * Build Equity from Binance Data
 */
export function buildEquityFromBinance(
  spotBalances: SpotBalance[],
  futuresBalances: FuturesBalance[],
  openPositions: ExchangePosition[]
): Equity {
  const spotEquity = spotBalances.reduce((sum, b) => sum + b.valueUsd, 0);
  const futuresEquity = futuresBalances.reduce((sum, b) => sum + b.valueUsd, 0);
  const unrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  
  const available = spotBalances.reduce((sum, b) => sum + b.free * (b.valueUsd / b.total || 0), 0) +
                   futuresBalances.reduce((sum, b) => sum + b.available * (b.valueUsd / b.walletBalance || 0), 0);
  
  const locked = spotBalances.reduce((sum, b) => sum + b.locked * (b.valueUsd / b.total || 0), 0) +
                futuresBalances.reduce((sum, b) => sum + b.margin * (b.valueUsd / b.walletBalance || 0), 0);
  
  const totalEquity = spotEquity + futuresEquity + unrealizedPnl;
  
  return {
    total: totalEquity,
    spot: spotEquity,
    futures: futuresEquity,
    unrealizedPnl,
    realizedPnl: 0, // Will be calculated from closed positions
    available,
    locked,
    spotBalances,
    futuresBalances,
    openPositions,
    lastUpdated: new Date().toISOString()
  };
}

