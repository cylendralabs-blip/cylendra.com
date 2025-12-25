/**
 * Backtest Runner Utilities
 * 
 * Helper functions for Phase 3 optimizations
 */

/**
 * Create signature hash for backtest config
 * Used for result caching
 */
export async function createBacktestSignature(config: any): Promise<string> {
  // Include botSettings in signature to ensure cache is unique per configuration
  const signatureData = {
    pair: config.pair,
    timeframe: config.timeframe,
    period: config.period,
    strategy: config.strategyPreset || config.botProfile?.strategyId,
    initialCapital: config.initialCapital,
    fees: config.simulationSettings?.fees,
    slippage: config.simulationSettings?.slippage,
    riskMode: config.riskMode,
    // Include key bot settings that affect backtest results
    botSettings: config.botProfile?.botSettings ? {
      risk_percentage: config.botProfile.botSettings.risk_percentage,
      stop_loss_percentage: config.botProfile.botSettings.stop_loss_percentage,
      take_profit_percentage: config.botProfile.botSettings.take_profit_percentage,
      initial_order_percentage: config.botProfile.botSettings.initial_order_percentage,
      dca_levels: config.botProfile.botSettings.dca_levels,
      max_active_trades: config.botProfile.botSettings.max_active_trades,
      leverage: config.botProfile.botSettings.leverage,
      market_type: config.botProfile.botSettings.market_type
    } : null
  };
  
  const jsonString = JSON.stringify(signatureData);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calculate dynamic candle limits per timeframe
 */
export function getMaxCandlesForTimeframe(timeframe: string): number {
  const limits: Record<string, number> = {
    '15m': 12000,  // ~3-4 months
    '1h': 8760,    // 1 year
    '4h': 2190,    // 1 year
    '1D': 1825     // 5 years
  };
  
  return limits[timeframe] || 10000; // Default fallback
}

/**
 * Check rate limits for user
 */
export async function checkRateLimits(
  supabaseClient: any,
  userId: string
): Promise<{ allowed: boolean; reason?: string; dailyCount?: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Count only completed or running backtests today (exclude failed ones for rate limiting)
  const { count, error } = await supabaseClient
    .from('backtest_runs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'running', 'completed'])
    .gte('created_at', today.toISOString());
  
  if (error) {
    console.error('Error checking rate limits:', error);
    // Allow on error (fail open)
    return { allowed: true };
  }
  
  // Increased limit for testing (can be reduced later)
  // Temporarily set to very high limit for development
  const MAX_BACKTESTS_PER_DAY = 100;
  const dailyCount = count || 0;
  
  if (dailyCount >= MAX_BACKTESTS_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit reached. You have used ${dailyCount}/${MAX_BACKTESTS_PER_DAY} backtests today. Please try again tomorrow.`,
      dailyCount
    };
  }
  
  console.log(`✅ Rate limit check: ${dailyCount}/${MAX_BACKTESTS_PER_DAY} backtests used today`);
  return { allowed: true, dailyCount };
}

/**
 * Get cached result if exists
 */
export async function getCachedResult(
  supabaseClient: any,
  signature: string
): Promise<any | null> {
  const { data, error } = await supabaseClient
    .from('backtest_cache')
    .select('result_json, created_at')
    .eq('signature', signature)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.result_json;
}

/**
 * Save result to cache
 */
export async function saveToCache(
  supabaseClient: any,
  signature: string,
  result: any,
  pair: string,
  timeframe: string,
  strategyId: string
): Promise<void> {
  try {
    await supabaseClient
      .from('backtest_cache')
      .upsert({
        signature,
        result_json: result,
        pair,
        timeframe,
        strategy_id: strategyId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }, {
        onConflict: 'signature'
      });
  } catch (error) {
    console.error('Failed to save cache:', error);
    // Don't throw - caching is best effort
  }
}

