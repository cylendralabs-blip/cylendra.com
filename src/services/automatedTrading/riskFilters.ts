/**
 * Risk Filters for Auto-Trader
 * 
 * Risk management filters integrated with auto-trader
 * Phase 5: Risk Management Engine (Advanced)
 */

import { RiskEngine, RiskEvaluationContext, RiskEvaluationResult } from '@/core/engines/riskEngine';
import { BotSettingsForm } from '@/core/config';
import { Trade } from '@/core/models/Trade';
import { Position } from '@/core/models/Position';
import { RiskSnapshot } from '@/core/models/RiskSnapshot';
import { calculateDailyPnL } from '@/services/riskManagement/dailyLossTracker';
import { calculateTotalExposure } from '@/services/riskManagement/exposureTracker';
import { calculateDrawdown, updatePeakEquity } from '@/services/riskManagement/drawdownCalculator';
import { isKillSwitchActive } from '@/services/riskManagement/killSwitch';
import { GeneratedSignal } from '@/strategies/Strategy';

/**
 * Signal-like interface for risk evaluation
 */
export interface SignalForRiskEvaluation {
  symbol: string;
  side: 'buy' | 'sell';
  price_at_signal: number;
  confidence?: number;
}

/**
 * Risk Filter Context
 */
export interface RiskFilterContext {
  signal: SignalForRiskEvaluation;
  botSettings: BotSettingsForm;
  trades: Trade[];
  positions: Position[];
  currentEquity: number;
  startingEquity?: number;
  peakEquity?: number;
  lastRiskSnapshot?: RiskSnapshot;
  killSwitchState?: any;
  userId?: string; // Optional user ID for signal generation
  indicators?: {
    atr: number;
    volatility: number;
    volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
}

/**
 * Risk Filter Result
 */
export interface RiskFilterResult {
  passed: boolean;
  reason?: string;
  adjustedCapital?: number;
  flags: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Apply risk filters to signal
 */
export function applyRiskFilters(
  ctx: RiskFilterContext
): RiskFilterResult {
  try {
    // Build portfolio snapshot
    const startingEq = ctx.startingEquity || ctx.botSettings.total_capital;
    const peakEq = ctx.peakEquity || startingEq;
    const { peakEquity: updatedPeak } = updatePeakEquity(ctx.currentEquity, peakEq);
    
    // Calculate daily PnL
    const dailyPnLData = calculateDailyPnL(ctx.trades, ctx.currentEquity, startingEq);
    
    // Calculate drawdown
    const drawdown = calculateDrawdown(ctx.currentEquity, updatedPeak);
    
    // Calculate exposure
    const exposureData = calculateTotalExposure(ctx.trades, ctx.currentEquity);
    
    // Build portfolio snapshot
    const portfolioSnapshot = {
      totalBalance: ctx.currentEquity,
      usdBalance: ctx.currentEquity,
      equity: ctx.currentEquity,
      activeTradesCount: ctx.trades.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING').length,
      totalExposure: exposureData.totalExposure,
      dailyPnL: dailyPnLData.dailyPnL,
      currentDrawdown: drawdown.currentDrawdownPercentage,
      maxDrawdown: ctx.botSettings.max_drawdown_pct || 20.0,
      peakEquity: updatedPeak
    };
    
    // Convert SignalForRiskEvaluation to GeneratedSignal for RiskEvaluationContext
    const generatedSignal: GeneratedSignal = {
      user_id: ctx.userId || '',
      source: 'internal_engine',
      symbol: ctx.signal.symbol,
      side: ctx.signal.side,
      timeframe: '1h', // Default timeframe
      price_at_signal: ctx.signal.price_at_signal,
      confidence: ctx.signal.confidence || 50,
      riskLevel: 'MEDIUM', // Default risk level
      reason: 'Auto-trader signal',
      meta: {
        strategyId: 'auto_trader',
        strategyName: 'Auto Trader',
        indicatorsSnapshot: {
          rsi: 50,
          macd: {
            line: 0,
            signal: 0,
            histogram: 0,
            trend: 'NEUTRAL' as const,
          },
          bollingerBands: {
            upper: 0,
            middle: 0,
            lower: 0,
            squeeze: false,
            position: 'BETWEEN' as const,
          },
          stochastic: {
            k: 50,
            d: 50,
            signal: 'NEUTRAL' as const,
          },
          williams: -50,
          cci: 0,
          adx: {
            value: 0,
            trend_strength: 'WEAK' as const,
          },
        },
        confidenceFactors: {
          rsi: 0,
          macd: 0,
          trend: 0,
          volume: 0,
          pattern: 0,
        },
        reasoning: [],
      },
    };

    // Build risk evaluation context
    const riskCtx: RiskEvaluationContext = {
      signal: generatedSignal,
      botSettings: ctx.botSettings,
      portfolioSnapshot,
      openPositions: ctx.positions,
      openTrades: ctx.trades,
      lastRiskSnapshot: ctx.lastRiskSnapshot,
      indicators: ctx.indicators,
      marketData: {
        symbol: ctx.signal.symbol,
        currentPrice: ctx.signal.price_at_signal
      }
    };
    
    // Evaluate risk
    const riskResult = RiskEngine.evaluateRisk(riskCtx);
    
    // Convert to filter result
    return {
      passed: riskResult.allowed,
      reason: riskResult.reason,
      adjustedCapital: riskResult.adjustedCapital,
      flags: riskResult.flags,
      riskLevel: riskResult.riskLevel
    };
    
  } catch (error) {
    console.error('Error in risk filters:', error);
    // Fail safe: deny if error
    return {
      passed: false,
      reason: `Risk evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      flags: ['RISK_EVALUATION_ERROR'],
      riskLevel: 'CRITICAL'
    };
  }
}

/**
 * Check if kill switch is active (quick check)
 */
export function checkKillSwitchActive(killSwitchState?: any): boolean {
  if (!killSwitchState) return false;
  return isKillSwitchActive(killSwitchState);
}

