/**
 * Context Builder Tests
 * 
 * Unit tests for AI context builder
 * 
 * Phase 11: AI Assistant Integration - Task 12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAIContext } from '../contextBuilder';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('Context Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildAIContext', () => {
    it('should build basic context with userId and mode', async () => {
      const context = await buildAIContext('user-123', 'user_support');

      expect(context.userId).toBe('user-123');
      expect(context.mode).toBe('user_support');
    });

    it('should include bot settings when available', async () => {
      // Mock bot settings response
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              risk_percentage: 2,
              leverage: 2,
              max_active_trades: 5,
            },
            error: null,
          })),
        })),
      }));

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const context = await buildAIContext('user-123', 'user_support');

      expect(context.botSettings).toBeDefined();
    });

    it('should build trade explainer context with signal', async () => {
      const context = await buildAIContext('user-123', 'trade_explainer', {
        signalId: 'signal-123',
      });

      expect(context.mode).toBe('trade_explainer');
      // Signal fetching would be tested with proper mocks
    });

    it('should build risk advisor context', async () => {
      const context = await buildAIContext('user-123', 'risk_advisor');

      expect(context.mode).toBe('risk_advisor');
      // Portfolio and risk metrics would be tested with proper mocks
    });

    it('should build backtest summarizer context', async () => {
      const context = await buildAIContext('user-123', 'backtest_summarizer', {
        backtestId: 'backtest-123',
      });

      expect(context.mode).toBe('backtest_summarizer');
    });
  });
});

