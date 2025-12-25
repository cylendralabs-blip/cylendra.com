/**
 * Signal Forecaster Edge Function
 * 
 * Phase X.11 - AI Trade Forecasting Engine
 * 
 * Generates forecasts for signals
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('signal-forecaster');

/**
 * Build features for signal (simplified version for Edge Function)
 */
async function buildFeatures(
  supabaseClient: ReturnType<typeof createClient>,
  signal: any
): Promise<any> {
  const symbol = signal.symbol || 'BTC/USDT';
  const timeframe = signal.timeframe || '1h';

  // Fetch market intelligence in parallel
  const [riskProfile, heatmap, fundingRate, sentiment] = await Promise.all([
    supabaseClient
      .from('asset_risk_profiles')
      .select('volatility_score, liquidity_score')
      .eq('symbol', symbol)
      .maybeSingle(),
    
    supabaseClient
      .from('market_heatmap_metrics')
      .select('volatility_score, activity_score')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    supabaseClient
      .from('funding_rates')
      .select('funding_rate')
      .eq('symbol', symbol.replace('/', ''))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    supabaseClient
      .from('market_sentiment_snapshots')
      .select('value')
      .eq('source', 'fear_greed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    ai_score: signal.ai_score || signal.final_confidence || 0,
    technical_score: signal.technical_score || 0,
    volume_score: signal.volume_score || 0,
    pattern_score: signal.pattern_score || 0,
    wave_score: signal.wave_score || 0,
    sentiment_score: signal.sentiment_score || 0,
    risk_level_numeric: signal.risk_level === 'LOW' ? 1 : signal.risk_level === 'MEDIUM' ? 2 : signal.risk_level === 'HIGH' ? 3 : 4,
    volatility_score: heatmap?.data?.[0]?.volatility_score || riskProfile?.data?.volatility_score || 50,
    activity_score: heatmap?.data?.[0]?.activity_score || 50,
    funding_rate: fundingRate?.data?.[0]?.funding_rate || 0,
    market_sentiment_value: sentiment?.data?.[0]?.value || 50,
  };
}

/**
 * Find similar historical signals
 */
async function findSimilarSignals(
  supabaseClient: ReturnType<typeof createClient>,
  features: any,
  symbol: string,
  side: string,
  limit: number = 100
): Promise<any[]> {
  const aiScoreMin = Math.max(0, features.ai_score - 15);
  const aiScoreMax = Math.min(100, features.ai_score + 15);

  const { data, error } = await supabaseClient
    .from('signal_outcomes')
    .select('*')
    .eq('side', side)
    .eq('symbol', symbol)
    .gte('ai_score', aiScoreMin)
    .lte('ai_score', aiScoreMax)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error finding similar signals:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate forecast from similar signals
 */
function calculateForecast(similarSignals: any[], features: any): any {
  if (similarSignals.length === 0) {
    // Rule-based fallback
    let successProb = 50;
    if (features.ai_score >= 80) successProb = 75;
    else if (features.ai_score >= 70) successProb = 65;
    else if (features.ai_score < 50) successProb = 35;

    const riskPenalty = (features.risk_level_numeric - 1) * 5;
    successProb -= riskPenalty;
    successProb = Math.max(20, Math.min(90, successProb));

    return {
      success_probability: Math.round(successProb * 10) / 10,
      expected_return_pct: features.ai_score >= 70 ? 1.5 : 0.5,
      expected_holding_seconds: 3600,
      risk_adjusted_score: Math.max(30, successProb - riskPenalty),
      forecast_label: successProb >= 65 ? 'HIGH' : successProb >= 45 ? 'MEDIUM' : 'LOW',
      sample_size: 0,
    };
  }

  const wins = similarSignals.filter(s => s.result_label === 'WIN');
  const successRate = (wins.length / similarSignals.length) * 100;
  const avgReturn = similarSignals.reduce((sum, s) => sum + (s.profit_loss_percentage || 0), 0) / similarSignals.length;
  
  const winningTimes = wins
    .filter(s => s.holding_duration_seconds)
    .map(s => s.holding_duration_seconds);
  const avgHoldingTime = winningTimes.length > 0
    ? Math.round(winningTimes.reduce((sum, t) => sum + t, 0) / winningTimes.length)
    : 3600;

  const riskPenalty = (features.risk_level_numeric - 1) * 5;
  let riskAdjusted = successRate;
  if (avgReturn > 0) riskAdjusted += Math.min(20, avgReturn * 2);
  riskAdjusted -= riskPenalty;
  riskAdjusted = Math.max(0, Math.min(100, riskAdjusted));

  let forecastLabel: 'HIGH' | 'MEDIUM' | 'LOW';
  if (successRate >= 65 && riskAdjusted >= 70) {
    forecastLabel = 'HIGH';
  } else if (successRate < 45 || riskAdjusted < 45) {
    forecastLabel = 'LOW';
  } else {
    forecastLabel = 'MEDIUM';
  }

  return {
    success_probability: Math.round(successRate * 10) / 10,
    expected_return_pct: Math.round(avgReturn * 100) / 100,
    expected_holding_seconds: avgHoldingTime,
    risk_adjusted_score: Math.round(riskAdjusted * 10) / 10,
    forecast_label: forecastLabel,
    sample_size: similarSignals.length,
  };
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
    const supabaseClient = getSupabaseClient();
    const user = await getUserFromRequest(req, supabaseClient);

    if (req.method === 'POST') {
      const body = await req.json();
      const { signal_id, signal_data } = body;

      let signal: any;

      if (signal_id) {
        // Fetch signal from database
        const { data, error } = await supabaseClient
          .from('ai_signals_history')
          .select('*')
          .eq('id', signal_id)
          .maybeSingle();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Signal not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        signal = data;
      } else if (signal_data) {
        signal = signal_data;
      } else {
        return new Response(
          JSON.stringify({ error: 'signal_id or signal_data required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Build features
      const features = await buildFeatures(supabaseClient, signal);

      // Find similar signals
      const similarSignals = await findSimilarSignals(
        supabaseClient,
        features,
        signal.symbol,
        signal.side
      );

      // Calculate forecast
      const forecast = calculateForecast(similarSignals, features);

      // Save forecast to database
      const { data: savedForecast, error: saveError } = await supabaseClient
        .from('signal_forecasts')
        .insert({
          signal_id: signal_id || null,
          user_id: user?.id || null,
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          side: signal.side,
          forecast_model_version: 'v1.0',
          success_probability: forecast.success_probability,
          expected_return_pct: forecast.expected_return_pct,
          expected_holding_seconds: forecast.expected_holding_seconds,
          risk_adjusted_score: forecast.risk_adjusted_score,
          forecast_label: forecast.forecast_label,
          features_snapshot: features,
          metadata: {
            sample_size: forecast.sample_size,
          },
        })
        .select()
        .single();

      if (saveError) {
        logger.error('Error saving forecast:', saveError);
        // Continue anyway, return forecast even if save fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          forecast: {
            ...forecast,
            id: savedForecast?.id,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // GET - Fetch forecast for signal
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const signalId = url.searchParams.get('signal_id');

      if (!signalId) {
        return new Response(
          JSON.stringify({ error: 'signal_id required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data, error } = await supabaseClient
        .from('signal_forecasts')
        .select('*')
        .eq('signal_id', signalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching forecast:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch forecast' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          forecast: data,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

