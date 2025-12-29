/**
 * Performance Engine Tests
 * 
 * Unit tests for Performance Engine
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateWinRate,
  calculateAverageWin,
  calculateAverageLoss,
  calculateProfitFactor,
  calculateSharpeRatio,
  calculateDailyPnL,
  calculateWeeklyPnL,
  calculateMonthlyPnL,
  calculateCumulativePnL,
  calculateGrowthPercentage,
  calculatePortfolioMetrics
} from './performanceEngine';
import { Trade } from '@/core/models/Trade';

describe('Performance Engine', () => {
  let mockTrades: Trade[];

  beforeEach(() => {
    mockTrades = [
      {
        id: 'trade-1',
        symbol: 'BTCUSDT',
        side: 'buy',
        entry_price: 50000,
        current_price: 51000,
        quantity: 0.1,
        total_invested: 5000,
        status: 'CLOSED',
        trade_type: 'spot',
        leverage: null,
        dca_level: null,
        max_dca_level: null,
        stop_loss_price: 48000,
        take_profit_price: 52000,
        realized_pnl: 100,
        unrealized_pnl: null,
        platform: 'binance',
        opened_at: new Date('2025-01-10').toISOString(),
        closed_at: new Date('2025-01-11').toISOString(),
        created_at: new Date('2025-01-10').toISOString(),
        user_id: 'user-123',
        fees: null,
        commission: null,
        platform_trade_id: null,
        last_sync_at: null,
        sync_status: null,
        notes: null
      },
      {
        id: 'trade-2',
        symbol: 'ETHUSDT',
        side: 'buy',
        entry_price: 3000,
        current_price: 2900,
        quantity: 1,
        total_invested: 3000,
        status: 'CLOSED',
        trade_type: 'spot',
        leverage: null,
        dca_level: null,
        max_dca_level: null,
        stop_loss_price: 2800,
        take_profit_price: 3200,
        realized_pnl: -100,
        unrealized_pnl: null,
        platform: 'binance',
        opened_at: new Date('2025-01-12').toISOString(),
        closed_at: new Date('2025-01-13').toISOString(),
        created_at: new Date('2025-01-12').toISOString(),
        user_id: 'user-123',
        fees: null,
        commission: null,
        platform_trade_id: null,
        last_sync_at: null,
        sync_status: null,
        notes: null
      },
      {
        id: 'trade-3',
        symbol: 'BTCUSDT',
        side: 'sell',
        entry_price: 52000,
        current_price: 53000,
        quantity: 0.05,
        total_invested: 2600,
        status: 'CLOSED',
        trade_type: 'futures',
        leverage: 10,
        dca_level: null,
        max_dca_level: null,
        stop_loss_price: 54000,
        take_profit_price: 50000,
        realized_pnl: 500,
        unrealized_pnl: null,
        platform: 'binance',
        opened_at: new Date('2025-01-14').toISOString(),
        closed_at: new Date('2025-01-15').toISOString(),
        created_at: new Date('2025-01-14').toISOString(),
        user_id: 'user-123',
        fees: null,
        commission: null,
        platform_trade_id: null,
        last_sync_at: null,
        sync_status: null,
        notes: null
      }
    ];
  });

  describe('calculateWinRate', () => {
    it('should calculate win rate correctly', () => {
      const winRate = calculateWinRate(mockTrades);
      
      // 2 wins out of 3 trades = 66.67%
      expect(winRate).toBeCloseTo(66.67, 1);
    });

    it('should return 0 if no closed trades', () => {
      const activeTrades = mockTrades.map(t => ({ ...t, status: 'ACTIVE' as const }));
      const winRate = calculateWinRate(activeTrades);
      
      expect(winRate).toBe(0);
    });
  });

  describe('calculateAverageWin', () => {
    it('should calculate average win correctly', () => {
      const avgWin = calculateAverageWin(mockTrades);
      
      // (100 + 500) / 2 = 300
      expect(avgWin).toBe(300);
    });

    it('should return 0 if no winning trades', () => {
      const losingTrades = mockTrades.map(t => ({ ...t, realized_pnl: -100 }));
      const avgWin = calculateAverageWin(losingTrades);
      
      expect(avgWin).toBe(0);
    });
  });

  describe('calculateAverageLoss', () => {
    it('should calculate average loss correctly', () => {
      const avgLoss = calculateAverageLoss(mockTrades);
      
      // 100 / 1 = 100
      expect(avgLoss).toBe(100);
    });

    it('should return 0 if no losing trades', () => {
      const winningTrades = mockTrades.map(t => ({ ...t, realized_pnl: 100 }));
      const avgLoss = calculateAverageLoss(winningTrades);
      
      expect(avgLoss).toBe(0);
    });
  });

  describe('calculateProfitFactor', () => {
    it('should calculate profit factor correctly', () => {
      const profitFactor = calculateProfitFactor(mockTrades);
      
      // Total profit: 100 + 500 = 600
      // Total loss: 100
      // Profit factor: 600 / 100 = 6.0
      expect(profitFactor).toBe(6.0);
    });

    it('should return Infinity if no losses', () => {
      const winningTrades = mockTrades.map(t => ({ ...t, realized_pnl: 100 }));
      const profitFactor = calculateProfitFactor(winningTrades);
      
      expect(profitFactor).toBe(Infinity);
    });

    it('should return 0 if no profits', () => {
      const losingTrades = mockTrades.map(t => ({ ...t, realized_pnl: -100 }));
      const profitFactor = calculateProfitFactor(losingTrades);
      
      expect(profitFactor).toBe(0);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const dailyReturns = [1, 2, -1, 3, 0.5];
      const sharpeRatio = calculateSharpeRatio(dailyReturns);
      
      expect(sharpeRatio).toBeGreaterThan(0);
    });

    it('should return 0 if no returns', () => {
      const sharpeRatio = calculateSharpeRatio([]);
      
      expect(sharpeRatio).toBe(0);
    });
  });

  describe('calculateDailyPnL', () => {
    it('should calculate daily PnL correctly', () => {
      const today = new Date('2025-01-15');
      const dailyPnl = calculateDailyPnL(mockTrades, today);
      
      // Only trade-3 closed on 2025-01-15
      expect(dailyPnl).toBe(500);
    });

    it('should return 0 if no trades today', () => {
      const today = new Date('2025-01-20');
      const dailyPnl = calculateDailyPnL(mockTrades, today);
      
      expect(dailyPnl).toBe(0);
    });
  });

  describe('calculateWeeklyPnL', () => {
    it('should calculate weekly PnL correctly', () => {
      const date = new Date('2025-01-15'); // Week includes trade-2 and trade-3
      const weeklyPnl = calculateWeeklyPnL(mockTrades, date);
      
      // -100 + 500 = 400
      expect(weeklyPnl).toBe(400);
    });
  });

  describe('calculateMonthlyPnL', () => {
    it('should calculate monthly PnL correctly', () => {
      const date = new Date('2025-01-15');
      const monthlyPnl = calculateMonthlyPnL(mockTrades, date);
      
      // 100 + (-100) + 500 = 500
      expect(monthlyPnl).toBe(500);
    });
  });

  describe('calculateCumulativePnL', () => {
    it('should calculate cumulative PnL correctly', () => {
      const cumulativePnl = calculateCumulativePnL(mockTrades);
      
      // 100 + (-100) + 500 = 500
      expect(cumulativePnl).toBe(500);
    });
  });

  describe('calculateGrowthPercentage', () => {
    it('should calculate growth percentage correctly', () => {
      const growth = calculateGrowthPercentage(11000, 10000);
      
      // (11000 - 10000) / 10000 * 100 = 10%
      expect(growth).toBe(10);
    });

    it('should return 0 if initial equity is 0', () => {
      const growth = calculateGrowthPercentage(10000, 0);
      
      expect(growth).toBe(0);
    });
  });

  describe('calculatePortfolioMetrics', () => {
    it('should calculate all portfolio metrics', () => {
      const today = new Date('2025-01-15');
      const metrics = calculatePortfolioMetrics(
        mockTrades,
        11000, // current equity
        10000, // initial equity
        500 // unrealized PnL
      );
      
      expect(metrics.realizedPnl).toBe(500);
      expect(metrics.unrealizedPnl).toBe(500);
      expect(metrics.winRate).toBeCloseTo(66.67, 1);
      expect(metrics.profitFactor).toBe(6.0);
      expect(metrics.dailyPnl).toBe(500);
    });
  });
});

