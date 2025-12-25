/**
 * Asset Risk Map Builder Edge Function
 * 
 * Phase X.9 - AI Market Intelligence Layer
 * 
 * Builds risk profiles for each asset based on:
 * - Market heatmap metrics
 * - Funding rates
 * - Sentiment data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('asset-risk-map-builder');

// Symbols to process
const TRACKED_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
  'LINKUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'LTCUSDT'
];

const DAYS_TO_ANALYZE = 7; // Last 7 days

/**
 * Get recent heatmap metrics for a symbol
 */
async function getRecentHeatmapMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string
): Promise<any[]> {
  const daysAgo = new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabaseClient
    .from('market_heatmap_metrics')
    .select('*')
    .eq('symbol', symbol)
    .gte('created_at', daysAgo)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Get recent funding rates for a symbol
 */
async function getRecentFundingRates(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string
): Promise<any[]> {
  const daysAgo = new Date(Date.now() - DAYS_TO_ANALYZE * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabaseClient
    .from('funding_rates')
    .select('*')
    .eq('symbol', symbol)
    .gte('created_at', daysAgo)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Get latest aggregate sentiment
 */
async function getLatestSentiment(
  supabaseClient: ReturnType<typeof createClient>
): Promise<number | null> {
  const { data, error } = await supabaseClient
    .from('market_sentiment_snapshots')
    .select('value')
    .eq('source', 'aggregate')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return Number(data.value);
}

/**
 * Calculate volatility score from heatmap metrics
 */
function calculateVolatilityScore(metrics: any[]): number {
  if (metrics.length === 0) return 50;

  const avgVolatility = metrics.reduce((sum, m) => sum + Number(m.volatility_score || 50), 0) / metrics.length;
  return Math.round(avgVolatility);
}

/**
 * Calculate liquidity score from volume and open interest
 */
function calculateLiquidityScore(
  metrics: any[],
  fundingRates: any[]
): number {
  if (metrics.length === 0) return 50;

  // Average volume score (normalized)
  const avgVolume = metrics.reduce((sum, m) => sum + Number(m.volume_24h || 0), 0) / metrics.length;
  
  // Average open interest from funding rates
  const avgOI = fundingRates.length > 0
    ? fundingRates.reduce((sum, r) => sum + Number(r.open_interest || 0), 0) / fundingRates.length
    : 0;

  // Combine volume and OI (simplified heuristic)
  const volumeScore = Math.min(100, Math.log10(avgVolume + 1) * 10);
  const oiScore = avgOI > 0 ? Math.min(100, Math.log10(avgOI + 1) * 5) : 50;
  
  return Math.round((volumeScore * 0.6 + oiScore * 0.4));
}

/**
 * Determine base risk level
 */
function determineRiskLevel(
  volatilityScore: number,
  liquidityScore: number,
  sentiment: number | null
): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
  // High volatility + low liquidity = high risk
  // Extreme sentiment (fear/greed) = higher risk
  
  const riskScore = (volatilityScore * 0.5) + ((100 - liquidityScore) * 0.3);
  const sentimentRisk = sentiment !== null
    ? (sentiment < 30 || sentiment > 70 ? 20 : 0) // Extreme fear or greed adds risk
    : 0;
  
  const totalRisk = riskScore + sentimentRisk;
  
  if (totalRisk >= 80) {
    return 'EXTREME';
  } else if (totalRisk >= 60) {
    return 'HIGH';
  } else if (totalRisk >= 40) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Calculate leverage recommendation based on risk
 */
function calculateLeverageRecommendation(riskLevel: string): number {
  switch (riskLevel) {
    case 'EXTREME':
      return 1; // No leverage
    case 'HIGH':
      return 2; // 2x max
    case 'MEDIUM':
      return 5; // 5x max
    case 'LOW':
      return 10; // 10x max
    default:
      return 3;
  }
}

/**
 * Calculate position size factor
 */
function calculatePositionSizeFactor(riskLevel: string): number {
  switch (riskLevel) {
    case 'EXTREME':
      return 0.1; // 10% of normal size
    case 'HIGH':
      return 0.3; // 30% of normal size
    case 'MEDIUM':
      return 0.6; // 60% of normal size
    case 'LOW':
      return 1.0; // 100% of normal size
    default:
      return 0.5;
  }
}

/**
 * Determine sentiment bias
 */
function determineSentimentBias(
  metrics: any[],
  fundingRates: any[],
  sentiment: number | null
): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  // Check trend scores
  const avgTrend = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + Number(m.trend_score || 50), 0) / metrics.length
    : 50;

  // Check funding rates (negative = bullish, positive = bearish)
  const avgFunding = fundingRates.length > 0
    ? fundingRates.reduce((sum, r) => sum + Number(r.funding_rate || 0), 0) / fundingRates.length
    : 0;

  // Combine signals
  let bullishScore = 0;
  let bearishScore = 0;

  if (avgTrend > 60) bullishScore += 1;
  if (avgTrend < 40) bearishScore += 1;
  
  if (avgFunding < -0.0001) bullishScore += 1; // Negative funding = bullish
  if (avgFunding > 0.0001) bearishScore += 1; // Positive funding = bearish

  if (sentiment !== null) {
    if (sentiment > 60) bullishScore += 1;
    if (sentiment < 40) bearishScore += 1;
  }

  if (bullishScore > bearishScore) {
    return 'BULLISH';
  } else if (bearishScore > bullishScore) {
    return 'BEARISH';
  } else {
    return 'NEUTRAL';
  }
}

/**
 * Build risk profile for a symbol
 */
async function buildRiskProfile(
  supabaseClient: ReturnType<typeof createClient>,
  symbol: string
): Promise<boolean> {
  try {
    // Get data
    const [metrics, fundingRates, sentiment] = await Promise.all([
      getRecentHeatmapMetrics(supabaseClient, symbol),
      getRecentFundingRates(supabaseClient, symbol),
      getLatestSentiment(supabaseClient)
    ]);

    // Calculate scores
    const volatilityScore = calculateVolatilityScore(metrics);
    const liquidityScore = calculateLiquidityScore(metrics, fundingRates);
    const baseRiskLevel = determineRiskLevel(volatilityScore, liquidityScore, sentiment);
    const leverageRecommendation = calculateLeverageRecommendation(baseRiskLevel);
    const positionSizeFactor = calculatePositionSizeFactor(baseRiskLevel);
    const sentimentBias = determineSentimentBias(metrics, fundingRates, sentiment);

    // Build data window summary
    const dataWindow = {
      days_analyzed: DAYS_TO_ANALYZE,
      metrics_count: metrics.length,
      funding_rates_count: fundingRates.length,
      avg_volatility: volatilityScore,
      avg_liquidity: liquidityScore,
      latest_sentiment: sentiment,
      last_updated: new Date().toISOString()
    };

    // Upsert risk profile
    const { error } = await supabaseClient
      .from('asset_risk_profiles')
      .upsert({
        symbol,
        base_risk_level: baseRiskLevel,
        volatility_score: volatilityScore,
        liquidity_score: liquidityScore,
        leverage_recommendation: leverageRecommendation,
        position_size_factor: positionSizeFactor,
        sentiment_bias: sentimentBias,
        data_window: dataWindow,
        metadata: {
          calculated_at: new Date().toISOString(),
          metrics_sample: metrics.slice(0, 5).map(m => ({
            volatility: m.volatility_score,
            trend: m.trend_score,
            activity: m.activity_score,
            heat: m.heat_label
          })),
          funding_sample: fundingRates.slice(0, 5).map(r => ({
            exchange: r.exchange,
            funding_rate: r.funding_rate,
            open_interest: r.open_interest
          }))
        }
      }, {
        onConflict: 'symbol'
      });

    if (error) {
      throw error;
    }

    logger.info('system', 'build_profile', `Built risk profile for ${symbol}: ${baseRiskLevel} (leverage: ${leverageRecommendation}x, size: ${positionSizeFactor})`);

    return true;
  } catch (error) {
    logger.warn('system', 'build_profile', `Failed to build risk profile for ${symbol}`, { error: error.message });
    return false;
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

    logger.info('system', 'start', 'Starting asset risk map builder');

    const results: any = {};
    let totalProcessed = 0;

    // Process each symbol
    for (const symbol of TRACKED_SYMBOLS) {
      const success = await buildRiskProfile(supabaseClient, symbol);
      if (success) {
        totalProcessed++;
        results[symbol] = 'success';
      } else {
        results[symbol] = 'failed';
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info('system', 'complete', `Asset risk map builder completed. Processed ${totalProcessed} profiles`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        total_symbols: TRACKED_SYMBOLS.length,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('system', 'handler_error', 'Asset risk map builder error', { error: error.message });
    
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

