/**
 * Portfolio Sync Service
 * 
 * Syncs portfolio data from exchanges for each user
 * Calculates equity, exposure, allocation
 * Stores snapshots in database
 * 
 * Phase 7: Portfolio & Wallet Integration - Task 2
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PORTFOLIO_SYNC_CONFIG } from './config.ts';

/**
 * Portfolio Sync Result
 */
export interface PortfolioSyncResult {
  success: boolean;
  userId: string;
  apiKeyId: string;
  platform: string;
  totalEquity?: number;
  spotEquity?: number;
  futuresEquity?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  openPositionsCount?: number;
  errors: string[];
  warnings: string[];
}

/**
 * Fetch user API keys
 */
export async function fetchUserApiKeys(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<Array<{
  id: string;
  api_key: string;
  secret_key: string;
  passphrase?: string;
  platform: string;
  testnet: boolean;
}>> {
  const { data, error } = await supabaseClient
    .from('api_keys')
    .select('id, api_key, secret_key, passphrase, platform, testnet')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    console.error(`Error fetching API keys for user ${userId}:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Sync portfolio for a single user
 */
export async function syncUserPortfolio(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<PortfolioSyncResult[]> {
  const results: PortfolioSyncResult[] = [];
  
  // Fetch user's API keys
  const apiKeys = await fetchUserApiKeys(supabaseClient, userId);
  
  if (apiKeys.length === 0) {
    return [{
      success: false,
      userId,
      apiKeyId: '',
      platform: '',
      errors: ['No active API keys found for user'],
      warnings: []
    }];
  }
  
  // Phase X.17: Track aggregated values for GLOBAL snapshot
  let aggregatedTotalEquity = 0;
  let aggregatedSpotEquity = 0;
  let aggregatedFuturesEquity = 0;
  let aggregatedUnrealizedPnl = 0;
  let aggregatedRealizedPnl = 0;
  const aggregatedAssetAllocation: any = {};
  const aggregatedExposure: any = {};
  const aggregatedMetrics: any = {};
  
  // Sync portfolio for each API key
  for (const apiKey of apiKeys) {
    try {
      const result = await syncSingleApiKeyPortfolio(
        supabaseClient,
        userId,
        apiKey
      );
      results.push(result);
      
      // Phase X.17: Aggregate values for GLOBAL snapshot
      if (result.success && result.totalEquity !== undefined) {
        aggregatedTotalEquity += result.totalEquity || 0;
        aggregatedSpotEquity += result.spotEquity || 0;
        aggregatedFuturesEquity += result.futuresEquity || 0;
        aggregatedUnrealizedPnl += result.unrealizedPnl || 0;
        aggregatedRealizedPnl += result.realizedPnl || 0;
      }
    } catch (error: any) {
      results.push({
        success: false,
        userId,
        apiKeyId: apiKey.id,
        platform: apiKey.platform,
        errors: [error.message || 'Unknown error'],
        warnings: []
      });
    }
  }
  
  // Phase X.17: Create GLOBAL snapshot after processing all API keys
  if (PORTFOLIO_SYNC_CONFIG.ENABLE_SNAPSHOTS && results.some(r => r.success)) {
    const shouldCreateGlobalSnapshot = await shouldCreateSnapshotNow(
      supabaseClient,
      userId,
      'GLOBAL'
    );
    
    if (shouldCreateGlobalSnapshot) {
      try {
        await createPortfolioSnapshot(
          supabaseClient,
          userId,
          {
            totalEquity: aggregatedTotalEquity,
            spotEquity: aggregatedSpotEquity,
            futuresEquity: aggregatedFuturesEquity,
            unrealizedPnl: aggregatedUnrealizedPnl,
            realizedPnl: aggregatedRealizedPnl,
            assetAllocation: aggregatedAssetAllocation,
            exposure: aggregatedExposure,
            metrics: aggregatedMetrics,
            scopeType: 'GLOBAL'
          }
        );
        
        console.log(`Created GLOBAL snapshot for user ${userId}`);
      } catch (error: any) {
        console.error(`Failed to create GLOBAL snapshot for user ${userId}:`, error);
        // Don't fail the entire sync if GLOBAL snapshot fails
      }
    }
  }
  
  return results;
}

/**
 * Sync portfolio for a single API key
 */
async function syncSingleApiKeyPortfolio(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  apiKey: {
    id: string;
    api_key: string;
    secret_key: string;
    passphrase?: string;
    platform: string;
    testnet: boolean;
  }
): Promise<PortfolioSyncResult> {
  const result: PortfolioSyncResult = {
    success: false,
    userId,
    apiKeyId: apiKey.id,
    platform: apiKey.platform,
    errors: [],
    warnings: []
  };
  
  try {
    // Call exchange-portfolio Edge Function to fetch balances
    const supabaseUrl = getSupabaseUrl();
    const serviceKey = getSupabaseServiceRoleKey();
    
    // Fetch spot balances
    const spotResponse = await fetch(
      `${supabaseUrl}/functions/v1/exchange-portfolio`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_balance',
          api_key_id: apiKey.id,
          platform: apiKey.platform,
          market_type: 'spot'
        })
      }
    );
    
    if (!spotResponse.ok) {
      const errorText = await spotResponse.text();
      result.errors.push(`Failed to fetch spot balances: ${errorText}`);
      return result;
    }
    
    // Fetch futures balances (if supported)
    let futuresResponse: Response | null = null;
    if (apiKey.platform === 'binance' || apiKey.platform === 'okx') {
      futuresResponse = await fetch(
        `${supabaseUrl}/functions/v1/exchange-portfolio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_balance',
            api_key_id: apiKey.id,
            platform: apiKey.platform,
            market_type: 'futures'
          })
        }
      );
    }
    
    // Fetch open positions from trades table
    const { data: openPositions, error: positionsError } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', apiKey.platform)
      .in('status', ['ACTIVE', 'PENDING']);
    
    if (positionsError) {
      result.warnings.push(`Failed to fetch open positions: ${positionsError.message}`);
    }
    
    // Calculate equity from balances and positions
    const spotBalances = await spotResponse.json();
    const futuresBalances = futuresResponse?.ok ? await futuresResponse.json() : [];
    
    // Calculate total equity
    const spotEquity = calculateSpotEquity(spotBalances.data || []);
    const futuresEquity = calculateFuturesEquity(futuresBalances.data || []);
    const unrealizedPnl = calculateUnrealizedPnlFromPositions(openPositions || []);
    const realizedPnl = await calculateRealizedPnl(supabaseClient, userId);
    
    const totalEquity = spotEquity + futuresEquity + unrealizedPnl;
    
    result.totalEquity = totalEquity;
    result.spotEquity = spotEquity;
    result.futuresEquity = futuresEquity;
    result.unrealizedPnl = unrealizedPnl;
    result.realizedPnl = realizedPnl;
    result.openPositionsCount = openPositions?.length || 0;
    result.success = true;
    
    // Update portfolio state in database
    await updatePortfolioState(
      supabaseClient,
      userId,
      apiKey.id,
      {
        totalEquity,
        spotEquity,
        futuresEquity,
        unrealizedPnl,
        realizedPnl,
        openPositionsCount: openPositions?.length || 0
      }
    );
    
    // Create snapshot if enabled and interval passed
    if (PORTFOLIO_SYNC_CONFIG.ENABLE_SNAPSHOTS) {
      const shouldCreateSnapshot = await shouldCreateSnapshotNow(
        supabaseClient,
        userId,
        'EXCHANGE',
        apiKey.id
      );
      
      if (shouldCreateSnapshot) {
        // Phase X.17: Create EXCHANGE-scoped snapshot for this API key
        await createPortfolioSnapshot(
          supabaseClient,
          userId,
          {
            totalEquity,
            spotEquity,
            futuresEquity,
            unrealizedPnl,
            realizedPnl,
            assetAllocation: calculateAssetAllocation(spotBalances.data || [], futuresBalances.data || []),
            exposure: await calculateExposure(supabaseClient, userId, totalEquity),
            metrics: await calculateMetrics(supabaseClient, userId, totalEquity),
            apiKeyId: apiKey.id,
            platform: apiKey.platform,
            scopeType: 'EXCHANGE'
          }
        );
      }
    }
    
    } catch (error: any) {
      result.errors.push(error.message || 'Unknown error during portfolio sync');
      result.success = false;
      
      // Log error to database for alerting
      try {
        await logSyncError(
          supabaseClient,
          userId,
          apiKey.id,
          apiKey.platform,
          error.message || 'Unknown error'
        );
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }
    }
    
    return result;
  }

