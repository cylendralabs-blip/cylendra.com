/**
 * AI Assistant Edge Function
 * 
 * Handles AI requests from the frontend
 * Builds context, calls AI service, and logs interactions
 * 
 * Phase 11: AI Assistant Integration - Task 4
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface AIRequest {
  prompt: string;
  mode: 'trade_explainer' | 'risk_advisor' | 'settings_optimizer' | 'backtest_summarizer' | 'user_support';
  context?: {
    signalId?: string;
    tradeId?: string;
    backtestId?: string;
    [key: string]: any;
  };
  stream?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: AIRequest = await req.json();
    const { prompt, mode, context = {}, stream = false } = requestData;

    if (!prompt || !mode) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from database
    const aiContext = await buildContext(supabaseClient, user.id, mode, context);

    // Get AI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      // Return mock response for development
      const mockResponse = getMockResponse(mode, prompt);
      
      // Log interaction
      await logInteraction(supabaseClient, user.id, mode, prompt, mockResponse, aiContext);

      return new Response(
        JSON.stringify({
          content: mockResponse,
          suggestions: [],
          warnings: ['AI service not configured. Showing mock response.'],
          confidence: 0.5,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle streaming
    if (stream) {
      return handleStreamingResponse(openaiApiKey, prompt, aiContext, mode, supabaseClient, user.id);
    }

    // Call OpenAI API
    const aiResponse = await callOpenAI(openaiApiKey, prompt, aiContext, mode, false);

    // Log interaction
    await logInteraction(supabaseClient, user.id, mode, prompt, aiResponse.content, aiContext);

    // Return response
    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Build AI context from database
 */
