/**
 * Auto-Trader Worker
 * 
 * Scheduled Edge Function that processes pending signals
 * and executes trades automatically
 * 
 * Phase 3: Auto-Trading Trigger
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseClient } from '../_shared/utils.ts';
import { createLogger } from '../_shared/logger.ts';
import { WORKER_CONFIG } from './config.ts';
import { requireFeature } from '../_shared/planGuard.ts';
import { performTradeGuards } from '../_shared/tradeGuards.ts';
import {
  fetchPendingSignals,
  updateSignalStatus,
  getUserBotSettings,
  getUserApiKeys,
  getActiveTradesCount,
  getLastTradeTime,
  checkDuplicateTrade,
  evaluateRisk
} from './signalProcessor.ts';
import { executeTrade } from './executionService.ts';
import { getNextSignalForBot, convertToProcessingSignal, type UnifiedSignal } from './signalRouter.ts';
import { getCopyStrategyForBot, handleMasterTradeExecution } from './copyRouter.ts';
import {
  createAutoTrade,
  updateAutoTrade,
  addAutoTradeLog,
  normalizeSignalSource,
  getDirectionFromSignal
} from './autoTradeLogger.ts';

// Type definitions (inlined for Deno Edge Function)
type ExecutionStatus = 'PENDING' | 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED';

interface ProcessingSignal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  entry_price: number;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  confidence_score: number;
  strategy_name: string;
  timeframe: string;
  created_at: string;
  execution_status?: ExecutionStatus;
  execution_reason?: string | null;
}

interface FilterResult {
  passed: boolean;
  reason?: string;
  code?: string;
}

interface FilterContext {
  signal: ProcessingSignal;
  botSettings: {
    is_active: boolean;
    market_type: 'spot' | 'futures';
    max_active_trades: number;
    allow_long_trades: boolean;
    allow_short_trades: boolean;
    default_platform?: string | null;
    total_capital?: number | null;
    // Phase X: Auto Trading from Signals
    auto_trading_enabled?: boolean;
    auto_trading_mode?: 'off' | 'full_auto' | 'semi_auto';
    allowed_signal_sources?: string[];
    min_signal_confidence?: number | null;
    allowed_directions?: string[];
    max_auto_trades_per_day?: number | null;
    max_concurrent_auto_positions?: number | null;
  };
  activeTradesCount: number;
  exchangeHealth: boolean;
  lastTradeTime?: Date;
  allowedSymbols?: string[];
  blacklistSymbols?: string[];
  // Phase X: Additional context for auto trading
  autoTradesToday?: number;
  autoConcurrentPositions?: number;
  signalSource?: string;
}

// Simplified filter function (inlined for Deno)
function applyAllFilters(
  context: FilterContext,
  options: { cooldownMinutes?: number; minConfidence?: number } = {}
): FilterResult {
  const { signal, botSettings, activeTradesCount, exchangeHealth } = context;
  
  // Phase X: Auto Trading enabled check (must be first)
  if (botSettings.auto_trading_enabled === false || botSettings.auto_trading_mode === 'off') {
    return { 
      passed: false, 
      reason: 'Auto trading is disabled or set to off mode', 
      code: 'AUTO_TRADING_DISABLED' 
    };
  }
  
  // Bot enabled check
  if (!botSettings.is_active) {
    return { passed: false, reason: 'Bot is not active', code: 'BOT_DISABLED' };
  }
  
  // Phase X: Signal source filter
  if (botSettings.allowed_signal_sources && botSettings.allowed_signal_sources.length > 0) {
    const signalSource = context.signalSource || 'legacy';
    const normalizedSource = signalSource === 'ai' ? 'ai_ultra' : 
                            signalSource === 'realtime_ai' ? 'ai_realtime' :
                            signalSource === 'tradingview' ? 'tradingview' : 'legacy';
    
    if (!botSettings.allowed_signal_sources.includes(normalizedSource)) {
      return { 
        passed: false, 
        reason: `Signal source '${signalSource}' is not in allowed sources`, 
        code: 'SOURCE_NOT_ALLOWED' 
      };
    }
  }
  
  // Phase X: Direction filter (from auto trading settings)
  const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
  const direction = isBuy ? 'long' : 'short';
  
  if (botSettings.allowed_directions && botSettings.allowed_directions.length > 0) {
    if (!botSettings.allowed_directions.includes(direction)) {
      return { 
        passed: false, 
        reason: `${direction.toUpperCase()} trades are not allowed in auto trading settings`, 
        code: 'DIRECTION_NOT_ALLOWED' 
      };
    }
  }
  
  // Legacy direction check (for backward compatibility)
  if (isBuy && !botSettings.allow_long_trades) {
    return { passed: false, reason: 'Long trades are not allowed', code: 'LONG_TRADES_DISABLED' };
  }
  if (!isBuy && !botSettings.allow_short_trades) {
    return { passed: false, reason: 'Short trades are not allowed', code: 'SHORT_TRADES_DISABLED' };
  }
  
  // Phase X: Min signal confidence filter
  if (botSettings.min_signal_confidence !== null && botSettings.min_signal_confidence !== undefined) {
    if (signal.confidence_score < botSettings.min_signal_confidence) {
      return { 
        passed: false, 
        reason: `Confidence score (${signal.confidence_score}) below minimum (${botSettings.min_signal_confidence})`, 
        code: 'LOW_CONFIDENCE' 
      };
    }
  } else {
    // Fallback to default min confidence
    const minConfidence = options.minConfidence || 70;
    if (signal.confidence_score < minConfidence) {
      return { 
        passed: false, 
        reason: `Confidence score (${signal.confidence_score}) below minimum (${minConfidence})`, 
        code: 'LOW_CONFIDENCE' 
      };
    }
  }
  
  // Phase X: Max auto trades per day limit
  if (botSettings.max_auto_trades_per_day !== null && botSettings.max_auto_trades_per_day !== undefined) {
    const autoTradesToday = context.autoTradesToday || 0;
    if (autoTradesToday >= botSettings.max_auto_trades_per_day) {
      return { 
        passed: false, 
        reason: `Maximum auto trades per day limit reached (${autoTradesToday}/${botSettings.max_auto_trades_per_day})`, 
        code: 'MAX_AUTO_TRADES_PER_DAY' 
      };
    }
  }
  
  // Phase X: Max concurrent auto positions limit
  if (botSettings.max_concurrent_auto_positions !== null && botSettings.max_concurrent_auto_positions !== undefined) {
    const autoConcurrent = context.autoConcurrentPositions || 0;
    if (autoConcurrent >= botSettings.max_concurrent_auto_positions) {
      return { 
        passed: false, 
        reason: `Maximum concurrent auto positions limit reached (${autoConcurrent}/${botSettings.max_concurrent_auto_positions})`, 
        code: 'MAX_CONCURRENT_AUTO_POSITIONS' 
      };
    }
  }
  
  // Max concurrent trades (general limit)
  if (activeTradesCount >= botSettings.max_active_trades) {
    return { 
      passed: false, 
      reason: `Maximum active trades limit reached (${activeTradesCount}/${botSettings.max_active_trades})`, 
      code: 'MAX_TRADES_REACHED' 
    };
  }
  
  // Exchange health check
  if (!exchangeHealth) {
    return { passed: false, reason: 'Exchange health check failed', code: 'EXCHANGE_UNHEALTHY' };
  }
  
  // Cooldown check
  if (context.lastTradeTime && options.cooldownMinutes) {
    const cooldownMs = options.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrade = Date.now() - context.lastTradeTime.getTime();
    if (timeSinceLastTrade < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastTrade) / 60000);
      return { 
        passed: false, 
        reason: `Cooldown period active. Please wait ${remainingMinutes} more minutes`, 
        code: 'COOLDOWN_ACTIVE' 
      };
    }
  }
  
  return { passed: true };
}

interface BotSettingsForm {
  is_active: boolean;
  market_type: 'spot' | 'futures';
  total_capital: number;
  risk_percentage: number;
  initial_order_percentage: number;
  max_active_trades: number;
  dca_levels: number;
  take_profit_percentage: number;
  stop_loss_percentage: number;
  leverage: number;
  default_platform?: string;
  allow_long_trades?: boolean;
  allow_short_trades?: boolean;
  // Phase X: Auto Trading from Signals
  auto_trading_enabled?: boolean;
  auto_trading_mode?: 'off' | 'full_auto' | 'semi_auto';
  allowed_signal_sources?: string[];
  min_signal_confidence?: number | null;
  allowed_directions?: string[];
  max_auto_trades_per_day?: number | null;
  max_concurrent_auto_positions?: number | null;
  [key: string]: any;
}

const logger = createLogger('auto-trader-worker');

/**
 * Log signal execution attempt
 */
