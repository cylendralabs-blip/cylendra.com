/**
 * OKX Portfolio Service
 * 
 * Fetches portfolio data from OKX exchange
 * Normalizes data to unified format
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 1
 */

import { SpotBalance, FuturesBalance, ExchangePosition, Equity } from '@/core/models/Equity';

/**
 * OKX Account Balance Response
 */
interface OKXAccountBalance {
  data: Array<{
    details: Array<{
      ccy: string;
      availBal: string;
      frozenBal: string;
      bal: string;
    }>;
  }>;
}

/**
 * OKX Positions Response
 */
interface OKXPositions {
  data: Array<{
    instId: string;
    posSide: 'long' | 'short' | 'net';
    pos: string;
    avgPx: string;
    markPx: string;
    upl: string;
    liqPx?: string;
    lever: string;
    mgnMode: 'isolated' | 'cross';
  }>;
}

/**
 * OKX Credentials
 */
export interface OKXCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  testnet?: boolean;
}

/**
 * Get OKX Spot Balances
 * Note: This should be called from Edge Function with API credentials
 */
export async function getOKXSpotBalances(
  credentials: OKXCredentials
): Promise<SpotBalance[]> {
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Get OKX Futures Balances
 */
export async function getOKXFuturesBalances(
  credentials: OKXCredentials
): Promise<FuturesBalance[]> {
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Get OKX Open Positions
 */
export async function getOKXOpenPositions(
  credentials: OKXCredentials
): Promise<ExchangePosition[]> {
  throw new Error(
    'Direct API calls from browser are not allowed. ' +
    'Use Edge Function exchange-portfolio for portfolio data.'
  );
}

/**
 * Normalize OKX Spot Balance
 */
export function normalizeOKXSpotBalance(
  okxBalance: { ccy: string; availBal: string; frozenBal: string; bal: string },
  usdPrice: number
): SpotBalance {
  const free = parseFloat(okxBalance.availBal || '0');
  const locked = parseFloat(okxBalance.frozenBal || '0');
  const total = parseFloat(okxBalance.bal || '0');
  
  return {
    symbol: okxBalance.ccy,
    free,
    locked,
    total,
    valueUsd: total * usdPrice,
    exchange: 'okx'
  };
}

/**
 * Normalize OKX Futures Balance
 */
export function normalizeOKXFuturesBalance(
  okxAccount: { details: Array<{ ccy: string; availBal: string; bal: string }> },
  asset: string,
  usdPrice: number,
  leverage?: number
): FuturesBalance {
  const accountDetail = okxAccount.details.find(d => d.ccy === asset);
  if (!accountDetail) {
    return {
      symbol: asset,
      available: 0,
      margin: 0,
      unrealizedPnl: 0,
      walletBalance: 0,
      valueUsd: 0,
      leverage,
      exchange: 'okx'
    };
  }
  
  const available = parseFloat(accountDetail.availBal || '0');
  const walletBalance = parseFloat(accountDetail.bal || '0');
  const margin = walletBalance - available;
  
  return {
    symbol: asset,
    available,
    margin,
    unrealizedPnl: 0, // Will be calculated from positions
    walletBalance,
    valueUsd: walletBalance * usdPrice,
    leverage,
    exchange: 'okx'
  };
}

/**
 * Normalize OKX Position
 */
export function normalizeOKXPosition(
  okxPosition: {
    instId: string;
    posSide: 'long' | 'short' | 'net';
    pos: string;
    avgPx: string;
    markPx: string;
    upl: string;
    liqPx?: string;
    lever: string;
    mgnMode: 'isolated' | 'cross';
  }
): ExchangePosition {
  const size = parseFloat(okxPosition.pos || '0');
  const absSize = Math.abs(size);
  const side = size > 0 ? 'long' : 'short';
  
  // Extract base symbol from instId (e.g., BTC-USDT-SWAP -> BTC)
  const symbolParts = okxPosition.instId.split('-');
  const symbol = symbolParts[0];
  
  return {
    symbol,
    side,
    size: absSize,
    entryPrice: parseFloat(okxPosition.avgPx || '0'),
    markPrice: parseFloat(okxPosition.markPx || '0'),
    unrealizedPnl: parseFloat(okxPosition.upl || '0'),
    liquidationPrice: okxPosition.liqPx ? parseFloat(okxPosition.liqPx) : undefined,
    leverage: parseInt(okxPosition.lever || '1'),
    marketType: 'futures',
    exchange: 'okx'
  };
}

/**
 * Build Equity from OKX Data
 */
export function buildEquityFromOKX(
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