async function buildContext(
  supabase: any,
  userId: string,
  mode: string,
  options: any
): Promise<Record<string, any>> {
  const context: Record<string, any> = {
    userId,
    mode,
  };

  try {
    // Fetch bot settings
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('risk_percentage, leverage, max_active_trades, dca_levels, take_profit_percentage, stop_loss_percentage, max_daily_loss_pct, max_drawdown_pct')
      .eq('user_id', userId)
      .single();

    if (settings) {
      context.botSettings = settings;
    }

    // Mode-specific context
    if (mode === 'trade_explainer' && (options.signalId || options.tradeId)) {
      // Fetch signal
      if (options.signalId) {
        const { data: signal } = await supabase
          .from('trading_signals')
          .select('id, symbol, side, meta')
          .eq('id', options.signalId)
          .eq('user_id', userId)
          .single();

        if (signal) {
          context.signal = {
            id: signal.id,
            symbol: signal.symbol,
            side: signal.side,
            reason: signal.meta?.reason,
            indicators: signal.meta?.indicators,
          };
        }
      }

      // Fetch position
      if (options.tradeId) {
        const { data: trade } = await supabase
          .from('trades')
          .select('id, symbol, side, entry_price, current_price, unrealized_pnl, dca_levels_completed')
          .eq('id', options.tradeId)
          .eq('user_id', userId)
          .single();

        if (trade) {
          context.position = {
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            entryPrice: parseFloat(trade.entry_price || '0'),
            currentPrice: parseFloat(trade.current_price || trade.entry_price || '0'),
            unrealizedPnl: parseFloat(trade.unrealized_pnl || '0'),
            dcaLevels: trade.dca_levels_completed || 0,
          };
        }
      }

      // Fetch strategy logs timeline
      const { data: strategyLogs } = await supabase
        .from('logs' as any)
        .select('id, category, action, message, context, created_at, signal_id, trade_id')
        .eq('user_id', userId)
        .in('category', ['signal', 'decision', 'strategy', 'order'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (strategyLogs) {
        context.strategyLogs = strategyLogs
          .filter((log: any) => {
            if (options.signalId) return log.signal_id === options.signalId;
            if (options.tradeId) return log.trade_id === options.tradeId;
            return true;
          })
          .map((log: any) => ({
            id: log.id,
            category: log.category,
            action: log.action,
            message: log.message,
            context: log.context,
            created_at: log.created_at,
          }));
      }
    }

    if (mode === 'risk_advisor' || mode === 'settings_optimizer') {
      // Fetch portfolio
      const { data: portfolio } = await supabase
        .from('users_portfolio_state')
        .select('total_equity, unrealized_pnl')
        .eq('user_id', userId)
        .order('last_sync_at', { ascending: false })
        .limit(1)
        .single();

      if (portfolio) {
        // Calculate exposure
        const { data: activeTrades } = await supabase
          .from('trades')
          .select('total_invested')
          .eq('user_id', userId)
          .in('status', ['ACTIVE', 'PENDING']);

        const totalExposure = activeTrades?.reduce(
          (sum, t) => sum + parseFloat(t.total_invested || '0'),
          0
        ) || 0;

        const totalEquity = parseFloat(portfolio.total_equity || '0');
        const exposurePercentage = totalEquity > 0 ? (totalExposure / totalEquity) * 100 : 0;

        context.portfolio = {
          totalEquity,
          totalExposure,
          exposurePercentage,
          unrealizedPnl: parseFloat(portfolio.unrealized_pnl || '0'),
        };
      }

      // Fetch risk metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: dailyTrades } = await supabase
        .from('trades')
        .select('realized_pnl')
        .eq('user_id', userId)
        .eq('status', 'CLOSED')
        .gte('closed_at', today.toISOString());

      const dailyLoss = Math.abs(
        dailyTrades?.reduce((sum, t) => {
          const pnl = parseFloat(t.realized_pnl || '0');
          return sum + (pnl < 0 ? pnl : 0);
        }, 0) || 0
      );

      context.riskMetrics = {
        dailyLoss,
        dailyLossLimit: settings?.max_daily_loss_usd || 1000,
        maxDrawdown: settings?.max_drawdown_pct || 20,
        currentDrawdown: 0, // TODO: Calculate from performance
        exposurePercentage: context.portfolio?.exposurePercentage || 0,
      };
    }

    if (mode === 'backtest_summarizer' && options.backtestId) {
      // Fetch backtest result
      const { data: backtest } = await supabase
        .from('backtest_results')
        .select('*')
        .eq('id', options.backtestId)
        .eq('user_id', userId)
        .single();

      if (backtest) {
        context.backtestResult = {
          totalReturn: parseFloat(backtest.total_return || '0'),
          winRate: parseFloat(backtest.win_rate || '0'),
          profitFactor: parseFloat(backtest.profit_factor || '0'),
          maxDrawdown: parseFloat(backtest.max_drawdown || '0'),
          sharpeRatio: parseFloat(backtest.sharpe_ratio || '0'),
          totalTrades: backtest.total_trades || 0,
        };
      }
    }

    if (mode === 'risk_advisor') {
      const { data: alerts } = await supabase
        .from('alerts')
        .select('level, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (alerts) {
        context.recentAlerts = alerts.map((alert: any) => ({
          level: alert.level,
          message: alert.title,
          timestamp: alert.created_at,
        }));
      }
    }

  } catch (error) {
    console.error('Error building context:', error);
  }

  return context;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  prompt: string,
  context: Record<string, any>,
  mode: string,
  stream: boolean
): Promise<{ content: string; suggestions?: any[]; warnings?: string[]; confidence?: number }> {
  // Build full prompt with context
  const contextSummary = JSON.stringify(context, null, 2);
  const fullPrompt = `
You are an AI trading assistant. You are an ADVISOR only, NOT a trading decision maker.

CONTEXT:
${contextSummary}

USER QUESTION:
${prompt}

Please provide a helpful, safe, and accurate response based on the context above.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI trading assistant. You provide safe, accurate advice based on data. You are an advisor only, not a decision maker.',
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response';

    return {
      content,
      suggestions: [],
      confidence: 0.8,
    };

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * Log AI interaction
 */
async function logInteraction(
  supabase: any,
  userId: string,
  mode: string,
  input: string,
  output: string,
  context: Record<string, any>
): Promise<void> {
  try {
    // Sanitize context (remove sensitive data)
    const sanitizedContext: Record<string, any> = {};
    if (context.botSettings) {
      sanitizedContext.botSettings = {
        risk_percentage: context.botSettings.risk_percentage,
        leverage: context.botSettings.leverage,
      };
    }
    if (context.portfolio) {
      sanitizedContext.portfolio = {
        exposurePercentage: context.portfolio.exposurePercentage,
      };
    }

    await supabase
      .from('ai_interactions')
      .insert({
        user_id: userId,
        mode,
        input,
        output,
        context_summary: sanitizedContext,
        metadata: {},
      });

  } catch (error) {
    console.error('Error logging interaction:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Handle streaming response
 */
async function handleStreamingResponse(
  apiKey: string,
  prompt: string,
  context: Record<string, any>,
  mode: string,
  supabase: any,
  userId: string
): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const fullPrompt = buildFullPrompt(prompt, context, mode);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI trading assistant. You provide safe, accurate advice based on data. You are an advisor only, not a decision maker.',
              },
              {
                role: 'user',
                content: fullPrompt,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Log interaction after streaming completes
              await logInteraction(supabase, userId, mode, prompt, fullContent, context);
              controller.close();
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
                  await logInteraction(supabase, userId, mode, prompt, fullContent, context);
                  controller.close();
                  return;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content, done: false })}\n\n`));
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
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: '', done: true, error: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Build full prompt with context
 */
function buildFullPrompt(prompt: string, context: Record<string, any>, mode: string): string {
  const contextSummary = JSON.stringify(context, null, 2);
  return `
You are an AI trading assistant. You are an ADVISOR only, NOT a trading decision maker.

CONTEXT:
${contextSummary}

USER QUESTION:
${prompt}

Please provide a helpful, safe, and accurate response based on the context above.
`;
}

/**
 * Get mock response for development
 */
function getMockResponse(mode: string, prompt: string): string {
  const mockResponses: Record<string, string> = {
    trade_explainer: 'This trade was executed based on technical analysis indicators showing a favorable entry point. The risk management system approved it within your configured risk limits.',
    risk_advisor: 'Your current portfolio exposure is within acceptable limits. Consider monitoring daily loss closely as you approach your limit.',
    settings_optimizer: 'Based on your performance, I suggest reducing risk percentage slightly and increasing DCA levels for better risk distribution.',
    backtest_summarizer: 'The backtest shows moderate performance with a positive return. Consider adjusting risk settings for better risk-adjusted returns.',
    user_support: 'I am your AI trading assistant. I can help explain trades, assess risks, suggest settings improvements, and answer questions about your bot.',
  };

  return mockResponses[mode] || 'I am your AI trading assistant. How can I help you?';
}

