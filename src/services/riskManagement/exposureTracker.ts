/**
 * Exposure Tracker
 * 
 * Tracks and enforces exposure limits
 * Phase 5: Risk Management Engine (Advanced)
 */

import { Trade, Position } from '@/core/models';

/**
 * Exposure Snapshot
 */
export interface ExposureSnapshot {
  user_id: string;
  timestamp: string;
  total_exposure: number;
  total_exposure_percentage: number;
  symbol_exposures: Record<string, {
    exposure: number;
    exposure_percentage: number;
    trades_count: number;
  }>;
  market_type_exposures: {
    spot: number;
    futures: number;
  };
  active_trades_count: number;
}

/**
 * Calculate total exposure from trades
 */
export function calculateTotalExposure(
  trades: Trade[],
  currentEquity: number
): {
  totalExposure: number;
  totalExposurePercentage: number;
  symbolExposures: Record<string, {
    exposure: number;
    exposurePercentage: number;
    tradesCount: number;
  }>;
  marketTypeExposures: {
    spot: number;
    futures: number;
  };
} {
  // Filter active trades only
  const activeTrades = trades.filter(t => 
    t.status === 'ACTIVE' || t.status === 'PENDING'
  );

  // Calculate total exposure (sum of total_invested)
  const totalExposure = activeTrades.reduce((sum, trade) => {
    return sum + (trade.total_invested || 0);
  }, 0);

  // Calculate total exposure percentage
  const totalExposurePercentage = currentEquity > 0
    ? (totalExposure / currentEquity) * 100
    : 0;

  // Calculate per-symbol exposure
  const symbolExposures: Record<string, {
    exposure: number;
    exposurePercentage: number;
    tradesCount: number;
  }> = {};

  activeTrades.forEach(trade => {
    if (!symbolExposures[trade.symbol]) {
      symbolExposures[trade.symbol] = {
        exposure: 0,
        exposurePercentage: 0,
        tradesCount: 0
      };
    }

    symbolExposures[trade.symbol].exposure += trade.total_invested || 0;
    symbolExposures[trade.symbol].tradesCount += 1;
  });

  // Calculate exposure percentage per symbol
  Object.keys(symbolExposures).forEach(symbol => {
    symbolExposures[symbol].exposurePercentage = currentEquity > 0
      ? (symbolExposures[symbol].exposure / currentEquity) * 100
      : 0;
  });

  // Calculate per market type exposure
  const marketTypeExposures = {
    spot: 0,
    futures: 0
  };

  activeTrades.forEach(trade => {
    if (trade.trade_type === 'spot') {
      marketTypeExposures.spot += trade.total_invested || 0;
    } else if (trade.trade_type === 'futures') {
      marketTypeExposures.futures += trade.total_invested || 0;
    }
  });

  return {
    totalExposure,
    totalExposurePercentage,
    symbolExposures,
    marketTypeExposures
  };
}

/**
 * Check exposure limits
 */
export function checkExposureLimits(
  symbolExposures: Record<string, { exposure: number; exposurePercentage: number }>,
  totalExposurePercentage: number,
  maxExposurePerSymbol?: number,
  maxExposureTotal?: number,
  symbol?: string
): {
  exceeded: boolean;
  reason?: string;
  flag?: string;
} {
  // Check per-symbol exposure (if symbol is provided)
  if (symbol && maxExposurePerSymbol) {
    const symbolExposure = symbolExposures[symbol];
    if (symbolExposure && symbolExposure.exposurePercentage >= maxExposurePerSymbol) {
      return {
        exceeded: true,
        reason: `Exposure per symbol exceeded: ${symbolExposure.exposurePercentage.toFixed(2)}% >= ${maxExposurePerSymbol}% for ${symbol}`,
        flag: 'EXPOSURE_PER_SYMBOL_EXCEEDED'
      };
    }
  }

  // Check total exposure
  if (maxExposureTotal && totalExposurePercentage >= maxExposureTotal) {
    return {
      exceeded: true,
      reason: `Total exposure exceeded: ${totalExposurePercentage.toFixed(2)}% >= ${maxExposureTotal}%`,
      flag: 'TOTAL_EXPOSURE_EXCEEDED'
    };
  }

  return { exceeded: false };
}

/**
 * Create exposure snapshot
 */
export function createExposureSnapshot(
  userId: string,
  trades: Trade[],
  currentEquity: number
): ExposureSnapshot {
  const exposureData = calculateTotalExposure(trades, currentEquity);

  // Convert symbolExposures from camelCase to snake_case
  const symbolExposures: Record<string, {
    exposure: number;
    exposure_percentage: number;
    trades_count: number;
  }> = {};
  
  for (const [symbol, data] of Object.entries(exposureData.symbolExposures)) {
    symbolExposures[symbol] = {
      exposure: data.exposure,
      exposure_percentage: data.exposurePercentage,
      trades_count: data.tradesCount,
    };
  }

  return {
    user_id: userId,
    timestamp: new Date().toISOString(),
    total_exposure: exposureData.totalExposure,
    total_exposure_percentage: exposureData.totalExposurePercentage,
    symbol_exposures: symbolExposures,
    market_type_exposures: exposureData.marketTypeExposures,
    active_trades_count: trades.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING').length
  };
}