/**
 * Helper functions
 */
function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return url;
}

function getSupabaseServiceRoleKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  return key;
}

function calculateSpotEquity(balances: any[]): number {
  // Sum of all spot balances (in USD)
  // Note: In real implementation, convert each balance to USD using current prices
  return balances.reduce((sum, balance) => {
    return sum + (parseFloat(balance.total_balance) || 0);
  }, 0);
}

function calculateFuturesEquity(balances: any[]): number {
  // Sum of all futures balances (in USD)
  return balances.reduce((sum, balance) => {
    return sum + (parseFloat(balance.total_balance) || 0);
  }, 0);
}

function calculateUnrealizedPnlFromPositions(positions: any[]): number {
  return positions.reduce((sum, position) => {
    return sum + (parseFloat(position.unrealized_pnl) || 0);
  }, 0);
}

async function calculateRealizedPnl(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { data, error } = await supabaseClient
    .from('trades')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .not('realized_pnl', 'is', null);
  
  if (error || !data) {
    return 0;
  }
  
  return data.reduce((sum, trade) => {
    return sum + (parseFloat(trade.realized_pnl) || 0);
  }, 0);
}

async function calculateExposure(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  totalEquity: number
): Promise<any> {
  const { data: activeTrades, error } = await supabaseClient
    .from('trades')
    .select('symbol, total_invested, trade_type')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'PENDING']);
  
  if (error || !activeTrades) {
    return { totalUsd: 0, totalPct: 0, perSymbol: {}, byMarket: { spot: 0, futures: 0 } };
  }
  
  const totalExposure = activeTrades.reduce((sum, trade) => {
    return sum + (parseFloat(trade.total_invested) || 0);
  }, 0);
  
  const totalExposurePct = totalEquity > 0 ? (totalExposure / totalEquity) * 100 : 0;
  
  const perSymbol: any = {};
  const byMarket = { spot: 0, futures: 0 };
  
  activeTrades.forEach(trade => {
    if (!perSymbol[trade.symbol]) {
      perSymbol[trade.symbol] = {
        totalUsd: 0,
        spotUsd: 0,
        futuresUsd: 0,
        exposurePct: 0
      };
    }
    
    const exposure = parseFloat(trade.total_invested) || 0;
    perSymbol[trade.symbol].totalUsd += exposure;
    
    if (trade.trade_type === 'spot') {
      perSymbol[trade.symbol].spotUsd += exposure;
      byMarket.spot += exposure;
    } else {
      perSymbol[trade.symbol].futuresUsd += exposure;
      byMarket.futures += exposure;
    }
    
    perSymbol[trade.symbol].exposurePct = totalEquity > 0 
      ? (perSymbol[trade.symbol].totalUsd / totalEquity) * 100 
      : 0;
  });
  
  return {
    totalUsd: totalExposure,
    totalPct: totalExposurePct,
    perSymbol,
    byMarket
  };
}

