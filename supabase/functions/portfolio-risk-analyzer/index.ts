/**
 * Portfolio Risk Analyzer Edge Function
 * 
 * Phase X.13 - Analyzes portfolio risk and generates risk scores
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';

const logger = createLogger('portfolio-risk-analyzer');

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
      const { snapshot_id } = body;

      // Get latest snapshot if not provided
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
        // Get latest snapshot
        const { data, error } = await supabaseClient
          .from('portfolio_snapshots' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: 'No portfolio snapshot found. Please sync portfolio first.' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        snapshot = data;
      }

      // Call risk analysis (import from shared module or inline)
      // For now, simplified risk calculation
      const leverageRisk = snapshot.leverage_used >= 10 ? 100 :
                          snapshot.leverage_used >= 5 ? 75 :
                          snapshot.leverage_used >= 3 ? 50 :
                          snapshot.leverage_used >= 2 ? 25 : 10;

      const exposureRisk = snapshot.total_exposure > 90 ? 100 :
                          snapshot.total_exposure > 70 ? 75 :
                          snapshot.total_exposure > 50 ? 50 :
                          snapshot.total_exposure > 30 ? 25 : 10;

      // Calculate diversification risk
      let diversificationRisk = 50;
      if (snapshot.exposure) {
        const maxExposure = Math.max(...Object.values(snapshot.exposure as Record<string, number>));
        if (maxExposure > 0.5) diversificationRisk = 100;
        else if (maxExposure > 0.4) diversificationRisk = 75;
        else if (maxExposure > 0.3) diversificationRisk = 50;
        else if (maxExposure > 0.2) diversificationRisk = 25;
        else diversificationRisk = 10;
      }

      // Calculate liquidation risk
      let liquidationRisk = 0;
      if (snapshot.futures_positions && Array.isArray(snapshot.futures_positions)) {
        const highLeveragePositions = snapshot.futures_positions.filter(
          (p: any) => p.leverage >= 5
        );
        const negativePnLPositions = snapshot.futures_positions.filter(
          (p: any) => p.unrealized_pnl < 0
        );

        if (highLeveragePositions.length > 0 && negativePnLPositions.length > 0) {
          liquidationRisk = 80;
        } else if (highLeveragePositions.length > 0) {
          liquidationRisk = 50;
        }
      }

      // Overall score
      const overallScore = Math.round(
        leverageRisk * 0.25 +
        exposureRisk * 0.20 +
        diversificationRisk * 0.15 +
        liquidationRisk * 0.15 +
        30 * 0.15 + // volatility (simplified)
        20 * 0.10   // funding (simplified)
      );

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (overallScore >= 80) {
        riskLevel = 'CRITICAL';
      } else if (overallScore >= 60) {
        riskLevel = 'HIGH';
      } else if (overallScore >= 40) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      // Generate AI comment
      let aiComment = '';
      if (riskLevel === 'CRITICAL') {
        aiComment = '⚠️ CRITICAL RISK: Immediate action required.';
      } else if (riskLevel === 'HIGH') {
        aiComment = '⚠️ HIGH RISK: Consider reducing exposure or leverage.';
      } else if (riskLevel === 'MEDIUM') {
        aiComment = 'ℹ️ MODERATE RISK: Monitor positions closely.';
      } else {
        aiComment = '✅ LOW RISK: Portfolio appears well-balanced.';
      }

      // Risk factors
      const riskFactors: Array<{ type: string; severity: string; description: string }> = [];
      if (leverageRisk >= 75) {
        riskFactors.push({
          type: 'leverage',
          severity: 'CRITICAL',
          description: `Extremely high leverage (${snapshot.leverage_used.toFixed(1)}x) detected`,
        });
      }
      if (diversificationRisk >= 75 && snapshot.exposure) {
        const maxAsset = Object.entries(snapshot.exposure as Record<string, number>)
          .sort((a, b) => b[1] - a[1])[0];
        if (maxAsset) {
          riskFactors.push({
            type: 'diversification',
            severity: 'HIGH',
            description: `Over-concentration in ${maxAsset[0]} (${(maxAsset[1] * 100).toFixed(1)}%)`,
          });
        }
      }

      // Save risk score
      const { data: riskScore, error: insertError } = await supabaseClient
        .from('portfolio_risk_scores' as any)
        .insert({
          user_id: user.id,
          snapshot_id: snapshot.id,
          risk_level: riskLevel,
          volatility_score: 30, // Simplified
          leverage_risk: leverageRisk,
          exposure_risk: exposureRisk,
          diversification_score: 100 - diversificationRisk,
          liquidation_risk: liquidationRisk,
          funding_risk: 20, // Simplified
          overall_score: overallScore,
          ai_comment: aiComment,
          risk_factors: riskFactors,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating risk score:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create risk score' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          risk_score: riskScore,
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

