/**
 * AI Client Service
 * 
 * Unified wrapper for LLM providers (OpenAI, Anthropic, etc.)
 * Handles streaming, retries, timeouts, and safe fallbacks
 * 
 * Phase 11: AI Assistant Integration - Task 1
 */

import { AIRequest, AIResponse, AIClientConfig, AIStreamResponse, AIMode } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Default AI Client Configuration
 */
const DEFAULT_CONFIG: AIClientConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini', // Using mini for cost efficiency
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 30000, // 30 seconds
  enableStreaming: true,
};

/**
 * AI Client Class
 */
export class AIClient {
  private config: AIClientConfig;

  constructor(config?: Partial<AIClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Ask AI a question
   */
  async askAI(request: AIRequest): Promise<AIResponse> {
    const { prompt, context, mode, userId, stream = false } = request;

    try {
      // Try Supabase Edge Function first (if available)
      if (this.config.provider === 'openai' && typeof window !== 'undefined') {
        try {
          // Use static import (already imported at top of file)
          const { data, error } = await supabase.functions.invoke('ai-assistant', {
            body: {
              prompt,
              mode,
              context: {
                signalId: context.signal?.id,
                tradeId: context.position?.id,
                backtestId: context.backtestResult ? 'backtest-id' : undefined,
              },
              stream: false,
            },
          });

          if (!error && data) {
            return data as AIResponse;
          }
        } catch (edgeFunctionError) {
          console.warn('Edge Function not available, falling back to direct API:', edgeFunctionError);
        }
      }

      // Build full prompt with context
      const fullPrompt = this.buildPrompt(prompt, context, mode);

      // Call appropriate provider
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(fullPrompt, stream);
        case 'anthropic':
          return await this.callAnthropic(fullPrompt);
        case 'local':
          return await this.callLocal(fullPrompt);
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error: any) {
      console.error('AI Client Error:', error);
      
      // Return safe fallback response
      return {
        content: this.getFallbackResponse(mode, error.message),
        suggestions: [],
        warnings: ['AI service temporarily unavailable. Showing fallback response.'],
        confidence: 0.5,
      };
    }
  }

  /**
   * Stream AI response
   */
  async *streamAI(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    const { prompt, context, mode } = request;

    try {
      const fullPrompt = this.buildPrompt(prompt, context, mode);

      switch (this.config.provider) {
        case 'openai':
          yield* this.streamOpenAI(fullPrompt);
          break;
        case 'anthropic':
          yield* this.streamAnthropic(fullPrompt);
          break;
        default:
          yield {
            chunk: this.getFallbackResponse(mode, 'Streaming not available'),
            done: true,
          };
      }
    } catch (error: any) {
      yield {
        chunk: this.getFallbackResponse(mode, error.message),
        done: true,
        error: error.message,
      };
    }
  }

  /**
   * Build full prompt with context and safety instructions
   */
  private buildPrompt(prompt: string, context: any, mode: AIMode): string {
    const safetyInstructions = `
IMPORTANT SAFETY RULES:
- You are an ADVISOR only, NOT a trading decision maker
- NEVER suggest executing trades automatically
- NEVER suggest risky leverage or excessive risk
- ALWAYS require user confirmation for any setting changes
- Base all advice on the provided data only
- If data is insufficient, say so clearly
`;

    const contextSummary = this.summarizeContext(context);

    return `${safetyInstructions}

CONTEXT:
${contextSummary}

USER QUESTION:
${prompt}

Please provide a helpful, safe, and accurate response based on the context above.
`;
  }

  /**
   * Summarize context for AI prompt
   */
  private summarizeContext(context: any): string {
    const parts: string[] = [];

    if (context.botSettings) {
      parts.push(`Bot Settings: Risk ${context.botSettings.risk_percentage ?? 'N/A'}%, Leverage ${context.botSettings.leverage ?? 'N/A'}x`);
    }

    if (context.signal) {
      parts.push(`Signal: ${context.signal.symbol} ${context.signal.side.toUpperCase()}, Reason: ${context.signal.reason || 'N/A'}`);
    }

    if (context.position) {
      const entry = typeof context.position.entryPrice === 'number' ? context.position.entryPrice : 0;
      const current = typeof context.position.currentPrice === 'number' ? context.position.currentPrice : entry;
      const pnl = typeof context.position.unrealizedPnl === 'number' ? context.position.unrealizedPnl : 0;
      parts.push(`Position: ${context.position.symbol}, PnL: $${pnl.toFixed(2)}, Entry $${entry.toFixed(4)}, Current $${current.toFixed(4)}`);
    }

    if (context.portfolio) {
      parts.push(`Portfolio: Equity $${(context.portfolio.totalEquity ?? 0).toFixed(2)}, Exposure ${(context.portfolio.exposurePercentage ?? 0).toFixed(1)}%, Daily PnL $${(context.portfolio.dailyPnl ?? 0).toFixed(2)}`);
    }

    if (context.riskMetrics) {
      parts.push(`Risk: Daily Loss $${(context.riskMetrics.dailyLoss ?? 0).toFixed(2)}/${(context.riskMetrics.dailyLossLimit ?? 0).toFixed(2)}, Drawdown Limit ${context.riskMetrics.maxDrawdown}%`);
    }

    if (context.marketConditions) {
      parts.push(`Market: ${context.marketConditions.symbol} price $${context.marketConditions.currentPrice} (${context.marketConditions.change24h}% 24h) Volume ${context.marketConditions.volume24h}`);
    }

    if (context.recentTrades?.length) {
      const tradesSummary = context.recentTrades.slice(0, 3).map(trade =>
        `- ${trade.symbol} ${trade.side.toUpperCase()} PnL $${(trade.pnl ?? 0).toFixed(2)}`
      ).join('\n');
      parts.push(`Recent Trades:\n${tradesSummary}`);
    }

    if (context.strategyLogs?.length) {
      const logsSummary = context.strategyLogs.slice(0, 5).map(log =>
        `- [${log.category}] ${log.action}: ${log.message}`
      ).join('\n');
      parts.push(`Strategy Logs:\n${logsSummary}`);
    }

    if (context.recentAlerts?.length) {
      const alertsSummary = context.recentAlerts.slice(0, 3).map(alert =>
        `- [${alert.level}] ${alert.message}`
      ).join('\n');
      parts.push(`Recent Alerts:\n${alertsSummary}`);
    }

    if (context.backtestResult) {
      parts.push(`Backtest: Return ${context.backtestResult.totalReturn.toFixed(2)}%, Win Rate ${context.backtestResult.winRate.toFixed(1)}%, Max DD ${context.backtestResult.maxDrawdown}%`);
    }

    return parts.join('\n') || 'No context provided';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, stream: boolean): Promise<AIResponse> {
    // Check if OpenAI is configured
    const apiKey = this.config.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.trim() === '') {
      // Return mock response for development
      console.warn('OpenAI API key not configured. Using mock response.');
      return {
        content: this.getMockResponse(prompt),
        suggestions: [],
        warnings: ['OpenAI API key not configured. Showing mock response.'],
        confidence: 0.5,
      };
    }

    // Don't support streaming in non-streaming mode
    if (stream) {
      throw new Error('Use streamAI() method for streaming responses');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI trading assistant. You provide safe, accurate advice based on data. You are an advisor only, not a decision maker.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens || 1000,
          temperature: this.config.temperature || 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No response from AI';

      return {
        content,
        suggestions: [],
        confidence: 0.8,
        metadata: {
          model: data.model,
          usage: data.usage,
        },
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      // Handle timeout
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }

      // Handle API errors
      if (error.message?.includes('API error')) {
        throw error;
      }

      // Fallback to mock response
      return {
        content: this.getMockResponse(prompt),
        suggestions: [],
        warnings: [`AI service error: ${error.message}. Showing fallback response.`],
        confidence: 0.5,
      };
    }
  }

