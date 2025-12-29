/**
 * AI Indicator Analytics Edge Function
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 * 
 * Provides aggregated analytics data for AI Ultra Signals indicators
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseClient } from '../_shared/utils.ts';
import { createLogger } from '../_shared/logger.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireFeature } from '../_shared/planGuard.ts';
import { getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('ai-indicator-analytics');

interface AnalyticsFilters {
  symbol?: string;
  timeframe?: string;
  from?: string;
  to?: string;
  limit?: number;
}

interface IndicatorSummary {
  avg_ai_score: number;
  avg_technical_score: number;
  avg_volume_score: number;
  avg_pattern_score: number;
  avg_wave_score: number;
  avg_sentiment_score: number;
  avg_confidence: number;
  count_signals: number;
  count_strong: number;
  count_medium: number;
  count_weak: number;
}

interface SignalRow {
  id: string;
  symbol: string;
  timeframe: string;
  side: string;
  final_confidence: number;
  ai_score: number;
  technical_score: number;
  volume_score: number;
  pattern_score: number;
  wave_score: number;
  sentiment_score: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  profit_loss_percentage: number | null;
  result: string | null;
  created_at: string;
  metadata: any;
}

/**
 * Calculate date range from period string
 */
function getDateRange(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;

  switch (period) {
    case '24h':
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { from: from.toISOString(), to };
}

/**
 * Get indicator summary statistics
 */
async function getIndicatorSummary(
  supabaseClient: ReturnType<typeof createClient>,
  filters: AnalyticsFilters
): Promise<IndicatorSummary> {
  let query = supabaseClient
    .from('ai_signals_history')
    .select('final_confidence, ai_score, technical_score, volume_score, pattern_score, wave_score, sentiment_score');

  if (filters.symbol) {
    query = query.eq('symbol', filters.symbol);
  }

  if (filters.timeframe) {
    query = query.eq('timeframe', filters.timeframe);
  }

  if (filters.from) {
    query = query.gte('created_at', filters.from);
  }

  if (filters.to) {
    query = query.lte('created_at', filters.to);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching signals for summary:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      avg_ai_score: 0,
      avg_technical_score: 0,
      avg_volume_score: 0,
      avg_pattern_score: 0,
      avg_wave_score: 0,
      avg_sentiment_score: 0,
      avg_confidence: 0,
      count_signals: 0,
      count_strong: 0,
      count_medium: 0,
      count_weak: 0
    };
  }

  const count = data.length;
  const sum = data.reduce(
    (acc, row) => ({
      ai: acc.ai + (Number(row.ai_score) || 0),
      technical: acc.technical + (Number(row.technical_score) || 0),
      volume: acc.volume + (Number(row.volume_score) || 0),
      pattern: acc.pattern + (Number(row.pattern_score) || 0),
      wave: acc.wave + (Number(row.wave_score) || 0),
      sentiment: acc.sentiment + (Number(row.sentiment_score) || 0),
      confidence: acc.confidence + (Number(row.final_confidence) || 0)
    }),
    { ai: 0, technical: 0, volume: 0, pattern: 0, wave: 0, sentiment: 0, confidence: 0 }
  );

  const avg_ai_score = count > 0 ? sum.ai / count : 0;
  const avg_technical_score = count > 0 ? sum.technical / count : 0;
  const avg_volume_score = count > 0 ? sum.volume / count : 0;
  const avg_pattern_score = count > 0 ? sum.pattern / count : 0;
  const avg_wave_score = count > 0 ? sum.wave / count : 0;
  const avg_sentiment_score = count > 0 ? sum.sentiment / count : 0;
  const avg_confidence = count > 0 ? sum.confidence / count : 0;

  // Classify signals by strength
  let count_strong = 0;
  let count_medium = 0;
  let count_weak = 0;

  data.forEach((row) => {
    const conf = Number(row.final_confidence) || 0;
    if (conf >= 75) {
      count_strong++;
    } else if (conf >= 60) {
      count_medium++;
    } else {
      count_weak++;
    }
  });

  return {
    avg_ai_score: Math.round(avg_ai_score * 10) / 10,
    avg_technical_score: Math.round(avg_technical_score * 10) / 10,
    avg_volume_score: Math.round(avg_volume_score * 10) / 10,
    avg_pattern_score: Math.round(avg_pattern_score * 10) / 10,
    avg_wave_score: Math.round(avg_wave_score * 10) / 10,
    avg_sentiment_score: Math.round(avg_sentiment_score * 10) / 10,
    avg_confidence: Math.round(avg_confidence * 10) / 10,
    count_signals: count,
    count_strong,
    count_medium,
    count_weak
  };
}

/**
 * Get signals list with indicator details
 */
async function getSignalsList(
  supabaseClient: ReturnType<typeof createClient>,
  filters: AnalyticsFilters
): Promise<SignalRow[]> {
  let query = supabaseClient
    .from('ai_signals_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.symbol) {
    query = query.eq('symbol', filters.symbol);
  }

  if (filters.timeframe) {
    query = query.eq('timeframe', filters.timeframe);
  }

  if (filters.from) {
    query = query.gte('created_at', filters.from);
  }

  if (filters.to) {
    query = query.lte('created_at', filters.to);
  }

  const limit = filters.limit || 50;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching signals list:', error);
    throw error;
  }

  return (data || []) as SignalRow[];
}

/**
 * Helper to add CORS headers to response
 */
function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }));
  }

  try {
    const supabaseClient = getSupabaseClient();

    // Parse request
    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      // Phase X.10: Check feature access
      const user = await getUserFromRequest(req, supabaseClient);
      if (user) {
        try {
          await requireFeature(supabaseClient, user.id, 'ai.advanced_indicators', 'Advanced indicator analytics require BASIC plan or higher');
        } catch (error) {
          logger.warn(`User ${user.id} attempted to access ai.advanced_indicators without permission`);
          return withCors(
            new Response(
              JSON.stringify({ 
                success: false,
                error: 'PLAN_LIMIT:FEATURE_NOT_ALLOWED',
                message: 'Advanced indicator analytics require BASIC plan or higher. Please upgrade your subscription.'
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          );
        }
      }

      // Parse query parameters
      const symbol = url.searchParams.get('symbol') || undefined;
      const timeframe = url.searchParams.get('timeframe') || undefined;
      const period = url.searchParams.get('period') || '7d';
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);

      const dateRange = getDateRange(period);
      const filters: AnalyticsFilters = {
        symbol,
        timeframe,
        from: dateRange.from,
        to: dateRange.to,
        limit
      };

      // Fetch summary and signals in parallel
      const [summary, signals] = await Promise.all([
        getIndicatorSummary(supabaseClient, filters),
        getSignalsList(supabaseClient, filters)
      ]);

      return withCors(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              summary,
              signals
            }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );
    }

    return withCors(
      new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
  } catch (error) {
    logger.error('Error in ai-indicator-analytics:', error);

    return withCors(
      new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
  }
});