async function logSignalExecution(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  signalId: string,
  signalSource: 'ai' | 'tradingview' | 'legacy',
  signal: ProcessingSignal,
  status: 'PENDING' | 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED',
  reason?: string,
  tradeId?: string,
  errorMessage?: string,
  riskFlags?: string[]
): Promise<void> {
  try {
    await supabaseClient
      .from('bot_signal_executions')
      .insert({
        user_id: userId,
        signal_id: signalId,
        signal_source: signalSource,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        side: signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY' ? 'BUY' : 'SELL',
        confidence: signal.confidence_score,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss_price,
        take_profit: signal.take_profit_price,
        execution_status: status,
        execution_reason: reason,
        trade_id: tradeId,
        error_message: errorMessage,
        risk_flags: riskFlags
      });
  } catch (error) {
    // Don't fail the main process if logging fails
    console.error('Error logging signal execution:', error);
  }
}

/**
 * Process a single signal
 */
async function processSignal(
  signal: ProcessingSignal,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ success: boolean; reason?: string; tradeId?: string; autoTradeId?: string }> {
  // Phase Y: Determine signal source and create auto_trade record at the start
  // Determine signal source from signal metadata or default to 'ai'
  const rawSignalSource = (signal as any).source || 
    (signal.strategy_name?.includes('AI') ? 'ai' : 
     signal.strategy_name?.includes('TradingView') ? 'tradingview' : 'legacy');
  const signalSource = normalizeSignalSource(rawSignalSource);
  const direction = getDirectionFromSignal(signal);
  let autoTradeId: string | null = null;
  
  try {
    logger.info(`Processing signal ${signal.id} for user ${signal.user_id}...`);
    
    // Create auto_trade record
    autoTradeId = await createAutoTrade(supabaseClient, {
      userId: signal.user_id,
      signalId: signal.id,
      signalSource,
      pair: signal.symbol,
      direction,
      status: 'pending',
      metadata: {
        signal_type: signal.signal_type,
        entry_price: signal.entry_price,
        stop_loss_price: signal.stop_loss_price,
        take_profit_price: signal.take_profit_price,
        confidence_score: signal.confidence_score,
        strategy_name: signal.strategy_name,
        timeframe: signal.timeframe,
        created_at: signal.created_at
      }
    });
    
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'signal_received',
        `Signal received: ${signal.symbol} ${signal.signal_type} @ ${signal.entry_price}`,
        {
          signal_id: signal.id,
          signal_type: signal.signal_type,
          entry_price: signal.entry_price,
          confidence_score: signal.confidence_score
        }
      );
    }
    
    // Phase Admin B: Check trade guards (Kill Switch, User Trading Status)
    const guardsCheck = await performTradeGuards(supabaseClient, signal.user_id, 'auto_trading');
    if (!guardsCheck.allowed) {
      logger.warn('Signal processing blocked by guards', {
        signalId: signal.id,
        userId: signal.user_id,
        reason: guardsCheck.reason,
      });
      
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'rejected',
          reasonCode: 'TRADING_DISABLED'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'rejected',
          guardsCheck.reason || 'Trading disabled',
          { reason: guardsCheck.reason }
        );
      }
      
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        'ai',
        signal,
        'FILTERED',
        guardsCheck.reason || 'Trading disabled',
        undefined,
        undefined,
        ['TRADING_DISABLED']
      );
      return {
        success: false,
        reason: guardsCheck.reason || 'Trading is currently disabled',
        autoTradeId: autoTradeId || undefined
      };
    }
    
    // Phase X.10: Check bot feature access
    try {
      await requireFeature(supabaseClient, signal.user_id, 'bots.enabled', 'Auto-trading bots require BASIC plan or higher');
    } catch (error) {
      logger.warn(`User ${signal.user_id} attempted to use bots without permission`);
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FILTERED',
        'Auto-trading bots require BASIC plan or higher'
      );
      return { success: false, reason: 'Auto-trading bots require BASIC plan or higher' };
    }

    // Get user bot settings
    const botSettingsRaw = await getUserBotSettings(supabaseClient, signal.user_id);
    if (!botSettingsRaw) {
      logger.warn(`No bot settings found for user ${signal.user_id}`);
      return { success: false, reason: 'No bot settings found' };
    }
    
    // Convert bot settings to BotSettingsForm
    const botSettings: BotSettingsForm = {
      is_active: botSettingsRaw.is_active || false,
      bot_name: botSettingsRaw.bot_name || 'SmartTraderBot',
      default_platform: botSettingsRaw.default_platform || '',
      market_type: botSettingsRaw.market_type || 'spot',
      strategy_type: botSettingsRaw.strategy_type || 'basic_dca',
      total_capital: Number(botSettingsRaw.total_capital) || 1000,
      risk_percentage: Number(botSettingsRaw.risk_percentage) || 2.0,
      initial_order_percentage: Number(botSettingsRaw.initial_order_percentage) || 25.0,
      max_active_trades: botSettingsRaw.max_active_trades || 5,
      dca_levels: botSettingsRaw.dca_levels || 5,
      take_profit_percentage: Number(botSettingsRaw.take_profit_percentage) || 3.0,
      stop_loss_percentage: Number(botSettingsRaw.stop_loss_percentage) || 5.0,
      stop_loss_calculation_method: botSettingsRaw.stop_loss_calculation_method || 'initial_entry',
      risk_reward_ratio: Number(botSettingsRaw.risk_reward_ratio) || 2.0,
      leverage: botSettingsRaw.leverage || 1,
      leverage_strategy: botSettingsRaw.leverage_strategy || 'none',
      auto_leverage: botSettingsRaw.auto_leverage || false,
      max_leverage_increase: botSettingsRaw.max_leverage_increase || 1,
      profit_taking_strategy: botSettingsRaw.profit_taking_strategy || 'fixed',
      order_type: botSettingsRaw.order_type || 'market',
      default_trade_direction: botSettingsRaw.default_trade_direction || 'both',
      allow_short_trades: botSettingsRaw.allow_short_trades !== false,
      allow_long_trades: botSettingsRaw.allow_long_trades !== false,
      partial_tp_level_1: Number(botSettingsRaw.partial_tp_level_1) || 25.0,
      partial_tp_level_2: Number(botSettingsRaw.partial_tp_level_2) || 50.0,
      partial_tp_level_3: Number(botSettingsRaw.partial_tp_level_3) || 75.0,
      partial_tp_level_4: Number(botSettingsRaw.partial_tp_level_4) || 100.0,
      partial_tp_percentage_1: Number(botSettingsRaw.partial_tp_percentage_1) || 25.0,
      partial_tp_percentage_2: Number(botSettingsRaw.partial_tp_percentage_2) || 25.0,
      partial_tp_percentage_3: Number(botSettingsRaw.partial_tp_percentage_3) || 25.0,
      partial_tp_percentage_4: Number(botSettingsRaw.partial_tp_percentage_4) || 25.0,
      trailing_stop_distance: Number(botSettingsRaw.trailing_stop_distance) || 1.0,
      trailing_stop_activation: Number(botSettingsRaw.trailing_stop_activation) || 5.0,
      capital_protection_enabled: botSettingsRaw.capital_protection_enabled || false,
      capital_protection_profit: Number(botSettingsRaw.capital_protection_profit) || 5.0,
      auto_reentry_enabled: botSettingsRaw.auto_reentry_enabled || false,
      dynamic_tp_enabled: botSettingsRaw.dynamic_tp_enabled || false,
      min_profit_threshold: Number(botSettingsRaw.min_profit_threshold) || 2.0,
      // Phase X: Auto Trading from Signals
      auto_trading_enabled: botSettingsRaw.auto_trading_enabled ?? false,
      auto_trading_mode: (botSettingsRaw.auto_trading_mode as 'off' | 'full_auto' | 'semi_auto') || 'off',
      allowed_signal_sources: (botSettingsRaw.allowed_signal_sources as string[]) || [],
      min_signal_confidence: botSettingsRaw.min_signal_confidence !== null && botSettingsRaw.min_signal_confidence !== undefined 
        ? Number(botSettingsRaw.min_signal_confidence) 
        : null,
      allowed_directions: (botSettingsRaw.allowed_directions as string[]) || [],
      max_auto_trades_per_day: botSettingsRaw.max_auto_trades_per_day !== null && botSettingsRaw.max_auto_trades_per_day !== undefined
        ? Number(botSettingsRaw.max_auto_trades_per_day)
        : null,
      max_concurrent_auto_positions: botSettingsRaw.max_concurrent_auto_positions !== null && botSettingsRaw.max_concurrent_auto_positions !== undefined
        ? Number(botSettingsRaw.max_concurrent_auto_positions)
        : null
    };
    
    // Get active trades count
    const activeTradesCount = await getActiveTradesCount(supabaseClient, signal.user_id);
    
    // Get last trade time for cooldown check
    const lastTradeTime = await getLastTradeTime(supabaseClient, signal.user_id, signal.symbol);
    
    // Build filter context
    const filterContext: FilterContext = {
      signal,
      botSettings: {
        is_active: botSettings.is_active,
      market_type: botSettings.market_type,
      max_active_trades: botSettings.max_active_trades,
      allow_long_trades: botSettings.allow_long_trades ?? true,
      allow_short_trades: botSettings.allow_short_trades ?? true,
        default_platform: botSettings.default_platform,
        total_capital: botSettings.total_capital
      },
      activeTradesCount,
      exchangeHealth: true, // TODO: Implement exchange health check
      lastTradeTime: lastTradeTime || undefined
    };
    
    // Phase X.10: Check futures feature if market_type is futures
    if (botSettings.market_type === 'futures') {
      try {
        await requireFeature(supabaseClient, signal.user_id, 'bots.futures', 'Futures trading requires PREMIUM plan or higher');
      } catch (error) {
        logger.warn(`User ${signal.user_id} attempted to use futures without permission`);
        await updateSignalStatus(
          supabaseClient,
          signal.id,
          'FILTERED',
          'Futures trading requires PREMIUM plan or higher'
        );
        return { success: false, reason: 'Futures trading requires PREMIUM plan or higher' };
      }
    }
    
    // Phase X.11: Check forecast if signal source is AI
    if (signalSource === 'ai' && signal.id) {
      try {
        // Try to get forecast for this signal
        const forecastUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/signal-forecaster`;
        const forecastResponse = await fetch(`${forecastUrl}?signal_id=${signal.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          }
        });

        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          const forecast = forecastData.forecast;

          if (forecast) {
            // Apply forecast-based filtering
            if (forecast.forecast_label === 'LOW' && forecast.success_probability < 40) {
              logger.info(`Signal ${signal.id} filtered by forecast: LOW probability (${forecast.success_probability}%)`);
              await updateSignalStatus(
                supabaseClient,
                signal.id,
                'FILTERED',
                `Forecast indicates LOW success probability (${forecast.success_probability}%)`
              );
              return { success: false, reason: 'Forecast indicates LOW success probability' };
            }

            // Log forecast info
            logger.info(`Signal ${signal.id} forecast: ${forecast.forecast_label} (${forecast.success_probability}% success, ${forecast.expected_return_pct}% expected return)`);
          }
        }
      } catch (forecastError) {
        logger.warn(`Error fetching forecast for signal ${signal.id}:`, forecastError);
        // Continue without forecast - don't block execution
      }
    }

    // Phase Y: Add signalSource to filterContext
    filterContext.signalSource = signalSource;
    
    // Phase Y: Get auto trading stats for limits check
    if (botSettings.auto_trading_enabled && botSettings.auto_trading_mode !== 'off') {
      try {
        const { data: autoTradesTodayData } = await supabaseClient
          .rpc('get_auto_trades_count_today', { p_user_id: signal.user_id })
          .single();
        filterContext.autoTradesToday = autoTradesTodayData || 0;
        
        const { data: autoConcurrentData } = await supabaseClient
          .rpc('get_concurrent_auto_positions', { p_user_id: signal.user_id })
          .single();
        filterContext.autoConcurrentPositions = autoConcurrentData || 0;
      } catch (error) {
        logger.warn('Error fetching auto trading stats:', error);
        filterContext.autoTradesToday = 0;
        filterContext.autoConcurrentPositions = 0;
      }
    }
    
    // Phase Y: Add auto trading settings to filterContext
    filterContext.botSettings.auto_trading_enabled = botSettings.auto_trading_enabled;
    filterContext.botSettings.auto_trading_mode = botSettings.auto_trading_mode;
    filterContext.botSettings.allowed_signal_sources = botSettings.allowed_signal_sources;
    filterContext.botSettings.min_signal_confidence = botSettings.min_signal_confidence;
    filterContext.botSettings.allowed_directions = botSettings.allowed_directions;
    filterContext.botSettings.max_auto_trades_per_day = botSettings.max_auto_trades_per_day;
    filterContext.botSettings.max_concurrent_auto_positions = botSettings.max_concurrent_auto_positions;
    
    // Apply filters
    const filterResult = applyAllFilters(filterContext, {
      cooldownMinutes: WORKER_CONFIG.SYMBOL_COOLDOWN_MINUTES,
      minConfidence: WORKER_CONFIG.DEFAULT_MIN_CONFIDENCE
    });
    
    // Phase Y: Log filters_applied
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        `Filters applied: ${filterResult.passed ? 'PASSED' : 'FAILED'}`,
        {
          passed: filterResult.passed,
          reason: filterResult.reason,
          code: filterResult.code,
          confidence_score: signal.confidence_score,
          allowed_sources: botSettings.allowed_signal_sources,
          allowed_directions: botSettings.allowed_directions,
          min_confidence: botSettings.min_signal_confidence
        }
      );
    }
    
    // Phase Y: Log limits_checked
    if (autoTradeId && filterResult.passed) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'limits_checked',
        'Limits checked',
        {
          auto_trades_today: filterContext.autoTradesToday || 0,
          max_auto_trades_per_day: botSettings.max_auto_trades_per_day,
          concurrent_positions: filterContext.autoConcurrentPositions || 0,
          max_concurrent_positions: botSettings.max_concurrent_auto_positions,
          active_trades_count: activeTradesCount,
          max_active_trades: botSettings.max_active_trades
        }
      );
      
      // Phase Y: Log auto trading mode check
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        'Checking auto trading mode before execution',
        {
          auto_trading_enabled: botSettings.auto_trading_enabled,
          auto_trading_mode: botSettings.auto_trading_mode,
          required_mode: 'full_auto'
        }
      );
    }
    
    if (!filterResult.passed) {
      logger.info(`Signal ${signal.id} filtered: ${filterResult.reason}`);
      
      // Phase Y: Update auto_trade status
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'rejected',
          reasonCode: filterResult.code || 'FILTER_FAILED'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'rejected',
          filterResult.reason || 'Unknown filter reason',
          { code: filterResult.code }
        );
      }
      
      // Log execution attempt
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'FILTERED',
        filterResult.reason || 'Unknown filter reason'
      );
      
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FILTERED',
        filterResult.reason || 'Unknown filter reason'
      );
      return { success: false, reason: filterResult.reason, autoTradeId: autoTradeId || undefined };
    }
    
    // Phase Y: Log that filters passed and proceeding to next checks
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        'All filters passed, proceeding to duplicate and risk checks',
        {
          filter_result: 'PASSED',
          auto_trading_enabled: botSettings.auto_trading_enabled,
          auto_trading_mode: botSettings.auto_trading_mode
        }
      );
    }
    
    logger.info(`Signal ${signal.id} passed all filters, checking duplicates and risk...`);
    
    // Check for duplicate trades
    const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
    const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';
    
    // Phase Y: Log duplicate check
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        'Checking for duplicate trades',
        {
          symbol: signal.symbol,
          side,
          market_type: botSettings.market_type
        }
      );
    }
    
    logger.info(`Signal ${signal.id}: Checking for duplicate trades...`);
    
    let hasDuplicate = false;
    try {
      hasDuplicate = await checkDuplicateTrade(
        supabaseClient,
        signal.user_id,
        signal.symbol,
        side,
        botSettings.market_type
      );
      
      // Phase Y: Log duplicate check result
      if (autoTradeId) {
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'filters_applied',
          `Duplicate check: ${hasDuplicate ? 'DUPLICATE FOUND' : 'NO DUPLICATE'}`,
          {
            has_duplicate: hasDuplicate,
            symbol: signal.symbol,
            side,
            market_type: botSettings.market_type
          }
        );
      }
      
      logger.info(`Signal ${signal.id}: Duplicate check result: ${hasDuplicate ? 'DUPLICATE FOUND' : 'NO DUPLICATE'}`);
    } catch (duplicateError) {
      logger.error(`Signal ${signal.id}: Error checking duplicates:`, duplicateError);
      
      // Phase Y: Log error
      if (autoTradeId) {
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'error',
          `Error checking duplicates: ${duplicateError instanceof Error ? duplicateError.message : String(duplicateError)}`,
          {
            error: duplicateError instanceof Error ? duplicateError.message : String(duplicateError)
          }
        );
      }
      
      // Continue anyway - don't block execution on duplicate check error
      hasDuplicate = false;
    }
    
    if (hasDuplicate) {
      logger.info(`Signal ${signal.id} ignored: duplicate trade exists`);
      
      // Log execution attempt
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'IGNORED',
        'Duplicate trade exists for same symbol/side/market type'
      );
      
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'IGNORED',
        'Duplicate trade exists for same symbol/side/market type'
      );
      return { success: false, reason: 'Duplicate trade exists' };
    }
    
    // Phase Y: Log risk check
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        'Running risk evaluation checks',
        {
          symbol: signal.symbol,
          user_id: signal.user_id
        }
      );
    }
    
    // Risk checks (Phase 5: Risk Management Engine)
    logger.info(`Signal ${signal.id}: Running risk evaluation...`);
    
    let riskEvaluation: any;
    try {
      riskEvaluation = await evaluateRisk(
        supabaseClient,
        signal.user_id,
        signal.symbol,
        botSettings
      );
      
      // Phase Y: Log risk check result
      if (autoTradeId) {
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'filters_applied',
          `Risk evaluation: ${riskEvaluation.allowed ? 'PASSED' : 'FAILED'}`,
          {
            allowed: riskEvaluation.allowed,
            reason: riskEvaluation.reason,
            risk_flags: riskEvaluation.flags || []
          }
        );
      }
      
      logger.info(`Signal ${signal.id}: Risk evaluation result - allowed: ${riskEvaluation.allowed}, reason: ${riskEvaluation.reason || 'N/A'}`);
    } catch (riskError) {
      logger.error(`Signal ${signal.id}: Error in risk evaluation:`, riskError);
      
      // Phase Y: Log error
      if (autoTradeId) {
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'error',
          `Error in risk evaluation: ${riskError instanceof Error ? riskError.message : String(riskError)}`,
          {
            error: riskError instanceof Error ? riskError.message : String(riskError)
          }
        );
      }
      
      // Default to allowed if risk check fails (fail open)
      riskEvaluation = { allowed: true, reason: 'Risk check error - defaulting to allowed', flags: [] };
      logger.warn(`Signal ${signal.id}: Risk check failed, defaulting to allowed`);
    }
    
    if (!riskEvaluation.allowed) {
      logger.info(`Signal ${signal.id} filtered by risk checks: ${riskEvaluation.reason}`);
      
      // Phase Y: Update auto_trade status and log
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'rejected',
          reasonCode: 'RISK_CHECK_FAILED'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'rejected',
          riskEvaluation.reason || 'Risk check failed',
          {
            code: 'RISK_CHECK_FAILED',
            risk_flags: riskEvaluation.flags || []
          }
        );
      }
      
      // Log execution attempt
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'FILTERED',
        riskEvaluation.reason || 'Risk check failed',
        undefined,
        undefined,
        riskEvaluation.flags
      );
      
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FILTERED',
        riskEvaluation.reason || 'Risk check failed',
        undefined,
        undefined
      );
      return { success: false, reason: riskEvaluation.reason || 'Risk check failed', autoTradeId: autoTradeId || undefined };
    }
    
    // Use adjusted capital if provided
    if (riskEvaluation.adjustedCapital && riskEvaluation.adjustedCapital < botSettings.total_capital) {
      logger.info(`Signal ${signal.id}: Using adjusted capital ${riskEvaluation.adjustedCapital} (reduced from ${botSettings.total_capital}) due to risk flags: ${riskEvaluation.flags.join(', ')}`);
      botSettings.total_capital = riskEvaluation.adjustedCapital;
    }
    
    // Log risk flags if any
    if (riskEvaluation.flags && riskEvaluation.flags.length > 0) {
      logger.info(`Signal ${signal.id}: Risk flags: ${riskEvaluation.flags.join(', ')}`);
    }
    
    // Phase Y: Log auto_trading_mode check
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'filters_applied',
        'Checking auto_trading_mode before execution',
        {
          auto_trading_enabled: botSettings.auto_trading_enabled,
          auto_trading_mode: botSettings.auto_trading_mode,
          required_mode: 'full_auto',
          will_execute: botSettings.auto_trading_mode === 'full_auto'
        }
      );
    }
    
    logger.info(`Signal ${signal.id}: auto_trading_mode check - enabled: ${botSettings.auto_trading_enabled}, mode: ${botSettings.auto_trading_mode}, will execute: ${botSettings.auto_trading_mode === 'full_auto'}`);
    
    // Phase X: Check auto_trading_mode before execution
    // Only execute if auto_trading_mode is 'full_auto'
    if (botSettings.auto_trading_mode !== 'full_auto') {
      const skipReason = botSettings.auto_trading_mode === 'off' 
        ? 'Auto trading mode is set to OFF'
        : botSettings.auto_trading_mode === 'semi_auto'
        ? 'Auto trading mode is set to SEMI_AUTO (requires manual confirmation)'
        : `Auto trading mode is '${botSettings.auto_trading_mode}' (not full_auto)`;
      
      logger.info(`Signal ${signal.id} execution skipped: ${skipReason}`);
      
      // Phase Y: Update auto_trade status and log
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'rejected',
          reasonCode: 'EXECUTION_SKIPPED'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'execution_skipped',
          skipReason,
          {
            auto_trading_mode: botSettings.auto_trading_mode,
            auto_trading_enabled: botSettings.auto_trading_enabled
          }
        );
      }
      
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FILTERED',
        skipReason
      );
      
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'FILTERED',
        skipReason
      );
      
      return { success: false, reason: skipReason, autoTradeId: autoTradeId || undefined };
    }
    
    // Get API keys
    // default_platform can be either UUID (api_key id) or platform name
    logger.info(`Getting API keys for user ${signal.user_id}, default_platform: ${botSettings.default_platform || 'not set'}`);
    
    const apiKeys = await getUserApiKeys(
      supabaseClient,
      signal.user_id,
      botSettings.default_platform || undefined
    );
    
    logger.info(`Found ${apiKeys.length} API keys for user ${signal.user_id}`);
    
    if (apiKeys.length === 0) {
      logger.warn(`No API keys found for user ${signal.user_id}, default_platform: ${botSettings.default_platform || 'not set'}`);
      
      // Phase Y: Log detailed error
      if (autoTradeId) {
        // Try to get all API keys to see what's available
        const allApiKeys = await getUserApiKeys(supabaseClient, signal.user_id);
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'rejected',
          reasonCode: 'NO_API_KEYS'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'execution_skipped',
          'No active API keys found',
          {
            default_platform: botSettings.default_platform,
            total_api_keys: allApiKeys.length,
            available_api_keys: allApiKeys.map((ak: any) => ({
              id: ak.id,
              platform: ak.platform,
              is_active: ak.is_active
            }))
          }
        );
      }
      
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FILTERED',
        'No active API keys found'
      );
      return { success: false, reason: 'No active API keys found', autoTradeId: autoTradeId || undefined };
    }
    
    // Use first API key (or select based on platform)
    const apiKey = apiKeys[0];
    
    // Phase Y: Update auto_trade status to accepted
    if (autoTradeId) {
      await updateAutoTrade(supabaseClient, autoTradeId, {
        status: 'accepted'
      });
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'accepted_for_execution',
        'Signal accepted for execution - Full Auto mode',
        {
          risk_flags: riskEvaluation.flags || [],
          adjusted_capital: riskEvaluation.adjustedCapital,
          auto_trading_mode: botSettings.auto_trading_mode,
          platform: apiKey.platform
        }
      );
    }
    
    // Update signal status to EXECUTING
    await updateSignalStatus(supabaseClient, signal.id, 'EXECUTING');
    
    // Log execution attempt
    await logSignalExecution(
      supabaseClient,
      signal.user_id,
      signal.id,
      signalSource,
      signal,
      'EXECUTING',
      undefined,
      undefined,
      undefined,
      riskEvaluation.flags
    );
    
    // Phase Y: Log execute_called
    if (autoTradeId) {
      await addAutoTradeLog(
        supabaseClient,
        autoTradeId,
        'execute_called',
        'Calling execute-trade function',
        {
          platform: apiKey.platform,
          market_type: botSettings.market_type,
          entry_price: signal.entry_price,
          stop_loss: signal.stop_loss_price,
          take_profit: signal.take_profit_price,
          auto_trading_mode: botSettings.auto_trading_mode
        }
      );
    }
    
    logger.info(`Executing trade for signal ${signal.id} in Full Auto mode`);
    
    // Execute trade
    const executionResult = await executeTrade(
      signal,
      botSettings,
      {
        id: apiKey.id,
        platform: apiKey.platform,
        api_key: apiKey.api_key,
        secret_key: apiKey.secret_key,
        passphrase: apiKey.passphrase,
        testnet: apiKey.testnet || false
      },
      undefined, // availableBalance
      autoTradeId || undefined // Phase Y: Pass auto_trade_id
    );
    
    if (executionResult.success && executionResult.tradeId) {
      // Phase Y: Update auto_trade with execution details
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          executedAt: new Date(),
          positionId: executionResult.tradeId
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'exchange_response',
          'Trade executed successfully',
          {
            trade_id: executionResult.tradeId,
            execution_result: executionResult.executionResult
          }
        );
      }
      
      // Update signal status to EXECUTED
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'EXECUTED',
        'Trade executed successfully',
        executionResult.tradeId
      );
      
      // Log successful execution
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'EXECUTED',
        'Trade executed successfully',
        executionResult.tradeId,
        undefined,
        riskEvaluation.flags
      );
      
      logger.info(`Signal ${signal.id} executed successfully! Trade ID: ${executionResult.tradeId}`);
      
      // Phase X.17: Copy Trading - Check if this bot has a copy strategy
      try {
        const copyStrategy = await getCopyStrategyForBot(
          supabaseClient,
          signal.user_id,
          botSettingsRaw.id
        );
        
        if (copyStrategy) {
          // Get signal execution ID if available
          const { data: signalExecution } = await supabaseClient
            .from('bot_signal_executions')
            .select('id')
            .eq('signal_id', signal.id)
            .eq('user_id', signal.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Handle copy trading
          const copyResult = await handleMasterTradeExecution(
            supabaseClient,
            {
              strategyId: copyStrategy.strategyId,
              masterUserId: copyStrategy.ownerUserId,
              masterTradeId: executionResult.tradeId,
              masterSignalExecutionId: signalExecution?.id,
              signal,
              botSettings: botSettingsRaw,
              executionResult: executionResult.executionResult || {},
            }
          );
          
          if (copyResult.success && copyResult.copiedCount > 0) {
            logger.info(`Copy trading: ${copyResult.copiedCount} trades copied successfully`);
          } else if (copyResult.errors.length > 0) {
            logger.warn(`Copy trading errors: ${copyResult.errors.join(', ')}`);
          }
        }
      } catch (copyError) {
        // Don't fail the main trade execution if copy trading fails
        logger.error('Error in copy trading (non-fatal):', copyError);
      }
      
      return { success: true, tradeId: executionResult.tradeId, autoTradeId: autoTradeId || undefined };
    } else {
      // Phase Y: Update auto_trade status to error
      if (autoTradeId) {
        await updateAutoTrade(supabaseClient, autoTradeId, {
          status: 'error',
          reasonCode: 'EXCHANGE_ERROR'
        });
        await addAutoTradeLog(
          supabaseClient,
          autoTradeId,
          'error',
          executionResult.error || 'Trade execution failed',
          {
            error: executionResult.error,
            execution_result: executionResult.executionResult
          }
        );
      }
      
      // Update signal status to FAILED
      await updateSignalStatus(
        supabaseClient,
        signal.id,
        'FAILED',
        executionResult.error || 'Trade execution failed',
        undefined,
        executionResult.error
      );
      
      // Log failed execution
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'FAILED',
        executionResult.error || 'Trade execution failed',
        undefined,
        executionResult.error,
        riskEvaluation.flags
      );
      
      logger.error(`Signal ${signal.id} execution failed: ${executionResult.error}`);
      return { success: false, reason: executionResult.error, autoTradeId: autoTradeId || undefined };
    }
    
  } catch (error) {
    logger.error(`Error processing signal ${signal.id}:`, error);
    await updateSignalStatus(
      supabaseClient,
      signal.id,
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      error instanceof Error ? error.stack : String(error)
    );
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get active users with bots enabled
 */
async function getActiveBotUsers(
  supabaseClient: ReturnType<typeof createClient>
): Promise<string[]> {
  const { data, error } = await supabaseClient
    .from('bot_settings')
    .select('user_id')
    .eq('is_active', true);
  
  if (error) {
    logger.error('Error fetching active bot users:', error);
    return [];
  }
  
  return (data || []).map((row: any) => row.user_id);
}

/**
 * Main worker function
 */
serve(async (req) => {
  const startTime = Date.now();
  logger.info('Auto-trader worker started');
  
  try {
    const supabaseClient = getSupabaseClient();
    
    // Phase X.6: Use signal router for each active bot user
    // Get active bot users
    const activeUsers = await getActiveBotUsers(supabaseClient);
    logger.info(`Found ${activeUsers.length} active bot users`);
    
    // Also fetch legacy pending signals for backward compatibility
    const legacySignals = await fetchPendingSignals(supabaseClient, WORKER_CONFIG.MAX_SIGNALS_PER_RUN);
    logger.info(`Found ${legacySignals.length} legacy pending signals`);
    
    // Collect signals from all sources
    const allSignals: ProcessingSignal[] = [];
    
    // Process each active user with their configured signal source
    for (const userId of activeUsers) {
      try {
        logger.info(`Getting signal for user ${userId}...`);
        const unifiedSignal = await getNextSignalForBot(supabaseClient, userId);
        
        if (unifiedSignal) {
          const processingSignal = convertToProcessingSignal(unifiedSignal);
          allSignals.push(processingSignal);
          logger.info(`Found signal for user ${userId} from source: ${unifiedSignal.source}, signal ID: ${unifiedSignal.id}`);
        } else {
          logger.info(`No signal found for user ${userId}`);
        }
      } catch (error) {
        logger.error(`Error getting signal for user ${userId}:`, error);
      }
    }
    
    // Add legacy signals (for backward compatibility)
    allSignals.push(...legacySignals);
    logger.info(`Total signals collected: ${allSignals.length} (${legacySignals.length} legacy)`);
    
    // Remove duplicates (same user + symbol + side)
    const uniqueSignals = allSignals.filter((signal, index, self) => 
      index === self.findIndex((s) => 
        s.user_id === signal.user_id && 
        s.symbol === signal.symbol && 
        s.signal_type === signal.signal_type
      )
    );
    
    logger.info(`Found ${uniqueSignals.length} unique signals to process (${allSignals.length} total, ${legacySignals.length} legacy)`);
    
    if (uniqueSignals.length === 0) {
      logger.warn('No signals found to process. Checking auto_trades table for pending trades...');
      
      // Check for pending auto_trades that might need processing
      const { data: pendingAutoTrades, error: autoTradesError } = await supabaseClient
        .from('auto_trades')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (autoTradesError) {
        logger.error('Error checking pending auto_trades:', autoTradesError);
      } else if (pendingAutoTrades && pendingAutoTrades.length > 0) {
        logger.warn(`Found ${pendingAutoTrades.length} pending auto_trades but no signals to process. This might indicate a problem with signal fetching.`);
        logger.warn('Pending auto_trades:', pendingAutoTrades.map((at: any) => ({
          id: at.id,
          signal_id: at.signal_id,
          signal_source: at.signal_source,
          pair: at.pair,
          created_at: at.created_at
        })));
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No signals to process',
          processed: 0,
          pending_auto_trades: pendingAutoTrades?.length || 0,
          execution_time_ms: Date.now() - startTime
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Process signals
    const results = {
      processed: 0,
      executed: 0,
      filtered: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const signal of uniqueSignals) {
      // Determine signal source for logging
      const signalSource: 'ai' | 'tradingview' | 'legacy' = 
        (signal as any).source || 
        (signal.strategy_name?.includes('AI') ? 'ai' : 
         signal.strategy_name?.includes('TradingView') ? 'tradingview' : 'legacy');
      
      logger.info(`Processing signal ${signal.id} for user ${signal.user_id}, source: ${signalSource}, symbol: ${signal.symbol}`);
      
      // Log initial signal fetch
      await logSignalExecution(
        supabaseClient,
        signal.user_id,
        signal.id,
        signalSource,
        signal,
        'PENDING',
        'Signal fetched from source'
      );
      
      try {
        const result = await processSignal(signal, supabaseClient);
        results.processed++;
      
        if (result.success) {
          results.executed++;
          logger.info(`Signal ${signal.id} processed successfully. Trade ID: ${result.tradeId || 'N/A'}`);
        } else if (result.reason?.includes('filtered') || result.reason?.includes('Filtered')) {
          results.filtered++;
          logger.info(`Signal ${signal.id} filtered: ${result.reason}`);
        } else {
          results.failed++;
          logger.error(`Signal ${signal.id} failed: ${result.reason}`);
          if (result.reason) {
            results.errors.push(`Signal ${signal.id}: ${result.reason}`);
          }
        }
      } catch (processError) {
        results.failed++;
        const errorMsg = processError instanceof Error ? processError.message : String(processError);
        logger.error(`Error processing signal ${signal.id}:`, processError);
        results.errors.push(`Signal ${signal.id}: ${errorMsg}`);
      }
    }
    
    logger.info(`Worker completed. Processed: ${results.processed}, Executed: ${results.executed}, Filtered: ${results.filtered}, Failed: ${results.failed}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Worker completed successfully',
        results,
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    logger.error('Worker error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

