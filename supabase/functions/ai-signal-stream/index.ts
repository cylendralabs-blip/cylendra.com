/**
 * AI Signal Stream Edge Function
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 * 
 * Continuously runs AI Ultra Analyzer and broadcasts signals via WebSocket
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { requireFeature } from '../_shared/planGuard.ts';
import { getUserFromRequest, getSupabaseClient } from '../_shared/utils.ts';

const logger = createLogger('ai-signal-stream');

// Configuration
const STREAM_INTERVAL_MS = 15000; // 15 seconds
const MAX_SYMBOLS_PER_RUN = 5; // Limit symbols per run to avoid timeout
const SUPPORTED_TIMEFRAMES = ['1m', '3m', '5m', '15m', '1h'];

interface StreamConfig {
  symbols?: string[];
  timeframes?: string[];
  interval?: number;
  userId?: string;
}

/**
 * Get candles from exchange
 */
async function getCandles(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string,
  limit: number = 200
): Promise<any[]> {
  try {
    const { data, error } = await supabaseClient.functions.invoke('get-candles', {
      body: { symbol, timeframe, limit }
    });

    if (error) throw error;
    return data?.candles || [];
  } catch (error) {
    logger.error(`Failed to fetch candles for ${symbol} ${timeframe}:`, error);
    return [];
  }
}

/**
 * Run AI Analyzer for a symbol/timeframe
 */
async function analyzeSymbol(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string,
  timeframe: string,
  userId?: string
): Promise<any | null> {
  try {
    const candles = await getCandles(supabaseClient, symbol, timeframe, 200);
    if (candles.length < 50) {
      logger.warn(`Insufficient candles for ${symbol} ${timeframe}: ${candles.length}`);
      return null;
    }

    // Call AI analyzer via internal function
    const { data, error } = await supabaseClient.functions.invoke('strategy-runner-worker', {
      body: {
        action: 'analyze_ai_signal',
        symbol,
        timeframe,
        candles,
        userId
      }
    });

    if (error) {
      logger.error(`AI analysis failed for ${symbol} ${timeframe}:`, error);
      return null;
    }

    return data?.signal || null;
  } catch (error) {
    logger.error(`Error analyzing ${symbol} ${timeframe}:`, error);
    return null;
  }
}

/**
 * Broadcast signal via Realtime channel
 */