function calculateAssetAllocation(spotBalances: any[], futuresBalances: any[]): any {
  const allocation: any = {};
  
  spotBalances.forEach(balance => {
    if (parseFloat(balance.total_balance) > 0) {
      allocation[balance.symbol] = {
        balance: parseFloat(balance.total_balance),
        valueUsd: parseFloat(balance.total_balance), // Simplified - should convert to USD
        percentage: 0, // Will be calculated based on total equity
        marketType: 'spot'
      };
    }
  });
  
  futuresBalances.forEach(balance => {
    if (parseFloat(balance.total_balance) > 0) {
      const existing = allocation[balance.symbol];
      if (existing) {
        existing.balance += parseFloat(balance.total_balance);
        existing.valueUsd += parseFloat(balance.total_balance);
      } else {
        allocation[balance.symbol] = {
          balance: parseFloat(balance.total_balance),
          valueUsd: parseFloat(balance.total_balance),
          percentage: 0,
          marketType: 'futures'
        };
      }
    }
  });
  
  return allocation;
}

async function calculateMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  totalEquity: number
): Promise<any> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Daily PnL
  const { data: dailyTrades } = await supabaseClient
    .from('trades')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .gte('closed_at', today.toISOString());
  
  const dailyPnl = dailyTrades?.reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0) || 0;
  const dailyPnlPct = totalEquity > 0 ? (dailyPnl / totalEquity) * 100 : 0;
  
  // Weekly PnL (simplified - last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: weeklyTrades } = await supabaseClient
    .from('trades')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .gte('closed_at', weekAgo.toISOString());
  
  const weeklyPnl = weeklyTrades?.reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0) || 0;
  const weeklyPnlPct = totalEquity > 0 ? (weeklyPnl / totalEquity) * 100 : 0;
  
  // Monthly PnL (simplified - last 30 days)
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const { data: monthlyTrades } = await supabaseClient
    .from('trades')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .gte('closed_at', monthAgo.toISOString());
  
  const monthlyPnl = monthlyTrades?.reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0) || 0;
  const monthlyPnlPct = totalEquity > 0 ? (monthlyPnl / totalEquity) * 100 : 0;
  
  return {
    dailyPnl,
    dailyPnlPct,
    weeklyPnl,
    weeklyPnlPct,
    monthlyPnl,
    monthlyPnlPct,
    realizedPnl: 0, // Will be calculated separately
    unrealizedPnl: 0 // Will be calculated separately
  };
}