  /**
   * Stream OpenAI response
   */
  private async *streamOpenAI(prompt: string): AsyncGenerator<AIStreamResponse, void, unknown> {
    const apiKey = this.config.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.trim() === '') {
      // Fallback to mock streaming
      console.warn('OpenAI API key not configured. Using mock streaming.');
      const mockResponse = this.getMockResponse(prompt);
      const words = mockResponse.split(' ');
      
      for (const word of words) {
        yield {
          chunk: word + ' ',
          done: false,
        };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      yield {
        chunk: '',
        done: true,
      };
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI trading assistant. You provide safe, accurate advice based on data. You are an advisor only, not a decision maker.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens || 1000,
          temperature: this.config.temperature || 0.7,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            yield { chunk: '', done: true };
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                yield { chunk: '', done: true };
                return;
              }

              try {
                const json = JSON.parse(data);
                const content = json.choices[0]?.delta?.content || '';
                if (content) {
                  yield {
                    chunk: content,
                    done: false,
                  };
                }
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      console.error('OpenAI Streaming Error:', error);
      
      // Handle timeout
      if (error.name === 'AbortError') {
        yield {
          chunk: '\n\n[Request timeout. Please try again.]',
          done: true,
          error: 'Request timeout',
        };
        return;
      }

      // Fallback to mock streaming
      const mockResponse = this.getMockResponse(prompt);
      const words = mockResponse.split(' ');
      
      for (const word of words) {
        yield {
          chunk: word + ' ',
          done: false,
        };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      yield {
        chunk: '',
        done: true,
        error: error.message,
      };
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<AIResponse> {
    const apiKey = this.config.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey === 'your-anthropic-api-key' || apiKey.trim() === '') {
      console.warn('Anthropic API key not configured. Using mock response.');
      return {
        content: this.getMockResponse(prompt),
        suggestions: [],
        warnings: ['Anthropic API key not configured. Showing mock response.'],
        confidence: 0.5,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-haiku-20240307',
          max_tokens: this.config.maxTokens || 1000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text || 'No response from AI';

      return {
        content,
        suggestions: [],
        confidence: 0.8,
        metadata: {
          model: data.model,
          usage: data.usage,
        },
      };
    } catch (error: any) {
      console.error('Anthropic API Error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }

      return {
        content: this.getMockResponse(prompt),
        suggestions: [],
        warnings: [`AI service error: ${error.message}. Showing fallback response.`],
        confidence: 0.5,
      };
    }
  }

  /**
   * Stream Anthropic response
   */
  private async *streamAnthropic(prompt: string): AsyncGenerator<AIStreamResponse, void, unknown> {
    const apiKey = this.config.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey === 'your-anthropic-api-key' || apiKey.trim() === '') {
      console.warn('Anthropic API key not configured. Using mock streaming.');
      const mockResponse = this.getMockResponse(prompt);
      yield { chunk: mockResponse, done: true };
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-haiku-20240307',
          max_tokens: this.config.maxTokens || 1000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            yield { chunk: '', done: true };
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                yield { chunk: '', done: true };
                return;
              }

              try {
                const json = JSON.parse(data);
                if (json.type === 'content_block_delta') {
                  const content = json.delta?.text || '';
                  if (content) {
                    yield {
                      chunk: content,
                      done: false,
                    };
                  }
                } else if (json.type === 'message_stop') {
                  yield { chunk: '', done: true };
                  return;
                }
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      console.error('Anthropic Streaming Error:', error);
      
      if (error.name === 'AbortError') {
        yield {
          chunk: '\n\n[Request timeout. Please try again.]',
          done: true,
          error: 'Request timeout',
        };
        return;
      }

      const mockResponse = this.getMockResponse(prompt);
      yield { chunk: mockResponse, done: true, error: error.message };
    }
  }

  /**
   * Call local model (for development/testing)
   */
  private async callLocal(prompt: string): Promise<AIResponse> {
    // For local/development, return mock response
    return {
      content: this.getMockResponse(prompt),
      suggestions: [],
      confidence: 0.8,
    };
  }

  /**
   * Get mock response for development
   */
  private getMockResponse(prompt: string): string {
    // Simple mock responses for development
    if (prompt.toLowerCase().includes('why') || prompt.toLowerCase().includes('سبب')) {
      return 'This trade was executed based on technical analysis indicators showing a favorable entry point. The risk management system approved it within your configured risk limits.';
    }
    
    if (prompt.toLowerCase().includes('risk') || prompt.toLowerCase().includes('مخاطر')) {
      return 'Your current portfolio exposure is within acceptable limits. Consider monitoring daily loss closely as you approach your limit.';
    }
    
    return 'I am your AI trading assistant. I can help explain trades, assess risks, suggest settings improvements, and answer questions about your bot.';
  }

  /**
   * Get fallback response when AI fails
   */
  private getFallbackResponse(mode: AIMode, error?: string): string {
    const fallbacks: Record<AIMode, string> = {
      trade_explainer: 'Unable to explain this trade at the moment. Please check the signal logs and indicators manually.',
      risk_advisor: 'Risk assessment is temporarily unavailable. Please check your risk metrics in the dashboard.',
      settings_optimizer: 'Settings suggestions are temporarily unavailable. Please review your settings manually.',
      backtest_summarizer: 'Unable to summarize backtest results at the moment. Please review the detailed report.',
      user_support: 'I apologize, but I cannot process your request right now. Please try again later or check the documentation.',
    };

    return fallbacks[mode] || 'AI service is temporarily unavailable. Please try again later.';
  }
}

/**
 * Create AI Client instance
 */
export function createAIClient(config?: Partial<AIClientConfig>): AIClient {
  return new AIClient(config);
}

/**
 * Default AI Client instance
 */
export const aiClient = createAIClient();

