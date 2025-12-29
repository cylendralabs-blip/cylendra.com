/**
 * Prompts System Tests
 * 
 * Unit tests for AI prompts
 * 
 * Phase 11: AI Assistant Integration - Task 12
 */

import { describe, it, expect } from 'vitest';
import {
  buildTradeExplainerPrompt,
  buildRiskAdvisorPrompt,
  buildSettingsOptimizerPrompt,
  buildBacktestSummarizerPrompt,
  buildUserSupportPrompt,
} from '../prompts';

describe('AI Prompts', () => {
  describe('Trade Explainer Prompt', () => {
    it('should build prompt with user question', () => {
      const prompt = buildTradeExplainerPrompt('Why was this trade executed?', {
        signal: {
          id: 'test-id',
          symbol: 'BTCUSDT',
          side: 'buy' as const,
          reason: 'Strong bullish signal',
        },
      });

      expect(prompt).toContain('Why was this trade executed?');
      expect(prompt).toContain('ADVISOR only');
    });

    it('should include signal context', () => {
      const prompt = buildTradeExplainerPrompt('Explain this trade', {
        signal: {
          id: 'test-id',
          symbol: 'BTCUSDT',
          side: 'buy' as const,
        },
      });

      expect(prompt).toContain('Explain this trade');
    });
  });

  describe('Risk Advisor Prompt', () => {
    it('should build prompt with portfolio data', () => {
      const prompt = buildRiskAdvisorPrompt('What is my risk level?', {
        portfolio: {
          totalEquity: 10000,
          totalExposure: 5000,
          exposurePercentage: 50,
          dailyPnl: 100,
          unrealizedPnl: 200,
        },
        riskMetrics: {
          dailyLoss: 50,
          dailyLossLimit: 1000,
          maxDrawdown: 20,
          currentDrawdown: 5,
          exposurePercentage: 50,
        },
        botSettings: {
          risk_percentage: 2,
          leverage: 2,
          max_active_trades: 5,
        },
      });

      expect(prompt).toContain('$10,000.00');
      expect(prompt).toContain('50%');
      expect(prompt).toContain('2%');
    });
  });

  describe('Settings Optimizer Prompt', () => {
    it('should build prompt with performance data', () => {
      const prompt = buildSettingsOptimizerPrompt('Suggest improvements', {
        botSettings: {
          risk_percentage: 2,
          leverage: 2,
          take_profit_percentage: 3,
          stop_loss_percentage: 2,
        },
        backtestResult: {
          totalReturn: 10,
          winRate: 60,
          profitFactor: 1.5,
          maxDrawdown: 15,
          sharpeRatio: 1.2,
          totalTrades: 100,
        },
      });

      expect(prompt).toContain('2%');
      expect(prompt).toContain('10.00%');
      expect(prompt).toContain('60.0%');
      expect(prompt).toContain('SAFE');
    });
  });

  describe('Backtest Summarizer Prompt', () => {
    it('should build prompt with backtest results', () => {
      const prompt = buildBacktestSummarizerPrompt('Summarize results', {
        backtestResult: {
          totalReturn: 15,
          winRate: 65,
          profitFactor: 1.8,
          sharpeRatio: 1.5,
          maxDrawdown: 12,
          totalTrades: 150,
        },
      });

      expect(prompt).toContain('15.00%');
      expect(prompt).toContain('65.0%');
      expect(prompt).toContain('1.80');
    });
  });

  describe('User Support Prompt', () => {
    it('should build prompt with user question', () => {
      const prompt = buildUserSupportPrompt('How do I set up DCA?', {});

      expect(prompt).toContain('How do I set up DCA?');
      expect(prompt).toContain('helpful AI assistant');
    });
  });
});

