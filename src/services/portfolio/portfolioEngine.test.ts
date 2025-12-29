/**
 * Portfolio Engine Tests
 * 
 * Unit tests for Portfolio Engine
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAssetAllocation,
  calculateExposure,
  calculateTotalEquity,
  calculatePortfolioValue,
  getTopAssets,
  getTopExposedSymbols
} from './portfolioEngine';
import { Equity } from '@/core/models/Equity';

describe('Portfolio Engine', () => {
  let mockEquity: Equity;

  beforeEach(() => {
    mockEquity = {
      total: 10000,
      spot: 6000,
      futures: 4000,
      unrealizedPnl: 500,
      realizedPnl: 1000,
      available: 5500,
      locked: 500,
      spotBalances: [
        {
          symbol: 'BTC',
          free: 0.1,
          locked: 0,
          total: 0.1,
          valueUsd: 5000,
          exchange: 'binance'
        },
        {
          symbol: 'USDT',
          free: 1000,
          locked: 500,
          total: 1500,
          valueUsd: 1500,
          exchange: 'binance'
        }
      ],
      futuresBalances: [
        {
          symbol: 'USDT',
          available: 3500,
          margin: 500,
          unrealizedPnl: 500,
          walletBalance: 4000,
          valueUsd: 4000,
          exchange: 'binance'
        }
      ],
      openPositions: [
        {
          symbol: 'BTCUSDT',
          side: 'long',
          size: 0.05,
          entryPrice: 50000,
          markPrice: 51000,
          unrealizedPnl: 500,
          leverage: 10,
          marketType: 'futures',
          exchange: 'binance'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  });

  describe('calculateAssetAllocation', () => {
    it('should calculate asset allocation correctly', () => {
      const usdPrices = { BTC: 50000, USDT: 1 };
      const allocation = calculateAssetAllocation(mockEquity, usdPrices);
      
      expect(allocation['BTC']).toBeDefined();
      expect(allocation['BTC'].valueUsd).toBe(5000);
      expect(allocation['BTC'].percentage).toBeGreaterThan(0);
      expect(allocation['USDT']).toBeDefined();
    });

    it('should calculate percentages correctly', () => {
      const usdPrices = { BTC: 50000, USDT: 1 };
      const allocation = calculateAssetAllocation(mockEquity, usdPrices);
      
      const totalPercentage = Object.values(allocation).reduce((sum, asset) => 
        sum + asset.percentage, 0
      );
      
      expect(totalPercentage).toBeLessThanOrEqual(100);
    });

    it('should merge spot and futures balances for same symbol', () => {
      const usdPrices = { USDT: 1 };
      const allocation = calculateAssetAllocation(mockEquity, usdPrices);
      
      expect(allocation['USDT']).toBeDefined();
      expect(allocation['USDT'].valueUsd).toBeGreaterThan(1500);
    });
  });

  describe('calculateExposure', () => {
    it('should calculate total exposure correctly', () => {
      const usdPrices = { BTC: 51000, USDT: 1 };
      const exposure = calculateExposure(mockEquity, usdPrices);
      
      expect(exposure.totalUsd).toBeGreaterThan(0);
      expect(exposure.totalPct).toBeGreaterThan(0);
    });

    it('should calculate per-symbol exposure', () => {
      const usdPrices = { BTC: 51000, USDT: 1 };
      const exposure = calculateExposure(mockEquity, usdPrices);
      
      expect(Object.keys(exposure.perSymbol).length).toBeGreaterThan(0);
    });

    it('should calculate market type exposure', () => {
      const usdPrices = { BTC: 51000, USDT: 1 };
      const exposure = calculateExposure(mockEquity, usdPrices);
      
      expect(exposure.byMarket.spotUsd).toBeGreaterThanOrEqual(0);
      expect(exposure.byMarket.futuresUsd).toBeGreaterThanOrEqual(0);
      expect(exposure.byMarket.totalUsd).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalEquity', () => {
    it('should calculate total equity correctly', () => {
      const totalEquity = calculateTotalEquity(mockEquity);
      
      expect(totalEquity).toBe(mockEquity.total);
    });

    it('should be spot + futures + unrealized PnL', () => {
      const totalEquity = calculateTotalEquity(mockEquity);
      const expected = mockEquity.spot + mockEquity.futures + mockEquity.unrealizedPnl;
      
      expect(totalEquity).toBe(expected);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('should return total equity', () => {
      const value = calculatePortfolioValue(mockEquity);
      
      expect(value).toBe(mockEquity.total);
    });
  });

  describe('getTopAssets', () => {
    it('should return top assets by value', () => {
      const usdPrices = { BTC: 50000, USDT: 1 };
      const allocation = calculateAssetAllocation(mockEquity, usdPrices);
      const topAssets = getTopAssets(allocation, 5);
      
      expect(topAssets.length).toBeLessThanOrEqual(5);
      expect(topAssets[0].valueUsd).toBeGreaterThanOrEqual(topAssets[1]?.valueUsd || 0);
    });

    it('should respect limit parameter', () => {
      const usdPrices = { BTC: 50000, USDT: 1 };
      const allocation = calculateAssetAllocation(mockEquity, usdPrices);
      const topAssets = getTopAssets(allocation, 2);
      
      expect(topAssets.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getTopExposedSymbols', () => {
    it('should return top exposed symbols', () => {
      const usdPrices = { BTC: 51000, USDT: 1 };
      const exposure = calculateExposure(mockEquity, usdPrices);
      const topExposed = getTopExposedSymbols(exposure, 5);
      
      expect(topExposed.length).toBeLessThanOrEqual(5);
      if (topExposed.length > 1) {
        expect(topExposed[0].totalUsd).toBeGreaterThanOrEqual(topExposed[1].totalUsd);
      }
    });
  });
});

