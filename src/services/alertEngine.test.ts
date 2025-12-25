/**
 * Alert Engine Tests
 * 
 * Unit tests for Alert Engine
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendTelegramAlert,
  createInAppAlert,
  markAlertAsRead,
  acknowledgeAlert,
  getUnreadAlerts,
  evaluateAndSendAlerts
} from './alertEngine';
import { AlertSeverity } from '@/services/portfolio/portfolioAlerts';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => Promise.resolve({ data: [{ id: 'alert-123' }], error: null })),
    update: vi.fn(() => Promise.resolve({ error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Alert Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendTelegramAlert', () => {
    it('should send Telegram alert successfully', async () => {
      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        })
      ) as any;
      
      // Mock env
      import.meta.env.VITE_TELEGRAM_BOT_TOKEN = 'test-token';
      
      const result = await sendTelegramAlert('chat-123', 'Test Alert', 'Test message', 'high');
      
      expect(result).toBe(true);
    });

    it('should return false if bot token not configured', async () => {
      delete (import.meta.env as any).VITE_TELEGRAM_BOT_TOKEN;
      
      const result = await sendTelegramAlert('chat-123', 'Test Alert', 'Test message', 'high');
      
      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve('API Error')
        })
      ) as any;
      
      import.meta.env.VITE_TELEGRAM_BOT_TOKEN = 'test-token';
      
      const result = await sendTelegramAlert('chat-123', 'Test Alert', 'Test message', 'high');
      
      expect(result).toBe(false);
    });
  });

  describe('createInAppAlert', () => {
    it('should create in-app alert successfully', async () => {
      const alertId = await createInAppAlert(
        'user-123',
        'high',
        'error',
        'Test Alert',
        'Test message',
        { tradeId: 'trade-123' }
      );
      
      expect(alertId).toBe('alert-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('alerts');
    });

    it('should return null on error', async () => {
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } })),
        update: vi.fn(() => Promise.resolve({ error: null })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }));
      
      const alertId = await createInAppAlert(
        'user-123',
        'high',
        'error',
        'Test Alert',
        'Test message'
      );
      
      expect(alertId).toBeNull();
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark alert as read', async () => {
      const result = await markAlertAsRead('alert-123', 'user-123');
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('alerts');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const result = await acknowledgeAlert('alert-123', 'user-123');
      
      expect(result).toBe(true);
    });
  });

  describe('getUnreadAlerts', () => {
    it('should fetch unread alerts', async () => {
      const alerts = await getUnreadAlerts('user-123', 50);
      
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('evaluateAndSendAlerts', () => {
    it('should evaluate rules and send alerts', async () => {
      // Mock alert rules
      (mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'alert_rules') {
          return {
            insert: vi.fn(() => Promise.resolve({ data: [{ id: 'alert-123' }], error: null })),
            update: vi.fn(() => Promise.resolve({ error: null })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => Promise.resolve({
                    data: [{
                      id: 'rule-123',
                      channel: 'in_app',
                      conditions: {}
                    }],
                    error: null
                  }))
                }))
              }))
            }))
          };
        }
        return {
          insert: vi.fn(() => Promise.resolve({ data: [{ id: 'alert-123' }], error: null })),
          update: vi.fn(() => Promise.resolve({ error: null })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              }))
            }))
          }))
        };
      });
      
      await evaluateAndSendAlerts(
        'user-123',
        'error',
        'high',
        'Test Alert',
        'Test message',
        { tradeId: 'trade-123' }
      );
      
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});

