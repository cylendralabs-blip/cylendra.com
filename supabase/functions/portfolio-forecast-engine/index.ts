/**
 * Portfolio Forecast Engine Edge Function
 * 
 * Phase X.13 - Generates portfolio performance forecasts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('portfolio-forecast-engine');

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

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { snapshot_id, period = '7d' } = body;

      // Get latest snapshot
      let snapshot;
      if (snapshot_id) {
        const { data, error } = await supabaseClient
          .from('portfolio_snapshots' as any)
          .select('*')
          .eq('id', snapshot_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'Snapshot not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        snapshot = data;
      } else {
        const { data, error } = await supabaseClient
          .from('portfolio_snapshots' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'No portfolio snapshot found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        snapshot = data;
      }

      // Calculate forecast (simplified)
      let expectedGrowth = 0;
      const assetForecasts: Array<{
        asset: string;
        expected_return: number;
        risk_level: string;
      }> = [];

      if (snapshot.exposure) {
        const exposure = snapshot.exposure as Record<string, number>;
        for (const [asset, exposurePct] of Object.entries(exposure)) {
          if (asset === 'USDT' || exposurePct === 0) continue;

          // Simplified expected return
          let expectedReturn = 0;
          if (asset === 'BTC') {
            expectedReturn = period === '7d' ? 2 : period === '30d' ? 8 : 20;
          } else if (asset === 'ETH') {
            expectedReturn = period === '7d' ? 2.5 : period === '30d' ? 10 : 25;
          } else {
            expectedReturn = period === '7d' ? 3 : period === '30d' ? 12 : 30;
          }

          expectedGrowth += expectedReturn * exposurePct;
          assetForecasts.push({
            asset,
            expected_return: expectedReturn,
            risk_level: exposurePct > 0.3 ? 'HIGH' : exposurePct > 0.15 ? 'MEDIUM' : 'LOW',
          });
        }
      }

      // Risk-adjusted growth
      const riskAdjustment = snapshot.leverage_used > 1 ? 0.8 : 0.9;
      const riskAdjustedGrowth = expectedGrowth * riskAdjustment;

      // Best and worst assets
      let bestAsset = '';
      let worstAsset = '';
      if (assetForecasts.length > 0) {
        const sorted = [...assetForecasts].sort((a, b) => b.expected_return - a.expected_return);
        bestAsset = sorted[0].asset;
        worstAsset = sorted[sorted.length - 1].asset;
      }

      // Momentum direction
      let momentumDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      if (expectedGrowth > 3) {
        momentumDirection = 'BULLISH';
      } else if (expectedGrowth < -3) {
        momentumDirection = 'BEARISH';
      }

      // Confidence score
      let confidenceScore = 50;
      if (snapshot.exposure && Object.keys(snapshot.exposure as Record<string, number>).length > 1) {
        confidenceScore += 10;
      }
      if (snapshot.leverage_used <= 2) {
        confidenceScore += 5;
      }
      confidenceScore = Math.min(100, confidenceScore);

      // Create forecast
      const { data: forecast, error: insertError } = await supabaseClient
        .from('portfolio_forecasts' as any)
        .insert({
          user_id: user.id,
          snapshot_id: snapshot.id,
          forecast_period: period,
          expected_growth: Math.round(expectedGrowth * 100) / 100,
          risk_adjusted_growth: Math.round(riskAdjustedGrowth * 100) / 100,
          best_asset: bestAsset,
          worst_asset: worstAsset,
          momentum_direction: momentumDirection,
          confidence_score: confidenceScore,
          forecast_details: {
            asset_forecasts: assetForecasts,
            market_conditions: momentumDirection === 'BULLISH'
              ? 'Favorable market conditions expected'
              : momentumDirection === 'BEARISH'
              ? 'Challenging market conditions expected'
              : 'Neutral market conditions expected',
            key_factors: [
              `Expected ${period} return: ${expectedGrowth > 0 ? '+' : ''}${expectedGrowth.toFixed(2)}%`,
              `Risk-adjusted: ${riskAdjustedGrowth > 0 ? '+' : ''}${riskAdjustedGrowth.toFixed(2)}%`,
              `Confidence: ${confidenceScore}%`,
            ],
          },
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating forecast:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create forecast' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          forecast,
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

