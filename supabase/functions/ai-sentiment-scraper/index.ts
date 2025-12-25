/**
 * AI Sentiment Scraper Edge Function
 * 
 * Phase X.9 - AI Market Intelligence Layer
 * 
 * Fetches market sentiment from various sources:
 * - Fear & Greed Index
 * - Funding bias (aggregate from funding rates)
 * - Optional: Social sentiment APIs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('ai-sentiment-scraper');

/**
 * Fetch Fear & Greed Index from alternative.me API
 */
async function fetchFearGreedIndex(): Promise<{ value: number; label: string; metadata: any } | null> {
  try {
    // Using alternative.me Fear & Greed Index API
    const url = 'https://api.alternative.me/fng/?limit=1';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data = await response.json();
    const latest = data.data?.[0];

    if (!latest) {
      return null;
    }

    const value = parseInt(latest.value || '50');
    const label = latest.value_classification || 'Neutral';

    return {
      value,
      label,
      metadata: {
        timestamp: latest.timestamp,
        time_until_update: latest.time_until_update,
        raw: latest
      }
    };
  } catch (error) {
    logger.error('system', 'fetch_fear_greed', 'Failed to fetch Fear & Greed Index', { error: error.message });
    return null;
  }
}

/**
 * Calculate funding bias from recent funding rates
 */
async function calculateFundingBias(
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ value: number; label: string; metadata: any } | null> {
  try {
    // Get last 24 hours of funding rates for major symbols
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabaseClient
      .from('funding_rates')
      .select('symbol, funding_rate, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Calculate average funding rate
    const avgFunding = data.reduce((sum, r) => sum + Number(r.funding_rate || 0), 0) / data.length;
    
    // Convert funding rate to sentiment score (0-100)
    // Positive funding = longs pay shorts (bearish sentiment)
    // Negative funding = shorts pay longs (bullish sentiment)
    // Normalize: -0.1% to +0.1% maps to 0-100
    const normalizedValue = Math.max(0, Math.min(100, 50 + (avgFunding * 10000 * -1))); // Invert: negative = bullish
    
    let label = 'Neutral';
    if (normalizedValue >= 70) {
      label = 'Bullish';
    } else if (normalizedValue >= 60) {
      label = 'Slightly Bullish';
    } else if (normalizedValue <= 30) {
      label = 'Bearish';
    } else if (normalizedValue <= 40) {
      label = 'Slightly Bearish';
    }

    return {
      value: Math.round(normalizedValue),
      label,
      metadata: {
        avg_funding_rate: avgFunding,
        samples_count: data.length,
        symbols: [...new Set(data.map(r => r.symbol))].slice(0, 10)
      }
    };
  } catch (error) {
    logger.error('system', 'calculate_funding_bias', 'Failed to calculate funding bias', { error: error.message });
    return null;
  }
}

/**
 * Save sentiment snapshot to database
 */
async function saveSentimentSnapshot(
  supabaseClient: ReturnType<typeof createClient>,
  source: string,
  value: number,
  label: string,
  metadata: any
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('market_sentiment_snapshots')
      .insert({
        source,
        value,
        label,
        metadata
      });

    if (error) {
      throw error;
    }

    logger.info('system', 'save_sentiment', `Saved ${source} sentiment: ${value} (${label})`);
  } catch (error) {
    logger.error('system', 'save_sentiment', `Failed to save ${source} sentiment`, { error: error.message });
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    logger.info('system', 'start', 'Starting sentiment scraper');

    const results: any[] = [];

    // 1. Fetch Fear & Greed Index
    const fearGreed = await fetchFearGreedIndex();
    if (fearGreed) {
      await saveSentimentSnapshot(
        supabaseClient,
        'fear_greed',
        fearGreed.value,
        fearGreed.label,
        fearGreed.metadata
      );
      results.push({ source: 'fear_greed', ...fearGreed });
    }

    // 2. Calculate Funding Bias
    const fundingBias = await calculateFundingBias(supabaseClient);
    if (fundingBias) {
      await saveSentimentSnapshot(
        supabaseClient,
        'funding_bias',
        fundingBias.value,
        fundingBias.label,
        fundingBias.metadata
      );
      results.push({ source: 'funding_bias', ...fundingBias });
    }

    // 3. Calculate aggregate sentiment (weighted average)
    let aggregateValue = 50;
    let aggregateLabel = 'Neutral';
    
    if (results.length > 0) {
      const weights: Record<string, number> = {
        fear_greed: 0.6,
        funding_bias: 0.4
      };
      
      const weightedSum = results.reduce((sum, r) => {
        const weight = weights[r.source] || 0.5;
        return sum + (r.value * weight);
      }, 0);
      
      const totalWeight = results.reduce((sum, r) => {
        return sum + (weights[r.source] || 0.5);
      }, 0);
      
      aggregateValue = Math.round(weightedSum / totalWeight);
      
      if (aggregateValue >= 70) {
        aggregateLabel = 'Extreme Greed';
      } else if (aggregateValue >= 60) {
        aggregateLabel = 'Greed';
      } else if (aggregateValue <= 30) {
        aggregateLabel = 'Extreme Fear';
      } else if (aggregateValue <= 40) {
        aggregateLabel = 'Fear';
      }
    }

    // Save aggregate sentiment
    await saveSentimentSnapshot(
      supabaseClient,
      'aggregate',
      aggregateValue,
      aggregateLabel,
      {
        components: results,
        calculated_at: new Date().toISOString()
      }
    );

    logger.info('system', 'complete', `Sentiment scraper completed. Aggregate: ${aggregateValue} (${aggregateLabel})`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        aggregate: {
          value: aggregateValue,
          label: aggregateLabel
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('system', 'handler_error', 'Sentiment scraper error', { error: error.message });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