/**
 * Update portfolio state in database
 */
async function updatePortfolioState(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  apiKeyId: string,
  state: {
    totalEquity: number;
    spotEquity: number;
    futuresEquity: number;
    unrealizedPnl: number;
    realizedPnl: number;
    openPositionsCount: number;
  }
): Promise<void> {
  // Upsert portfolio state
  const { error } = await supabaseClient
    .from('users_portfolio_state')
    .upsert({
      user_id: userId,
      api_key_id: apiKeyId,
      total_equity: state.totalEquity,
      spot_equity: state.spotEquity,
      futures_equity: state.futuresEquity,
      unrealized_pnl: state.unrealizedPnl,
      realized_pnl: state.realizedPnl,
      open_positions_count: state.openPositionsCount,
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,api_key_id'
    });
  
  if (error) {
    console.error(`Failed to update portfolio state for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if snapshot should be created now
 * Phase X.17 - Check per scope (GLOBAL or EXCHANGE)
 */
async function shouldCreateSnapshotNow(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  scopeType: 'GLOBAL' | 'EXCHANGE' = 'GLOBAL',
  apiKeyId?: string
): Promise<boolean> {
  const query = supabaseClient
    .from('portfolio_snapshots')
    .select('timestamp')
    .eq('user_id', userId)
    .eq('scope_type', scopeType);
  
  if (scopeType === 'EXCHANGE' && apiKeyId) {
    query.eq('api_key_id', apiKeyId);
  }
  
  const { data } = await query
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (!data) {
    return true; // No snapshot exists for this scope, create one
  }
  
  const lastSnapshot = new Date(data.timestamp);
  const now = new Date();
  const minutesSinceLastSnapshot = (now.getTime() - lastSnapshot.getTime()) / (1000 * 60);
  
  return minutesSinceLastSnapshot >= PORTFOLIO_SYNC_CONFIG.SNAPSHOT_INTERVAL_MINUTES;
}

/**
 * Create portfolio snapshot
 * Phase X.17 - Support for scope (GLOBAL or EXCHANGE)
 */
async function createPortfolioSnapshot(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  snapshot: {
    totalEquity: number;
    spotEquity: number;
    futuresEquity: number;
    unrealizedPnl: number;
    realizedPnl: number;
    assetAllocation: any;
    exposure: any;
    metrics: any;
    apiKeyId?: string;
    platform?: string;
    scopeType?: 'GLOBAL' | 'EXCHANGE';
  }
): Promise<void> {
  const { error } = await supabaseClient
    .from('portfolio_snapshots')
    .insert({
      user_id: userId,
      timestamp: new Date().toISOString(),
      total_equity: snapshot.totalEquity,
      spot_equity: snapshot.spotEquity,
      futures_equity: snapshot.futuresEquity,
      unrealized_pnl: snapshot.unrealizedPnl,
      realized_pnl: snapshot.realizedPnl,
      allocation: snapshot.assetAllocation,
      exposure: snapshot.exposure,
      metrics: snapshot.metrics,
      api_key_id: snapshot.apiKeyId ?? null,
      platform: snapshot.platform ?? null,
      scope_type: snapshot.scopeType ?? 'GLOBAL',
      created_at: new Date().toISOString()
    });
  
  if (error) {
    console.error(`Failed to create portfolio snapshot for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Log sync error for alerting
 */
async function logSyncError(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  apiKeyId: string,
  platform: string,
  errorMessage: string
): Promise<void> {
  // Log to order_events table (reusing existing table structure)
  try {
    await supabaseClient
      .from('order_events')
      .insert({
        user_id: userId,
        event_type: 'PORTFOLIO_SYNC_ERROR',
        event_status: 'FAILURE',
        event_data: {
          api_key_id: apiKeyId,
          platform,
          error: errorMessage
        },
        source: 'PORTFOLIO_SYNC_WORKER',
        message: `Portfolio sync failed for ${platform}: ${errorMessage}`,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log sync error:', error);
  }
  
  // If portfolio_alerts table exists, create alert
  try {
    await supabaseClient
      .from('portfolio_alerts')
      .insert({
        user_id: userId,
        alert_type: 'sync_failure',
        severity: 'high',
        title: `Portfolio Sync Failed - ${platform}`,
        message: `Failed to sync portfolio from ${platform}: ${errorMessage}`,
        details: {
          api_key_id: apiKeyId,
          platform,
          error: errorMessage
        },
        acknowledged: false,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Table might not exist, that's okay
    console.debug('portfolio_alerts table not available, skipping alert creation');
  }
}

