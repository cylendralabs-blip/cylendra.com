/**
 * Backtest Runner Edge Function
 * 
 * Server function that receives backtest requests and runs the simulation
 * 
 * Phase 1: Backtest Engine - Task 3
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  createBacktestSignature,
  getMaxCandlesForTimeframe,
  checkRateLimits,
  getCachedResult,
  saveToCache
} from './utils.ts';

// System Constraints (Phase 3: Enhanced)
const ALLOWED_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const ALLOWED_TIMEFRAMES = ['15m', '1h', '4h', '1D'];
const MAX_HISTORICAL_PERIOD_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
const BACKTEST_TIMEOUT_MS = 90000; // 90 seconds (Phase 3: Task 6)

/**
 * CORS headers helper
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

/**
 * Backtest Request
 */
interface BacktestRequest {
  /** Trading pair */
  pair: string;
  
  /** Timeframe */
  timeframe: string;
  
  /** Period (3M / 6M / 1Y) or custom dates */
  period?: '3M' | '6M' | '1Y' | { from: string; to: string };
  
  /** Strategy preset ID or bot profile */
  strategyPreset?: string;
  botProfile?: {
    botSettings: any;
    strategyId?: string;
    exchange?: 'binance' | 'okx';
    marketType?: 'spot' | 'futures';
  };
  
  /** Initial capital */
  initialCapital?: number;
  
  /** Simulation settings */
  simulationSettings?: {
    fees?: { makerPct: number; takerPct: number };
    slippage?: { enabled: boolean; maxPct: number };
  };
}

/**
 * Backtest Response
 */
interface BacktestResponse {
  run_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  summary?: any;
  error?: string;
}

/**
 * Calculate period dates from period string
 */
function calculatePeriodDates(period: '3M' | '6M' | '1Y'): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  
  switch (period) {
    case '3M':
      from.setMonth(from.getMonth() - 3);
      break;
    case '6M':
      from.setMonth(from.getMonth() - 6);
      break;
    case '1Y':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  
  return { from, to };
}

/**
 * Validate backtest request
 */