async function broadcastSignal(
  supabaseClient: ReturnType<typeof createClient>,
  signal: any
): Promise<void> {
  try {
    const channel = supabaseClient.channel('ai_signals_stream', {
      config: {
        broadcast: { ack: true }
      }
    });

    await channel.subscribe();

    const { error } = await channel.send({
      type: 'broadcast',
      event: 'ai_signal:live',
      payload: {
        signal,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      logger.error('Broadcast error:', error);
    } else {
      logger.info(`Broadcasted signal: ${signal.symbol} ${signal.timeframe} ${signal.side}`);
    }

    await channel.unsubscribe();
  } catch (error) {
    logger.error('Failed to broadcast signal:', error);
  }
}

/**
 * Save signal to history
 */
async function saveToHistory(
  supabaseClient: ReturnType<typeof createClient>,
  signal: any,
  userId?: string
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('ai_signals_history')
      .insert({
        user_id: userId || null,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        side: signal.side,
        confidence: signal.finalConfidence || signal.confidence || 0,
        ai_score: signal.aiScore || 0,
        technical_score: signal.technicalScore || 0,
        volume_score: signal.volumeScore || 0,
        pattern_score: signal.patternScore || 0,
        wave_score: signal.waveScore || 0,
        sentiment_score: signal.sentimentScore || 0,
        entry_price: signal.entryPrice,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        risk_level: signal.riskLevel || 'MODERATE',
        bias: signal.bias || 'NEUTRAL',
        metadata: {
          sources: signal.sourcesUsed || [],
          reasoning: signal.reasoning || [],
          summary: signal.summary
        }
      });

    if (error) {
      logger.error('Failed to save signal to history:', error);
    }
  } catch (error) {
    logger.error('Error saving signal to history:', error);
  }
}

/**
 * Main stream runner
 */
async function runStream(
  supabaseClient: ReturnType<typeof createClient>,
  config: StreamConfig
): Promise<void> {
  const symbols = config.symbols || ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'];
  const timeframes = config.timeframes || ['1m', '5m', '15m'];
  const userId = config.userId;

  logger.info(`Starting stream for ${symbols.length} symbols, ${timeframes.length} timeframes`);

  for (const symbol of symbols.slice(0, MAX_SYMBOLS_PER_RUN)) {
    for (const timeframe of timeframes) {
      try {
        const signal = await analyzeSymbol(supabaseClient, symbol, timeframe, userId);
        
        if (signal && signal.side !== 'WAIT') {
          // Broadcast via WebSocket
          await broadcastSignal(supabaseClient, signal);
          
          // Save to history
          await saveToHistory(supabaseClient, signal, userId);
          
          // Phase X.8: Broadcast to Telegram for strong signals
          if (signal.finalConfidence >= 70) {
            try {
              const telegramUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-alert`;
              await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  signal: {
                    symbol: signal.symbol,
                    timeframe: signal.timeframe,
                    side: signal.side,
                    finalConfidence: signal.finalConfidence,
                    aiScore: signal.aiScore,
                    technicalScore: signal.technicalScore,
                    volumeScore: signal.volumeScore,
                    sentimentScore: signal.sentimentScore,
                    entryPrice: signal.entryPrice,
                    stopLoss: signal.stopLoss,
                    takeProfit: signal.takeProfit,
                    riskLevel: signal.riskLevel,
                    reasoning: signal.reasoning
                  },
                  isLive: true,
                  minConfidence: 70
                })
              }).catch((err) => {
                logger.warn('Failed to broadcast to Telegram:', err);
              });
            } catch (error) {
              logger.warn('Telegram broadcast error:', error);
            }
          }
        }
      } catch (error) {
        logger.error(`Error processing ${symbol} ${timeframe}:`, error);
      }
    }
  }
}

/**
 * HTTP Handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Phase X.15: Rate Limiting
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);
    
    if (user) {
      const { edgeRateLimiter } = await import('../_shared/rateLimiter.ts');
      const rateLimit = edgeRateLimiter.isAllowed(
        user.id,
        'ai-live-stream',
        1, // 1 request
        1000 // per second
      );

      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            },
          }
        );
      }
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    if (req.method === 'POST') {
      // Phase X.10: Check feature access
      if (userId) {
        try {
          await requireFeature(supabaseClient, userId, 'ai.live_center', 'Real-time AI signals require PREMIUM plan or higher');
        } catch (error) {
          logger.warn(`User ${userId} attempted to access ai.live_center without permission`);
          return new Response(
            JSON.stringify({ 
              error: 'PLAN_LIMIT:FEATURE_NOT_ALLOWED',
              message: 'Real-time AI signals require PREMIUM plan or higher. Please upgrade your subscription.'
            }),
            { 
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      // Start stream
      const body = await req.json().catch(() => ({}));
      const config: StreamConfig = {
        symbols: body.symbols,
        timeframes: body.timeframes || ['1m', '5m', '15m'],
        interval: body.interval || STREAM_INTERVAL_MS,
        userId
      };

      // Run stream asynchronously
      runStream(supabaseClient, config).catch((error) => {
        logger.error('Stream error:', error);
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Stream started',
          config 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // GET - Return stream status/info
    return new Response(
      JSON.stringify({
        status: 'active',
        interval: STREAM_INTERVAL_MS,
        supportedTimeframes: SUPPORTED_TIMEFRAMES,
        channel: 'ai_signals_stream',
        event: 'ai_signal:live'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

