/**
 * Portfolio Sync Edge Function
 * 
 * Phase X.13 - Syncs portfolio data from exchange APIs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { getSupabaseClient, getUserFromRequest } from '../_shared/utils.ts';
import { getBinanceBalances, getBinanceBalancesByPlatform } from '../exchange-portfolio/platforms/binance.ts';
import { fetchCryptoPrices } from '../exchange-portfolio/utils/pricing.ts';

const logger = createLogger('portfolio-sync');

/**
 * Fetch spot balance from exchange using real APIs where available
 */
async function fetchSpotBalance(
  apiKey: string,
  apiSecret: string,
  exchange: string,
  platform?: string
): Promise<Record<string, { amount: number; value_usd: number }>> {
  // Phase X.17: Support binance-demo and binance-spot-testnet
  const isBinance = exchange === 'binance' || 
                    platform === 'binance-demo' || 
                    platform === 'binance-spot-testnet' ||
                    platform === 'binance-futures-testnet';
  
  if (isBinance) {
    const apiKeyObj = { 
      api_key: apiKey, 
      secret_key: apiSecret,
      platform: platform || exchange,
      testnet: platform?.includes('testnet') || platform === 'binance-demo'
    };

    // Phase X.17: Use getBinanceBalancesByPlatform for better platform support
    let balances: any[];
    if (platform && (platform === 'binance-demo' || platform === 'binance-spot-testnet' || platform === 'binance-futures-testnet')) {
      balances = await getBinanceBalancesByPlatform(apiKeyObj, platform, 'spot');
    } else {
      balances = await getBinanceBalances(apiKeyObj, 'spot');
    }

    if (!balances || balances.length === 0) {
      return {};
    }

    const symbols = Array.from(
      new Set(
        balances
          .map((b: any) => String(b.symbol).toUpperCase())
          .filter((s) => !!s)
      )
    );

    // Fetch approximate USD prices for these symbols
    const prices = await fetchCryptoPrices(symbols);

    const result: Record<string, { amount: number; value_usd: number }> = {};

    for (const balance of balances as any[]) {
      const symbol = String(balance.symbol).toUpperCase();
      const amount = Number(balance.total_balance ?? 0);
      if (amount <= 0) continue;

      const priceUsd =
        symbol === 'USDT'
          ? 1
          : prices[symbol.toLowerCase()] ?? 0;

      result[symbol] = {
        amount,
        value_usd: amount * priceUsd,
      };
    }

    return result;
  }

  // Fallback for unsupported exchanges: empty portfolio
  return {};
}

/**
 * Fetch futures positions from exchange (mock - replace with actual API call)
 */
async function fetchFuturesPositions(
  apiKey: string,
  apiSecret: string,
  exchange: string
): Promise<Array<{
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entry_price: number;
  leverage: number;
  unrealized_pnl: number;
  margin: number;
}>> {
  // TODO: Implement actual exchange API call
  // For now, return empty array
  return [];
}

/**
 * Calculate portfolio metrics
 */
function calculatePortfolioMetrics(
  spotBalance: Record<string, { amount: number; value_usd: number }>,
  futuresPositions: Array<{
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entry_price: number;
    leverage: number;
    unrealized_pnl: number;
    margin: number;
  }>
) {
  // Calculate spot value
  const spotValue = Object.values(spotBalance).reduce(
    (sum, asset) => sum + asset.value_usd,
    0
  );

  // Calculate futures value and leverage
  let futuresValue = 0;
  let totalLeverage = 0;
  let totalUnrealizedPnL = 0;
  let totalMargin = 0;

  for (const position of futuresPositions) {
    futuresValue += position.size * position.entry_price;
    totalUnrealizedPnL += position.unrealized_pnl;
    totalMargin += position.margin;
    totalLeverage += position.leverage;
  }

  const avgLeverage = futuresPositions.length > 0
    ? totalLeverage / futuresPositions.length
    : 0;

  const totalBalance = spotValue + totalMargin + totalUnrealizedPnL;

  // Calculate exposure
  const exposure: Record<string, number> = {};
  for (const [asset, data] of Object.entries(spotBalance)) {
    if (asset !== 'USDT') {
      exposure[asset] = data.value_usd / totalBalance;
    }
  }

  // Add futures exposure
  for (const position of futuresPositions) {
    const baseAsset = position.symbol.replace('USDT', '');
    const positionValue = position.size * position.entry_price;
    exposure[baseAsset] = (exposure[baseAsset] || 0) + positionValue / totalBalance;
  }

  const totalExposure = Object.values(exposure).reduce((sum, val) => sum + val, 0) * 100;

  return {
    total_balance: totalBalance,
    spot_value: spotValue,
    futures_value: futuresValue,
    leverage_used: avgLeverage,
    unrealized_pnl: totalUnrealizedPnL,
    realized_pnl: 0, // Would need to track from history
    total_exposure: totalExposure,
    exposure,
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

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Phase X.15: Rate Limiting
    if (req.method === 'POST') {
      const { edgeRateLimiter } = await import('../_shared/rateLimiter.ts');
      const rateLimit = edgeRateLimiter.isAllowed(
        user.id,
        'portfolio-sync',
        1, // 1 request
        60000 // per minute
      );

      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait before syncing again.',
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

    if (req.method === 'POST') {
      const body = await req.json();
      const { exchange, api_key, api_secret, api_key_id } = body ?? {};

      if (!exchange || !api_key || !api_secret) {
        return new Response(
          JSON.stringify({ error: 'exchange, api_key, and api_secret are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Phase X.17: Get platform info from api_keys if api_key_id provided
      let platform = exchange;
      let scopeType: 'GLOBAL' | 'EXCHANGE' = 'GLOBAL';
      let apiKeyIdForSnapshot: string | null = null;
      
      if (api_key_id) {
        const { data: apiKeyData } = await supabaseClient
          .from('api_keys')
          .select('platform, testnet')
          .eq('id', api_key_id)
          .eq('user_id', user.id)
          .single();
        
        if (apiKeyData) {
          platform = apiKeyData.platform;
          scopeType = 'EXCHANGE';
          apiKeyIdForSnapshot = api_key_id;
        }
      }

      // TODO: Replace mocked calls with real exchange API integration
      const spotBalance = await fetchSpotBalance(api_key, api_secret, exchange, platform);
      const futuresPositions = await fetchFuturesPositions(api_key, api_secret, exchange);

      // Calculate metrics
      const metrics = calculatePortfolioMetrics(spotBalance, futuresPositions);

      // Phase X.17: Create snapshot with scope support
      const snapshotData: any = {
        user_id: user.id,
        timestamp: new Date().toISOString(),
        total_equity: metrics.total_balance,
        spot_equity: metrics.spot_value,
        futures_equity: metrics.futures_value,
        unrealized_pnl: metrics.unrealized_pnl,
        realized_pnl: metrics.realized_pnl,
        allocation: metrics.exposure,
        exposure: metrics.exposure,
        metrics: {
          total_balance: metrics.total_balance,
          total_exposure: metrics.total_exposure,
          leverage_used: metrics.leverage_used,
          spot_value: metrics.spot_value,
          futures_value: metrics.futures_value,
        },
        scope_type: scopeType,
        api_key_id: apiKeyIdForSnapshot,
        platform: platform,
      };

      const { data: snapshot, error: insertError } = await supabaseClient
        .from('portfolio_snapshots' as any)
        .insert(snapshotData)
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating snapshot:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create portfolio snapshot' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          snapshot,
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