function validateRequest(req: BacktestRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate pair
  if (!req.pair || !ALLOWED_PAIRS.includes(req.pair.toUpperCase())) {
    errors.push(`Pair must be one of: ${ALLOWED_PAIRS.join(', ')}`);
  }
  
  // Validate timeframe
  if (!req.timeframe || !ALLOWED_TIMEFRAMES.includes(req.timeframe)) {
    errors.push(`Timeframe must be one of: ${ALLOWED_TIMEFRAMES.join(', ')}`);
  }
  
  // Validate period
  if (!req.period) {
    errors.push('Period is required');
  } else if (typeof req.period === 'object') {
    const from = new Date(req.period.from);
    const to = new Date(req.period.to);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      errors.push('Invalid period dates');
    } else if (from >= to) {
      errors.push('Period from must be before period to');
    } else if (to.getTime() - from.getTime() > MAX_HISTORICAL_PERIOD_MS) {
      errors.push('Period cannot exceed 1 year');
    }
  }
  
  // Validate strategy
  if (!req.strategyPreset && !req.botProfile) {
    errors.push('Either strategyPreset or botProfile must be provided');
  }
  
  // Validate initial capital
  if (req.initialCapital !== undefined && req.initialCapital <= 0) {
    errors.push('Initial capital must be greater than 0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if user has active backtest
 */
async function checkActiveBacktest(
  supabaseClient: any,
  userId: string
): Promise<{ hasActive: boolean; runId?: string }> {
  // First, clean up stale backtests (older than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await supabaseClient
    .from('backtest_runs')
    .update({ status: 'failed', error: 'Timeout - stale backtest' })
    .eq('user_id', userId)
    .in('status', ['pending', 'running'])
    .lt('created_at', fiveMinutesAgo);
  
  // Check for active backtests
  const { data, error } = await supabaseClient
    .from('backtest_runs')
    .select('id, created_at, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking active backtest:', error);
    // Allow on error (fail open)
    return { hasActive: false };
  }
  
  if (data) {
    console.log(`⚠️ Active backtest found: ${data.id}, status: ${data.status}, created: ${data.created_at}`);
  }
  
  return {
    hasActive: !!data,
    runId: data?.id
  };
}

/**
 * Estimate number of candles
 */
function estimateCandles(
  from: Date,
  to: Date,
  timeframe: string
): number {
  const timeframeMs: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000
  };
  
  const tfMs = timeframeMs[timeframe] || 60 * 60 * 1000;
  const periodMs = to.getTime() - from.getTime();
  const estimatedCandles = Math.ceil(periodMs / tfMs);
  
  return estimatedCandles;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: corsHeaders
        }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: corsHeaders
        }
      );
    }
    
    // Parse request body
    const request: BacktestRequest = await req.json();
    
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', errors: validation.errors }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }
    
    // Check for active backtest (TASK 5: Only one active backtest per user)
    const activeCheck = await checkActiveBacktest(supabaseClient, user.id);
    if (activeCheck.hasActive) {
      return new Response(
        JSON.stringify({ 
          error: 'Backtest already running. Please wait.',
          runId: activeCheck.runId
        }),
        { 
          status: 429, 
          headers: corsHeaders
        }
      );
    }
    
    // Calculate period dates
    let periodFrom: Date;
    let periodTo: Date;
    
    if (typeof request.period === 'object') {
      periodFrom = new Date(request.period.from);
      periodTo = new Date(request.period.to);
    } else {
      const dates = calculatePeriodDates(request.period);
      periodFrom = dates.from;
      periodTo = dates.to;
    }
    
    // Phase 3: Task 4 - Check rate limits
    const rateLimitCheck = await checkRateLimits(supabaseClient, user.id);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: rateLimitCheck.reason || 'Rate limit exceeded',
          dailyCount: rateLimitCheck.dailyCount
        }),
        { status: 429, headers: corsHeaders }
      );
    }
    
    // Phase 3: Task 5 - Dynamic candle limits per timeframe
    const maxCandles = getMaxCandlesForTimeframe(request.timeframe);
    const estimatedCandles = estimateCandles(periodFrom, periodTo, request.timeframe);
    if (estimatedCandles > maxCandles) {
      return new Response(
        JSON.stringify({ 
          error: `Time range too large for the selected timeframe. Estimated candles (${estimatedCandles}) exceeds maximum (${maxCandles})`
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Phase 3: Task 3 - Check cache before running
    // Temporarily disable cache for botProfile to ensure fresh results
    // TODO: Re-enable cache after fixing signature to include all botSettings
    const useCache = !request.botProfile; // Only cache preset strategies for now
    
    let cachedResult = null;
    let signature = '';
    
    if (useCache) {
      signature = await createBacktestSignature({
        pair: request.pair,
        timeframe: request.timeframe,
        period: request.period,
        strategyPreset: request.strategyPreset,
        botProfile: request.botProfile,
        initialCapital: request.initialCapital,
        simulationSettings: request.simulationSettings,
        riskMode: request.botProfile?.botSettings?.risk_model
      });
      cachedResult = await getCachedResult(supabaseClient, signature);
    }
    
    if (cachedResult) {
      console.log(`✅ Cache hit for signature: ${signature.substring(0, 8)}...`);
      
      // Create run record with cached result
      const { data: cachedRun, error: cacheRunError } = await supabaseClient
        .from('backtest_runs')
        .insert({
          user_id: user.id,
          strategy_id: request.botProfile?.strategyId || request.strategyPreset || 'main-strategy',
          pair: request.pair.toUpperCase(),
          timeframe: request.timeframe,
          period_from: periodFrom.toISOString(),
          period_to: periodTo.toISOString(),
          status: 'completed',
          summary: cachedResult.summary || cachedResult,
          execution_time_ms: 0, // Cached - instant
          metadata: {
            cached: true,
            cache_signature: signature,
            initialCapital: request.initialCapital || 10000,
            simulationSettings: request.simulationSettings
          }
        })
        .select()
        .single();
      
      if (!cacheRunError && cachedRun) {
        return new Response(
          JSON.stringify({
            run_id: cachedRun.id,
            status: 'completed',
            summary: cachedResult.summary || cachedResult,
            cached: true
          } as BacktestResponse & { cached?: boolean }),
          { status: 200, headers: corsHeaders }
        );
      }
    }
    
    console.log(`🔄 Cache miss - running new backtest. Signature: ${signature.substring(0, 8)}...`);
    
    // Create backtest run record (status: pending)
    const { data: runRecord, error: createError } = await supabaseClient
      .from('backtest_runs')
      .insert({
        user_id: user.id,
        strategy_id: request.botProfile?.strategyId || request.strategyPreset || 'main-strategy',
        pair: request.pair.toUpperCase(),
        timeframe: request.timeframe,
        period_from: periodFrom.toISOString(),
        period_to: periodTo.toISOString(),
        status: 'pending',
        metadata: {
          initialCapital: request.initialCapital || 10000,
          simulationSettings: request.simulationSettings
        }
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    // Update status to running
    await supabaseClient
      .from('backtest_runs')
      .update({ status: 'running' })
      .eq('id', runRecord.id);
    
    // Phase 3: Task 6 - Run backtest with timeout protection (90 seconds)
    const startTime = Date.now();
    let backtestResult: any;
    let backtestError: Error | null = null;
    
    // Phase 3: Task 8 - Logging
    console.log(`🚀 Starting backtest for user ${user.id}:`, {
      pair: request.pair,
      timeframe: request.timeframe,
      period: `${periodFrom.toISOString()} to ${periodTo.toISOString()}`,
      estimatedCandles
    });
    
    try {
      // Phase 3: Task 6 - Timeout protection with Promise.race
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Backtest execution timeout. Please reduce period or use higher timeframe.'));
        }, BACKTEST_TIMEOUT_MS);
      });
      
      const backtestPromise = (async () => {
      // Import backtest engine
      const { runBacktestEngine } = await import('./backtestEngine.ts');
      
      // Adapt bot profile to backtest config
      const botSettings = request.botProfile?.botSettings || {};
      const exchange = request.botProfile?.exchange || 'binance';
      const marketType = request.botProfile?.marketType || 'spot';
      
      // Log bot settings for debugging
      console.log('🤖 Bot Profile Settings:', {
        hasBotSettings: !!botSettings,
        botSettingsKeys: Object.keys(botSettings || {}),
        risk_percentage: botSettings?.risk_percentage,
        stop_loss_percentage: botSettings?.stop_loss_percentage,
        take_profit_percentage: botSettings?.take_profit_percentage,
        initial_order_percentage: botSettings?.initial_order_percentage,
        dca_levels: botSettings?.dca_levels,
        exchange,
        marketType
      });
      
      // Get fees based on exchange or from simulation settings
      const fees = request.simulationSettings?.fees || (exchange === 'okx' 
        ? { makerPct: 0.08, takerPct: 0.1 }
        : { makerPct: 0.1, takerPct: 0.1 });
      
      // Slippage configuration
      const slippage = request.simulationSettings?.slippage || {
        enabled: false,
        maxPct: 0.1
      };
      
        // Run backtest engine
        return await runBacktestEngine({
          pair: request.pair.toUpperCase(),
          timeframe: request.timeframe,
          periodFrom: periodFrom.getTime(),
          periodTo: periodTo.getTime(),
          exchange,
          marketType,
          initialCapital: request.initialCapital || 10000,
          botSettings: botSettings || {}, // Ensure it's always an object
          fees,
          slippage,
          strategyId: request.botProfile?.strategyId || request.strategyPreset || 'main-strategy'
        });
      })();
      
      backtestResult = await Promise.race([backtestPromise, timeoutPromise]) as any;
      
    } catch (error: any) {
      backtestError = error;
      console.error('❌ Backtest engine error:', error);
      
      // Phase 3: Task 7 - Automatic failure recovery
      await supabaseClient
        .from('backtest_runs')
        .update({
          status: 'failed',
          error: error.message || 'Unknown error',
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', runRecord.id);
      
      return new Response(
        JSON.stringify({
          run_id: runRecord.id,
          status: 'failed',
          error: error.message || 'Backtest execution failed'
        } as BacktestResponse),
        { status: 200, headers: corsHeaders }
      );
    }
    
    const executionTimeMs = Date.now() - startTime;
    console.log(`✅ Backtest completed in ${executionTimeMs}ms`);
    
    // Save results
    if (backtestError) {
      await supabaseClient
        .from('backtest_runs')
        .update({
          status: 'failed',
          error: backtestError.message,
          execution_time_ms: executionTimeMs
        })
        .eq('id', runRecord.id);
      
      return new Response(
        JSON.stringify({
          run_id: runRecord.id,
          status: 'failed',
          error: backtestError.message
        } as BacktestResponse),
        { status: 200, headers: corsHeaders }
      );
    }
    
    // Phase 3: Task 3 - Save successful result and cache it
    // Calculate additional metrics from trades
    const winningTrades = backtestResult.trades.filter((t: any) => t.pnlUsd > 0);
    const losingTrades = backtestResult.trades.filter((t: any) => t.pnlUsd <= 0);
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum: number, t: any) => sum + t.pnlUsd, 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum: number, t: any) => sum + Math.abs(t.pnlUsd), 0) / losingTrades.length 
      : 0;
    const totalWins = winningTrades.reduce((sum: number, t: any) => sum + t.pnlUsd, 0);
    const totalLosses = losingTrades.reduce((sum: number, t: any) => sum + Math.abs(t.pnlUsd), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calculate streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (const trade of backtestResult.trades) {
      if (trade.pnlUsd > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (trade.pnlUsd < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }
    
    const expectancy = backtestResult.numTrades > 0 
      ? backtestResult.totalPnL / backtestResult.numTrades 
      : 0;
    
    const summary = {
      totalPnL: backtestResult.totalPnL,
      totalReturnPct: backtestResult.totalReturnPct,
      maxDrawdown: backtestResult.maxDrawdown,
      winrate: backtestResult.winrate,
      numTrades: backtestResult.numTrades,
      avgWin,
      avgLoss,
      profitFactor,
      maxWinStreak,
      maxLossStreak,
      expectancy,
      stats: backtestResult.stats
    };
    
    await supabaseClient
      .from('backtest_runs')
      .update({
        status: 'completed',
        summary,
        execution_time_ms: executionTimeMs,
        metadata: {
          ...runRecord.metadata,
          ...backtestResult.metadata,
          cache_signature: signature
        }
      })
      .eq('id', runRecord.id);
    
    // Save to cache for future use
    await saveToCache(
      supabaseClient,
      signature,
      summary,
      request.pair.toUpperCase(),
      request.timeframe,
      request.botProfile?.strategyId || request.strategyPreset || 'main-strategy'
    );
    
    // Phase 3: Task 7 - Save trades (with error handling)
    if (backtestResult.trades && backtestResult.trades.length > 0) {
      const tradesToInsert = backtestResult.trades.map((trade: any) => ({
        backtest_run_id: runRecord.id,
        symbol: trade.symbol,
        side: trade.side || 'buy',
        entry_time: trade.entryTime,
        entry_price: trade.entryPrice,
        entry_qty: trade.entryQty,
        entry_fee: trade.entryFee || 0,
        exit_time: trade.exitTime || null,
        exit_price: trade.exitPrice || null,
        exit_qty: trade.exitQty || trade.entryQty || null,
        exit_fee: trade.exitFee || 0,
        pnl_usd: trade.pnlUsd || 0,
        pnl_pct: trade.pnlPct || 0,
        exit_reason: trade.exitReason || null,
        status: (trade.status && ['open', 'closed', 'partial'].includes(trade.status)) ? trade.status : 'closed',
        duration: trade.duration || (trade.exitTime && trade.entryTime ? trade.exitTime - trade.entryTime : null),
        metadata: trade.metadata || {}
      }));
      
      try {
        await supabaseClient
          .from('backtest_trades')
          .insert(tradesToInsert);
        console.log(`✅ Saved ${tradesToInsert.length} trades`);
      } catch (tradeError) {
        console.error('⚠️ Failed to save trades (non-critical):', tradeError);
        // Don't fail the entire backtest if trades can't be saved
      }
    }
    
    // Return response
    return new Response(
      JSON.stringify({
        run_id: runRecord.id,
        status: 'completed',
        summary: {
          totalPnL: backtestResult.totalPnL,
          totalReturnPct: backtestResult.totalReturnPct,
          maxDrawdown: backtestResult.maxDrawdown,
          winrate: backtestResult.winrate,
          numTrades: backtestResult.numTrades,
          stats: backtestResult.stats
        }
      } as BacktestResponse),
      {
        status: 200,
        headers: corsHeaders
      }
    );
    
  } catch (error: any) {
    console.error('Backtest runner error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

