/**
 * Signal Filters
 * 
 * Decision gate filters for signal processing
 * Phase 3: Auto-Trading Trigger
 */

import { FilterResult, FilterContext } from './types.ts';
// Note: Risk filters will be applied separately in auto-trader-worker
// to avoid circular dependencies and allow more context (trades, positions, etc.)

/**
 * Filter: Bot Enabled Check
 * 
 * Checks if bot is active for the user
 */
export function filterBotEnabled(context: FilterContext): FilterResult {
  if (!context.botSettings.is_active) {
    return {
      passed: false,
      reason: 'Bot is not active for this user',
      code: 'BOT_DISABLED'
    };
  }
  
  return { passed: true };
}

/**
 * Filter: Market Type Match
 * 
 * Checks if signal matches bot's market type setting
 * Note: This is a basic check - signals from TradingView might not specify market type
 * So we allow spot signals for both spot and futures bots
 */
export function filterMarketType(context: FilterContext): FilterResult {
  // TradingView signals are typically spot, but we allow flexibility
  // Future: Enhance signal to include market_type field
  
  // For now, we pass all signals and let the execution decide
  // based on bot_settings.market_type
  
  return { passed: true };
}

/**
 * Filter: Symbol Allowed
 * 
 * Checks if symbol is in allowed list or not in blacklist
 */
export function filterSymbolAllowed(context: FilterContext): FilterResult {
  const { signal, allowedSymbols, blacklistSymbols } = context;
  const symbol = signal.symbol;
  
  // Check blacklist first
  if (blacklistSymbols && blacklistSymbols.length > 0) {
    if (blacklistSymbols.includes(symbol)) {
      return {
        passed: false,
        reason: `Symbol ${symbol} is in blacklist`,
        code: 'SYMBOL_BLACKLISTED'
      };
    }
  }
  
  // Check whitelist if provided
  if (allowedSymbols && allowedSymbols.length > 0) {
    if (!allowedSymbols.includes(symbol)) {
      return {
        passed: false,
        reason: `Symbol ${symbol} is not in allowed list`,
        code: 'SYMBOL_NOT_ALLOWED'
      };
    }
  }
  
  return { passed: true };
}

/**
 * Filter: Cooldown Period
 * 
 * Prevents executing trades on same symbol within cooldown period
 * Default: 15 minutes
 */
export function filterCooldown(
  context: FilterContext, 
  cooldownMinutes: number = 15
): FilterResult {
  const { lastTradeTime } = context;
  
  if (!lastTradeTime) {
    return { passed: true }; // No previous trade
  }
  
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const timeSinceLastTrade = Date.now() - lastTradeTime.getTime();
  
  if (timeSinceLastTrade < cooldownMs) {
    const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastTrade) / 60000);
    return {
      passed: false,
      reason: `Cooldown period active. Please wait ${remainingMinutes} more minutes`,
      code: 'COOLDOWN_ACTIVE'
    };
  }
  
  return { passed: true };
}

/**
 * Filter: Max Concurrent Trades
 * 
 * Checks if user has reached max active trades limit
 */
export function filterMaxConcurrentTrades(context: FilterContext): FilterResult {
  const { activeTradesCount, botSettings } = context;
  const maxTrades = botSettings.max_active_trades || 5;
  
  if (activeTradesCount >= maxTrades) {
    return {
      passed: false,
      reason: `Maximum active trades limit reached (${activeTradesCount}/${maxTrades})`,
      code: 'MAX_TRADES_REACHED'
    };
  }
  
  return { passed: true };
}

/**
 * Filter: Trade Direction Allowed
 * 
 * Checks if signal direction matches bot settings
 */
export function filterTradeDirection(context: FilterContext): FilterResult {
  const { signal, botSettings } = context;
  const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
  const isSell = signal.signal_type === 'SELL' || signal.signal_type === 'STRONG_SELL';
  
  if (isBuy && !botSettings.allow_long_trades) {
    return {
      passed: false,
      reason: 'Long trades are not allowed',
      code: 'LONG_TRADES_DISABLED'
    };
  }
  
  if (isSell && !botSettings.allow_short_trades) {
    return {
      passed: false,
      reason: 'Short trades are not allowed',
      code: 'SHORT_TRADES_DISABLED'
    };
  }
  
  return { passed: true };
}

/**
 * Filter: Exchange Health
 * 
 * Checks if exchange is healthy (connection, API status)
 */
export function filterExchangeHealth(context: FilterContext): FilterResult {
  if (!context.exchangeHealth) {
    return {
      passed: false,
      reason: 'Exchange health check failed',
      code: 'EXCHANGE_UNHEALTHY'
    };
  }
  
  return { passed: true };
}

/**
 * Filter: Confidence Score
 * 
 * Checks if signal confidence meets minimum threshold
 */
export function filterConfidenceScore(
  context: FilterContext,
  minConfidence: number = 70
): FilterResult {
  const { signal } = context;
  
  if (signal.confidence_score < minConfidence) {
    return {
      passed: false,
      reason: `Confidence score (${signal.confidence_score}) below minimum (${minConfidence})`,
      code: 'LOW_CONFIDENCE'
    };
  }
  
  return { passed: true };
}

/**
 * Apply All Filters
 * 
 * Runs all filters and returns first failure or success
 */
export function applyAllFilters(
  context: FilterContext,
  options: {
    cooldownMinutes?: number;
    minConfidence?: number;
  } = {}
): FilterResult {
  const filters = [
    filterBotEnabled,
    filterMarketType,
    filterSymbolAllowed,
    (ctx: FilterContext) => filterCooldown(ctx, options.cooldownMinutes),
    filterMaxConcurrentTrades,
    filterTradeDirection,
    filterExchangeHealth,
    (ctx: FilterContext) => filterConfidenceScore(ctx, options.minConfidence)
  ];
  
  for (const filter of filters) {
    const result = filter(context);
    if (!result.passed) {
      return result;
    }
  }
  
  return { passed: true };
}

