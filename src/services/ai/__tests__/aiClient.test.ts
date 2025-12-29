/**
 * AI Client Tests
 * 
 * Tests for AI Client service
 * 
 * Phase 11: AI Assistant Integration - Task 12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIClient, createAIClient } from '../aiClient';
import type { AIRequest, AIMode } from '../types';

// Mock fetch
global.fetch = vi.fn();

describe('AIClient', () => {
  let client: AIClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createAIClient();
  });

  describe('createAIClient', () => {
    it('should create client with default config', () => {
      const client = createAIClient();
      expect(client).toBeInstanceOf(AIClient);
    });

    it('should create client with custom config', () => {
      const client = createAIClient({
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 2000,
      });
      expect(client).toBeInstanceOf(AIClient);
    });
  });

  describe('askAI - Mock Mode', () => {
    it('should return mock response when API key is not configured', async () => {
      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const response = await client.askAI(request);
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('confidence');
      expect(response.content).toBeTruthy();
    });

    it('should return fallback response on error', async () => {
      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'risk_advisor',
        },
        mode: 'risk_advisor',
        userId: 'test-user',
      };

      // Mock fetch to throw error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const response = await client.askAI(request);
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('warnings');
      expect(response.warnings).toContain('AI service temporarily unavailable');
    });
  });

  describe('askAI - OpenAI Integration', () => {
    beforeEach(() => {
      // Set mock API key
      process.env.VITE_OPENAI_API_KEY = 'test-api-key';
    });

    it('should call OpenAI API when key is configured', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test AI response',
          },
        }],
        model: 'gpt-4o-mini',
        usage: { total_tokens: 100 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const client = createAIClient({
        apiKey: 'test-api-key',
      });

      const response = await client.askAI(request);
      
      expect(global.fetch).toHaveBeenCalled();
      expect(response.content).toBe('Test AI response');
      expect(response.metadata).toHaveProperty('model');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const client = createAIClient({
        apiKey: 'invalid-key',
      });

      const response = await client.askAI(request);
      
      expect(response).toHaveProperty('warnings');
      expect(response.warnings?.[0]).toContain('AI service error');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        });
      });

      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const client = createAIClient({
        apiKey: 'test-key',
        timeout: 50,
      });

      const response = await client.askAI(request);
      
      expect(response).toHaveProperty('warnings');
    });
  });

  describe('streamAI', () => {
    it('should stream mock response when API key is not configured', async () => {
      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const chunks: string[] = [];
      for await (const chunk of client.streamAI(request)) {
        if (chunk.chunk) {
          chunks.push(chunk.chunk);
        }
        if (chunk.done) break;
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle streaming errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const request: AIRequest = {
        prompt: 'Test question',
        context: {
          userId: 'test-user',
          mode: 'user_support',
        },
        mode: 'user_support',
        userId: 'test-user',
      };

      const chunks: any[] = [];
      for await (const chunk of client.streamAI(request)) {
        chunks.push(chunk);
        if (chunk.done) break;
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1]).toHaveProperty('done', true);
    });
  });

  describe('Fallback Responses', () => {
    it('should return appropriate fallback for each mode', async () => {
      const modes: AIMode[] = [
        'trade_explainer',
        'risk_advisor',
        'settings_optimizer',
        'backtest_summarizer',
        'user_support',
      ];

      for (const mode of modes) {
        const request: AIRequest = {
          prompt: 'Test',
          context: {
            userId: 'test-user',
            mode,
          },
          mode,
          userId: 'test-user',
        };

        // Force error
        (global.fetch as any).mockRejectedValueOnce(new Error('Test error'));

        const response = await client.askAI(request);
        
        expect(response.content).toBeTruthy();
        expect(response.content).not.toContain('undefined');
      }
    });
  });
});

