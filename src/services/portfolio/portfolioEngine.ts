/**
 * Portfolio Engine
 * 
 * Main engine for portfolio calculations
 * Calculates equity, PnL, allocation, exposure
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 4
 */

import { Equity, SpotBalance, FuturesBalance, ExchangePosition } from '@/core/models/Equity';
import { AssetAllocation } from '@/core/models/PortfolioSnapshot';
import { Exposure, SymbolExposure, MarketExposure } from '@/core/models/Exposure';

/**
 * Calculate Asset Allocation from Equity
 */
export function calculateAssetAllocation(
  equity: Equity,
  usdPrices: { [symbol: string]: number }
): AssetAllocation {
  const allocation: AssetAllocation = {};
  const totalEquity = equity.total;
  
  // Process spot balances
  for (const balance of equity.spotBalances) {
    if (balance.total > 0) {
      const usdPrice = usdPrices[balance.symbol] || 0;
      const valueUsd = balance.total * usdPrice;
      
      if (valueUsd > 0.01) { // Only include meaningful allocations
        allocation[balance.symbol] = {
          balance: balance.total,
          valueUsd,
          percentage: totalEquity > 0 ? (valueUsd / totalEquity) * 100 : 0,
          marketType: 'spot'
        };
      }
    }
  }
  
  // Process futures balances
  for (const balance of equity.futuresBalances) {
    if (balance.walletBalance > 0) {
      const usdPrice = usdPrices[balance.symbol] || 0;
      const valueUsd = balance.walletBalance * usdPrice;
      
      if (valueUsd > 0.01) {
        const existing = allocation[balance.symbol];
        if (existing) {
          // Merge with spot allocation
          existing.balance += balance.walletBalance;
          existing.valueUsd += valueUsd;
          existing.percentage = totalEquity > 0 ? (existing.valueUsd / totalEquity) * 100 : 0;
        } else {
          allocation[balance.symbol] = {
            balance: balance.walletBalance,
            valueUsd,
            percentage: totalEquity > 0 ? (valueUsd / totalEquity) * 100 : 0,
            marketType: 'futures'
          };
        }
      }
    }
  }
  
  // Process open positions (add to exposure calculation, not allocation directly)
  for (const position of equity.openPositions) {
    const baseSymbol = position.symbol.split('-')[0].split('/')[0]; // Extract base symbol
    const usdPrice = usdPrices[baseSymbol] || usdPrices[position.symbol] || 0;
    const positionValue = position.size * position.markPrice;
    const valueUsd = positionValue * usdPrice;
    
    if (valueUsd > 0.01) {
      const existing = allocation[baseSymbol];
      if (existing) {
        // Add futures position exposure
        existing.valueUsd += Math.abs(valueUsd);
        existing.percentage = totalEquity > 0 ? (existing.valueUsd / totalEquity) * 100 : 0;
      }
    }
  }
  
  return allocation;
}

/**
 * Calculate Exposure from Equity
 */
export function calculateExposure(
  equity: Equity,
  usdPrices: { [symbol: string]: number }
): Exposure {
  const perSymbol: { [symbol: string]: SymbolExposure } = {};
  let spotTotalUsd = 0;
  let futuresTotalUsd = 0;
  let longTotalUsd = 0;
  let shortTotalUsd = 0;
  
  // Calculate spot exposure
  for (const balance of equity.spotBalances) {
    if (balance.total > 0) {
      const usdPrice = usdPrices[balance.symbol] || 0;
      const exposureUsd = balance.total * usdPrice;
      spotTotalUsd += exposureUsd;
      
      if (!perSymbol[balance.symbol]) {
        perSymbol[balance.symbol] = {
          symbol: balance.symbol,
          totalUsd: 0,
          spotUsd: 0,
          futuresUsd: 0,
          longUsd: 0,
          shortUsd: 0,
          netUsd: 0,
          exposurePct: 0,
          positionsCount: 0
        };
      }
      
      perSymbol[balance.symbol].spotUsd += exposureUsd;
      perSymbol[balance.symbol].totalUsd += exposureUsd;
    }
  }
  
  // Calculate futures exposure from positions
  for (const position of equity.openPositions) {
    const baseSymbol = position.symbol.split('-')[0].split('/')[0];
    const usdPrice = usdPrices[baseSymbol] || usdPrices[position.symbol] || 0;
    const exposureUsd = position.size * position.markPrice * usdPrice;
    futuresTotalUsd += exposureUsd;
    
    if (!perSymbol[baseSymbol]) {
      perSymbol[baseSymbol] = {
        symbol: baseSymbol,
        totalUsd: 0,
        spotUsd: 0,
        futuresUsd: 0,
        longUsd: 0,
        shortUsd: 0,
        netUsd: 0,
        exposurePct: 0,
        positionsCount: 0
      };
    }
    
    perSymbol[baseSymbol].futuresUsd += exposureUsd;
    perSymbol[baseSymbol].totalUsd += exposureUsd;
    perSymbol[baseSymbol].positionsCount += 1;
    
    if (position.side === 'long') {
      perSymbol[baseSymbol].longUsd += exposureUsd;
      longTotalUsd += exposureUsd;
    } else {
      perSymbol[baseSymbol].shortUsd += exposureUsd;
      shortTotalUsd += exposureUsd;
    }
    
    perSymbol[baseSymbol].netUsd = perSymbol[baseSymbol].longUsd - perSymbol[baseSymbol].shortUsd;
  }
  
  // Calculate exposure percentages
  const totalExposureUsd = spotTotalUsd + futuresTotalUsd;
  const totalExposurePct = equity.total > 0 ? (totalExposureUsd / equity.total) * 100 : 0;
  
  for (const symbol in perSymbol) {
    perSymbol[symbol].exposurePct = equity.total > 0 
      ? (perSymbol[symbol].totalUsd / equity.total) * 100 
      : 0;
  }
  
  const byMarket: MarketExposure = {
    spotUsd: spotTotalUsd,
    futuresUsd: futuresTotalUsd,
    totalUsd: totalExposureUsd,
    spotPct: equity.total > 0 ? (spotTotalUsd / equity.total) * 100 : 0,
    futuresPct: equity.total > 0 ? (futuresTotalUsd / equity.total) * 100 : 0,
    totalPct: totalExposurePct
  };
  
  return {
    totalUsd: totalExposureUsd,
    totalPct: totalExposurePct,
    perSymbol,
    byMarket,
    longTotalUsd,
    shortTotalUsd,
    netUsd: longTotalUsd - shortTotalUsd,
    lastCalculated: new Date().toISOString()
  };
}

/**
 * Calculate Total Equity
 */
export function calculateTotalEquity(equity: Equity): number {
  return equity.spot + equity.futures + equity.unrealizedPnl;
}

/**
 * Calculate Portfolio Value (Total Equity)
 */
export function calculatePortfolioValue(equity: Equity): number {
  return calculateTotalEquity(equity);
}

/**
 * Get Top Assets by Value
 */
export function getTopAssets(
  allocation: AssetAllocation,
  limit: number = 10
): Array<{ symbol: string; valueUsd: number; percentage: number }> {
  return Object.entries(allocation)
    .map(([symbol, data]) => ({
      symbol,
      valueUsd: data.valueUsd,
      percentage: data.percentage
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, limit);
}

/**
 * Get Top Exposed Symbols
 */
export function getTopExposedSymbols(
  exposure: Exposure,
  limit: number = 10
): SymbolExposure[] {
  return Object.values(exposure.perSymbol)
    .sort((a, b) => b.totalUsd - a.totalUsd)
    .slice(0, limit);
}

