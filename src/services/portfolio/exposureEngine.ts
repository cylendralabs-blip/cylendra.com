/**
 * Exposure Engine
 * 
 * Enhanced exposure calculation engine
 * Works with Portfolio Engine for unified exposure tracking
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 5
 */

import { Exposure } from '@/core/models/Exposure';
import { Equity } from '@/core/models/Equity';
import { calculateExposure } from './portfolioEngine';

/**
 * Calculate Exposure from Equity
 * Uses portfolioEngine's calculateExposure function
 */
export function calculateExposureFromEquity(
  equity: Equity,
  usdPrices: { [symbol: string]: number }
): Exposure {
  return calculateExposure(equity, usdPrices);
}

/**
 * Check if exposure exceeds limit
 */
export function checkExposureLimit(
  exposure: Exposure,
  maxExposurePct: number
): { exceeds: boolean; currentPct: number; maxPct: number } {
  return {
    exceeds: exposure.totalPct > maxExposurePct,
    currentPct: exposure.totalPct,
    maxPct: maxExposurePct
  };
}

/**
 * Check per-symbol exposure limit
 */
export function checkSymbolExposureLimit(
  exposure: Exposure,
  symbol: string,
  maxSymbolExposurePct: number
): { exceeds: boolean; currentPct: number; maxPct: number } {
  const symbolExposure = exposure.perSymbol[symbol];
  if (!symbolExposure) {
    return { exceeds: false, currentPct: 0, maxPct: maxSymbolExposurePct };
  }
  
  return {
    exceeds: symbolExposure.exposurePct > maxSymbolExposurePct,
    currentPct: symbolExposure.exposurePct,
    maxPct: maxSymbolExposurePct
  };
}

/**
 * Get exposure warnings
 */
export function getExposureWarnings(
  exposure: Exposure,
  limits: {
    maxTotalExposurePct: number;
    maxSymbolExposurePct: number;
    warningThresholdPct: number;
  }
): string[] {
  const warnings: string[] = [];
  
  // Check total exposure
  if (exposure.totalPct > limits.maxTotalExposurePct) {
    warnings.push(
      `Total exposure (${exposure.totalPct.toFixed(2)}%) exceeds limit (${limits.maxTotalExposurePct}%)`
    );
  } else if (exposure.totalPct > limits.warningThresholdPct) {
    warnings.push(
      `Total exposure (${exposure.totalPct.toFixed(2)}%) is approaching limit (${limits.maxTotalExposurePct}%)`
    );
  }
  
  // Check per-symbol exposure
  for (const symbol in exposure.perSymbol) {
    const symbolExposure = exposure.perSymbol[symbol];
    if (symbolExposure.exposurePct > limits.maxSymbolExposurePct) {
      warnings.push(
        `${symbol} exposure (${symbolExposure.exposurePct.toFixed(2)}%) exceeds limit (${limits.maxSymbolExposurePct}%)`
      );
    }
  }
  
  return warnings;
}

/**
 * Calculate exposure risk level
 */
export function calculateExposureRiskLevel(
  exposure: Exposure,
  limits: {
    maxTotalExposurePct: number;
    maxSymbolExposurePct: number;
  }
): 'low' | 'medium' | 'high' | 'critical' {
  if (exposure.totalPct > limits.maxTotalExposurePct) {
    return 'critical';
  }
  
  if (exposure.totalPct > limits.maxTotalExposurePct * 0.8) {
    return 'high';
  }
  
  // Check if any symbol exceeds limit
  for (const symbol in exposure.perSymbol) {
    if (exposure.perSymbol[symbol].exposurePct > limits.maxSymbolExposurePct) {
      return 'high';
    }
  }
  
  if (exposure.totalPct > limits.maxTotalExposurePct * 0.5) {
    return 'medium';
  }
  
  return 'low';
}

