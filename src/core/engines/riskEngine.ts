/**
 * Risk Engine Core
 * 
 * Central risk management engine
 * Phase 5: Risk Management Engine (Advanced)
 */

import { BotSettingsForm } from '@/core/config';
import { Trade } from '@/core/models/Trade';
import { Position } from '@/core/models/Position';
import { RiskSnapshot } from '@/core/models/RiskSnapshot';
import { GeneratedSignal } from '@/strategies/Strategy';

/**
 * Risk Evaluation Context
 */
export interface RiskEvaluationContext {
  // Signal to evaluate
  signal: GeneratedSignal;
  
  // Bot settings
  botSettings: BotSettingsForm;
  
  // Portfolio snapshot
  portfolioSnapshot?: {
    totalBalance: number;
    usdBalance: number;
    equity: number;
    activeTradesCount: number;
    totalExposure: number;
    dailyPnL: number;
    currentDrawdown: number;
    maxDrawdown: number;
    peakEquity: number;
  };
  
  // Open positions/trades
  openPositions: Position[];
  openTrades: Trade[];
  
  // Last risk snapshot
  lastRiskSnapshot?: RiskSnapshot;
  
  // Indicators (for volatility guard)
  indicators?: {
    atr: number;
    volatility: number;
    volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  
  // Market data
  marketData?: {
    symbol: string;
    currentPrice: number;
    volume24h?: number;
  };
}

/**
 * Risk Evaluation Result
 */
export interface RiskEvaluationResult {
  allowed: boolean;
  reason?: string;
  adjustedCapital?: number;
  flags: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Risk Flags
 */
export enum RiskFlag {
  DAILY_LOSS_LIMIT_HIT = 'DAILY_LOSS_LIMIT_HIT',
  MAX_DRAWDOWN_EXCEEDED = 'MAX_DRAWDOWN_EXCEEDED',
  EXPOSURE_PER_SYMBOL_EXCEEDED = 'EXPOSURE_PER_SYMBOL_EXCEEDED',
  TOTAL_EXPOSURE_EXCEEDED = 'TOTAL_EXPOSURE_EXCEEDED',
  VOLATILITY_TOO_HIGH = 'VOLATILITY_TOO_HIGH',
  KILL_SWITCH_ACTIVE = 'KILL_SWITCH_ACTIVE',
  MAX_TRADES_REACHED = 'MAX_TRADES_REACHED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  POSITION_SIZE_TOO_LARGE = 'POSITION_SIZE_TOO_LARGE',
}

/**
 * Risk Engine
 * 
 * Central risk management engine that evaluates all risk factors
 */
export class RiskEngine {
  /**
   * Evaluate risk for a signal
   */
  static evaluateRisk(ctx: RiskEvaluationContext): RiskEvaluationResult {
    const flags: string[] = [];
    const reasons: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let adjustedCapital: number | undefined = undefined;

    // Initialize defaults if missing
    const portfolio = ctx.portfolioSnapshot || {
      totalBalance: ctx.botSettings.total_capital,
      usdBalance: ctx.botSettings.total_capital,
      equity: ctx.botSettings.total_capital,
      activeTradesCount: ctx.openTrades.length,
      totalExposure: 0,
      dailyPnL: 0,
      currentDrawdown: 0,
      maxDrawdown: 0,
      peakEquity: ctx.botSettings.total_capital
    };

    // Check 1: Kill Switch
    const killSwitchCheck = this.checkKillSwitch(ctx, portfolio);
    if (!killSwitchCheck.allowed) {
      flags.push(killSwitchCheck.flag);
      reasons.push(killSwitchCheck.reason);
      riskLevel = 'CRITICAL';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // Check 2: Daily Loss Limit
    const dailyLossCheck = this.checkDailyLossLimit(ctx, portfolio);
    if (!dailyLossCheck.allowed) {
      flags.push(dailyLossCheck.flag);
      reasons.push(dailyLossCheck.reason);
      riskLevel = 'CRITICAL';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // Check 3: Max Drawdown
    const drawdownCheck = this.checkMaxDrawdown(ctx, portfolio);
    if (!drawdownCheck.allowed) {
      flags.push(drawdownCheck.flag);
      reasons.push(drawdownCheck.reason);
      riskLevel = 'CRITICAL';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // Check 4: Exposure Limits
    const exposureCheck = this.checkExposureLimits(ctx, portfolio);
    if (!exposureCheck.allowed) {
      flags.push(exposureCheck.flag);
      reasons.push(exposureCheck.reason);
      riskLevel = riskLevel === 'LOW' ? 'HIGH' : 'CRITICAL';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // Check 5: Max Active Trades
    const maxTradesCheck = this.checkMaxActiveTrades(ctx, portfolio);
    if (!maxTradesCheck.allowed) {
      flags.push(maxTradesCheck.flag);
      reasons.push(maxTradesCheck.reason);
      riskLevel = 'HIGH';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // Check 6: Volatility Guard
    const volatilityCheck = this.checkVolatilityGuard(ctx);
    if (!volatilityCheck.allowed) {
      flags.push(volatilityCheck.flag);
      reasons.push(volatilityCheck.reason);
      
      // Adjust position size instead of denying if enabled
      if (volatilityCheck.adjustedCapital) {
        adjustedCapital = volatilityCheck.adjustedCapital;
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'HIGH';
        return {
          allowed: false,
          reason: reasons.join('; '),
          flags,
          riskLevel
        };
      }
    }

    // Check 7: Balance Check
    const balanceCheck = this.checkAvailableBalance(ctx, portfolio);
    if (!balanceCheck.allowed) {
      flags.push(balanceCheck.flag);
      reasons.push(balanceCheck.reason);
      riskLevel = 'HIGH';
      return {
        allowed: false,
        reason: reasons.join('; '),
        flags,
        riskLevel
      };
    }

    // All checks passed
    return {
      allowed: true,
      adjustedCapital,
      flags: flags.length > 0 ? flags : [],
      riskLevel: adjustedCapital ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Check kill switch
   */
  private static checkKillSwitch(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    // Check if kill switch is enabled and active
    if (ctx.botSettings.kill_switch_enabled && ctx.lastRiskSnapshot?.alerts?.some(a => a.includes('kill'))) {
      return {
        allowed: false,
        flag: RiskFlag.KILL_SWITCH_ACTIVE,
        reason: 'Kill switch is active. Trading is temporarily disabled.'
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check daily loss limit
   */
  private static checkDailyLossLimit(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    const maxDailyLossUsd = ctx.botSettings.max_daily_loss_usd;
    const maxDailyLossPct = ctx.botSettings.max_daily_loss_pct || 5.0;

    if (!maxDailyLossUsd && !maxDailyLossPct) {
      return { allowed: true, flag: '' };
    }

    const dailyLoss = Math.abs(Math.min(0, portfolio.dailyPnL));
    const dailyLossPct = (dailyLoss / portfolio.equity) * 100;

    // Check USD limit
    if (maxDailyLossUsd && dailyLoss >= maxDailyLossUsd) {
      return {
        allowed: false,
        flag: RiskFlag.DAILY_LOSS_LIMIT_HIT,
        reason: `Daily loss limit exceeded: $${dailyLoss.toFixed(2)} >= $${maxDailyLossUsd.toFixed(2)}`
      };
    }

    // Check percentage limit
    if (dailyLossPct >= maxDailyLossPct) {
      return {
        allowed: false,
        flag: RiskFlag.DAILY_LOSS_LIMIT_HIT,
        reason: `Daily loss percentage exceeded: ${dailyLossPct.toFixed(2)}% >= ${maxDailyLossPct}%`
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check max drawdown
   */
  private static checkMaxDrawdown(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    const maxDrawdownPct = ctx.botSettings.max_drawdown_pct || 20.0;

    if (portfolio.currentDrawdown >= maxDrawdownPct) {
      return {
        allowed: false,
        flag: RiskFlag.MAX_DRAWDOWN_EXCEEDED,
        reason: `Max drawdown exceeded: ${portfolio.currentDrawdown.toFixed(2)}% >= ${maxDrawdownPct}%`
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check exposure limits
   */
  private static checkExposureLimits(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    const maxExposurePerSymbol = ctx.botSettings.max_exposure_pct_per_symbol || 30.0;
    const maxExposureTotal = ctx.botSettings.max_exposure_pct_total || 80.0;

    // Calculate exposure for this symbol
    const symbolExposure = ctx.openTrades
      .filter(t => t.symbol === ctx.signal.symbol && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.total_invested || 0), 0);

    const symbolExposurePct = (symbolExposure / portfolio.equity) * 100;

    // Check per-symbol exposure
    if (symbolExposurePct >= maxExposurePerSymbol) {
      return {
        allowed: false,
        flag: RiskFlag.EXPOSURE_PER_SYMBOL_EXCEEDED,
        reason: `Exposure per symbol exceeded: ${symbolExposurePct.toFixed(2)}% >= ${maxExposurePerSymbol}% for ${ctx.signal.symbol}`
      };
    }

    // Check total exposure
    const totalExposurePct = (portfolio.totalExposure / portfolio.equity) * 100;
    if (totalExposurePct >= maxExposureTotal) {
      return {
        allowed: false,
        flag: RiskFlag.TOTAL_EXPOSURE_EXCEEDED,
        reason: `Total exposure exceeded: ${totalExposurePct.toFixed(2)}% >= ${maxExposureTotal}%`
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check max active trades
   */
  private static checkMaxActiveTrades(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    const maxTrades = ctx.botSettings.max_active_trades;

    if (portfolio.activeTradesCount >= maxTrades) {
      return {
        allowed: false,
        flag: RiskFlag.MAX_TRADES_REACHED,
        reason: `Max active trades reached: ${portfolio.activeTradesCount} >= ${maxTrades}`
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check volatility guard
   */
  private static checkVolatilityGuard(
    ctx: RiskEvaluationContext
  ): { allowed: boolean; flag: string; reason?: string; adjustedCapital?: number } {
    if (!ctx.botSettings.volatility_guard_enabled || !ctx.indicators) {
      return { allowed: true, flag: '' };
    }

    const atrMultiplier = ctx.botSettings.volatility_guard_atr_multiplier || 3.0;

    // If volatility is too high, reduce position size
    if (ctx.indicators.volatilityLevel === 'EXTREME' || 
        ctx.indicators.volatilityLevel === 'HIGH') {
      
      // Calculate adjusted capital (reduce by 30-50%)
      const reductionFactor = ctx.indicators.volatilityLevel === 'EXTREME' ? 0.5 : 0.7;
      const adjustedCapital = (ctx.botSettings.total_capital * reductionFactor);

      return {
        allowed: true, // Allow but with reduced size
        flag: RiskFlag.VOLATILITY_TOO_HIGH,
        reason: `High volatility detected (${ctx.indicators.volatilityLevel}). Position size reduced by ${((1 - reductionFactor) * 100).toFixed(0)}%.`,
        adjustedCapital
      };
    }

    return { allowed: true, flag: '' };
  }

  /**
   * Check available balance
   */
  private static checkAvailableBalance(
    ctx: RiskEvaluationContext,
    portfolio: any
  ): { allowed: boolean; flag: string; reason?: string } {
    const minBalance = 10; // Minimum balance required
    const requiredBalance = ctx.botSettings.total_capital * (ctx.botSettings.risk_percentage / 100);

    if (portfolio.usdBalance < minBalance) {
      return {
        allowed: false,
        flag: RiskFlag.INSUFFICIENT_BALANCE,
        reason: `Insufficient balance: $${portfolio.usdBalance.toFixed(2)} < $${minBalance}`
      };
    }

    if (portfolio.usdBalance < requiredBalance) {
      return {
        allowed: false,
        flag: RiskFlag.INSUFFICIENT_BALANCE,
        reason: `Insufficient balance for trade: $${portfolio.usdBalance.toFixed(2)} < $${requiredBalance.toFixed(2)}`
      };
    }

    return { allowed: true, flag: '' };
  }
}

