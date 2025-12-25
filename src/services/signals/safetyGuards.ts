/**
 * Safety Guards
 * 
 * Safety checks before generating signals
 * Phase 4: Strategy Engine
 */

import { StrategyContext } from '@/strategies/Strategy.ts';
import { calculateVolatility } from '@/core/engines/indicatorEngine.ts';

/**
 * Safety Guard Result
 */
export interface SafetyGuardResult {
  passed: boolean;
  reason?: string;
  code?: string;
}

/**
 * Check signal cooldown
 */
export function checkSignalCooldown(
  symbol: string,
  timeframe: string,
  lastSignals: Array<{ symbol: string; timeframe: string; created_at: string }>,
  cooldownMinutes: number = 15
): SafetyGuardResult {
  if (!lastSignals || lastSignals.length === 0) {
    return { passed: true };
  }

  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;

  // Find last signal for this symbol and timeframe
  const lastSignal = lastSignals
    .filter(s => s.symbol === symbol && s.timeframe === timeframe)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!lastSignal) {
    return { passed: true };
  }

  const lastSignalTime = new Date(lastSignal.created_at).getTime();
  const timeSinceLastSignal = now - lastSignalTime;

  if (timeSinceLastSignal < cooldownMs) {
    const minutesLeft = Math.ceil((cooldownMs - timeSinceLastSignal) / (60 * 1000));
    return {
      passed: false,
      reason: `Signal cooldown active. Last signal was ${minutesLeft} minutes ago. Wait ${cooldownMinutes - minutesLeft} more minutes.`,
      code: 'COOLDOWN_ACTIVE'
    };
  }

  return { passed: true };
}

/**
 * Check market type compatibility
 */
export function checkMarketTypeCompatibility(
  strategyMarketTypes: ('spot' | 'futures')[],
  userMarketType: 'spot' | 'futures'
): SafetyGuardResult {
  if (strategyMarketTypes.includes(userMarketType)) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: `Strategy does not support ${userMarketType} market type. Supported types: ${strategyMarketTypes.join(', ')}`,
    code: 'MARKET_TYPE_INCOMPATIBLE'
  };
}

/**
 * Check volatility guard
 */
export function checkVolatilityGuard(
  candles: Array<{ high: number; low: number; close: number }>,
  maxVolatilityPercent: number = 10
): SafetyGuardResult {
  if (candles.length < 20) {
    return { passed: true }; // Not enough data, allow signal
  }

  const { volatilityPercent, level } = calculateVolatility(candles as any, 20);

  if (level === 'EXTREME' || volatilityPercent > maxVolatilityPercent) {
    return {
      passed: false,
      reason: `Volatility too high (${volatilityPercent.toFixed(2)}%). Maximum allowed: ${maxVolatilityPercent}%`,
      code: 'VOLATILITY_TOO_HIGH'
    };
  }

  return { passed: true };
}

/**
 * Check max active trades
 */
export function checkMaxActiveTrades(
  activeTradesCount: number,
  maxActiveTrades: number
): SafetyGuardResult {
  if (activeTradesCount >= maxActiveTrades) {
    return {
      passed: false,
      reason: `Maximum active trades reached (${activeTradesCount}/${maxActiveTrades})`,
      code: 'MAX_TRADES_REACHED'
    };
  }

  return { passed: true };
}

/**
 * Check available balance
 */
export function checkAvailableBalance(
  availableBalance: number,
  requiredAmount: number,
  minBalance: number = 10
): SafetyGuardResult {
  if (availableBalance < minBalance) {
    return {
      passed: false,
      reason: `Insufficient balance ($${availableBalance.toFixed(2)}). Minimum required: $${minBalance}`,
      code: 'INSUFFICIENT_BALANCE'
    };
  }

  if (availableBalance < requiredAmount) {
    return {
      passed: false,
      reason: `Insufficient balance for trade ($${availableBalance.toFixed(2)}). Required: $${requiredAmount.toFixed(2)}`,
      code: 'INSUFFICIENT_BALANCE_FOR_TRADE'
    };
  }

  return { passed: true };
}

/**
 * Check trade direction allowed
 */
export function checkTradeDirectionAllowed(
  side: 'buy' | 'sell',
  botSettings: { allow_long_trades?: boolean; allow_short_trades?: boolean }
): SafetyGuardResult {
  if (side === 'buy' && botSettings.allow_long_trades === false) {
    return {
      passed: false,
      reason: 'Long trades (buy) are disabled in bot settings',
      code: 'LONG_TRADES_DISABLED'
    };
  }

  if (side === 'sell' && botSettings.allow_short_trades === false) {
    return {
      passed: false,
      reason: 'Short trades (sell) are disabled in bot settings',
      code: 'SHORT_TRADES_DISABLED'
    };
  }

  return { passed: true };
}

/**
 * Apply all safety guards
 */
export function applyAllSafetyGuards(
  ctx: StrategyContext,
  side: 'buy' | 'sell',
  options: {
    cooldownMinutes?: number;
    maxVolatilityPercent?: number;
    requiredAmount?: number;
    minBalance?: number;
  } = {}
): SafetyGuardResult {
  const {
    cooldownMinutes = 15,
    maxVolatilityPercent = 10,
    requiredAmount = ctx.availableBalance * 0.1, // Default: 10% of available balance
    minBalance = 10
  } = options;

  // Check cooldown
  const cooldownCheck = checkSignalCooldown(
    ctx.symbol,
    ctx.timeframe,
    ctx.lastSignals.map(s => ({
      symbol: s.symbol,
      timeframe: s.timeframe,
      created_at: (s as any).created_at || new Date().toISOString()
    })),
    cooldownMinutes
  );
  if (!cooldownCheck.passed) {
    return cooldownCheck;
  }

  // Check market type compatibility (done at strategy level)
  // This is checked before calling strategy

  // Check volatility
  const volatilityCheck = checkVolatilityGuard(ctx.candles, maxVolatilityPercent);
  if (!volatilityCheck.passed) {
    return volatilityCheck;
  }

  // Check max active trades
  const maxTradesCheck = checkMaxActiveTrades(
    ctx.activeTradesCount,
    ctx.botSettings.max_active_trades
  );
  if (!maxTradesCheck.passed) {
    return maxTradesCheck;
  }

  // Check available balance
  const balanceCheck = checkAvailableBalance(
    ctx.availableBalance,
    requiredAmount,
    minBalance
  );
  if (!balanceCheck.passed) {
    return balanceCheck;
  }

  // Check trade direction allowed
  const directionCheck = checkTradeDirectionAllowed(side, ctx.botSettings);
  if (!directionCheck.passed) {
    return directionCheck;
  }

  // All checks passed
  return { passed: true };
}

