/**
 * Dynamic Sizing Engine (Enhanced)
 * 
 * Enhanced position sizing based on volatility, performance, and risk
 * Phase 5: Risk Management Engine (Advanced)
 */

import { BotSettingsForm } from '@/core/config';

/**
 * Dynamic Sizing Context
 */
export interface DynamicSizingContext {
  // Base capital
  baseCapital: number;
  
  // Bot settings
  botSettings: BotSettingsForm;
  
  // Volatility data
  volatility?: {
    atr: number;
    atrPercent: number;
    volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    atrAvg: number;
  };
  
  // Performance data
  performance?: {
    winRate: number; // 0-100
    recentStreak: 'WINNING' | 'LOSING' | 'NEUTRAL';
    streakCount: number;
    recentWinRate: number; // Last 10 trades
  };
  
  // Drawdown data
  drawdown?: {
    currentDrawdown: number;
    currentDrawdownPercentage: number;
    maxDrawdownPercentage: number;
    proximityToMax: number; // 0-1 (how close to max drawdown)
  };
  
  // Market data
  marketData?: {
    symbol: string;
    currentPrice: number;
    volume24h?: number;
  };
}

/**
 * Dynamic Sizing Result
 */
export interface DynamicSizingResult {
  adjustedCapital: number;
  positionSize: number;
  reductionFactor: number;
  reductionReasons: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Dynamic Sizing Engine
 * 
 * Adjusts position size based on volatility, performance, and drawdown
 */
export class DynamicSizingEngine {
  /**
   * Calculate dynamic position size
   */
  static calculateDynamicSize(
    ctx: DynamicSizingContext
  ): DynamicSizingResult {
    const { baseCapital, botSettings } = ctx;
    let adjustedCapital = baseCapital;
    let reductionFactor = 1.0;
    const reductionReasons: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    // Start with base position size
    const basePositionSize = baseCapital * (botSettings.risk_percentage / 100);

    // Check sizing mode
    const sizingMode = botSettings.sizing_mode || 'risk_based';

    if (sizingMode === 'fixed') {
      // Fixed sizing - no adjustments
      return {
        adjustedCapital: baseCapital,
        positionSize: basePositionSize,
        reductionFactor: 1.0,
        reductionReasons: [],
        riskLevel: 'LOW'
      };
    }

    // Volatility-adjusted sizing
    if (sizingMode === 'volatility_adjusted' && ctx.volatility) {
      const volatilityAdjustment = this.adjustForVolatility(ctx.volatility);
      adjustedCapital *= volatilityAdjustment.factor;
      reductionFactor *= volatilityAdjustment.factor;
      
      if (volatilityAdjustment.factor < 1.0) {
        reductionReasons.push(volatilityAdjustment.reason);
        
        if (volatilityAdjustment.factor < 0.5) {
          riskLevel = 'HIGH';
        } else if (volatilityAdjustment.factor < 0.7) {
          riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
        }
      }
    }

    // Performance-based sizing
    if (ctx.performance && sizingMode === 'risk_based') {
      const performanceAdjustment = this.adjustForPerformance(ctx.performance);
      adjustedCapital *= performanceAdjustment.factor;
      reductionFactor *= performanceAdjustment.factor;
      
      if (performanceAdjustment.factor < 1.0) {
        reductionReasons.push(performanceAdjustment.reason);
        riskLevel = performanceAdjustment.factor < 0.7 ? 'HIGH' : 'MEDIUM';
      }
    }

    // Drawdown-based sizing
    if (ctx.drawdown && sizingMode === 'risk_based') {
      const drawdownAdjustment = this.adjustForDrawdown(ctx.drawdown, botSettings.max_drawdown_pct || 20);
      adjustedCapital *= drawdownAdjustment.factor;
      reductionFactor *= drawdownAdjustment.factor;
      
      if (drawdownAdjustment.factor < 1.0) {
        reductionReasons.push(drawdownAdjustment.reason);
        
        if (drawdownAdjustment.factor < 0.6) {
          riskLevel = 'CRITICAL';
        } else if (drawdownAdjustment.factor < 0.8) {
          riskLevel = 'HIGH';
        }
      }
    }

    // Calculate final position size
    const positionSize = adjustedCapital * (botSettings.risk_percentage / 100);

    // Ensure minimum position size (1% of base capital)
    const minPositionSize = baseCapital * 0.01;
    const finalPositionSize = Math.max(positionSize, minPositionSize);

    // Ensure maximum position size (don't exceed base size + 20% buffer)
    const maxPositionSize = basePositionSize * 1.2;
    const finalAdjustedSize = Math.min(finalPositionSize, maxPositionSize);

    return {
      adjustedCapital: (finalAdjustedSize / (botSettings.risk_percentage / 100)),
      positionSize: finalAdjustedSize,
      reductionFactor,
      reductionReasons,
      riskLevel
    };
  }

  /**
   * Adjust for volatility
   */
  private static adjustForVolatility(
    volatility: DynamicSizingContext['volatility']
  ): { factor: number; reason?: string } {
    if (!volatility) {
      return { factor: 1.0 };
    }

    const { atrPercent, volatilityLevel, atr, atrAvg } = volatility;

    // High volatility - reduce position size
    if (volatilityLevel === 'EXTREME') {
      return {
        factor: 0.5, // 50% of normal size
        reason: `Extreme volatility detected (ATR: ${atrPercent.toFixed(2)}%). Position size reduced by 50%.`
      };
    }

    if (volatilityLevel === 'HIGH') {
      return {
        factor: 0.7, // 70% of normal size
        reason: `High volatility detected (ATR: ${atrPercent.toFixed(2)}%). Position size reduced by 30%.`
      };
    }

    // Moderate volatility - slight reduction
    if (volatilityLevel === 'MEDIUM') {
      return {
        factor: 0.9, // 90% of normal size
        reason: `Moderate volatility detected. Position size reduced by 10%.`
      };
    }

    // Low volatility - normal or slightly increased size
    return { factor: 1.0 };
  }

  /**
   * Adjust for performance
   */
  private static adjustForPerformance(
    performance: DynamicSizingContext['performance']
  ): { factor: number; reason?: string } {
    if (!performance) {
      return { factor: 1.0 };
    }

    const { recentStreak, streakCount, recentWinRate } = performance;

    // Losing streak - reduce position size
    if (recentStreak === 'LOSING') {
      if (streakCount >= 5) {
        return {
          factor: 0.5, // 50% of normal size
          reason: `Losing streak detected (${streakCount} losses). Position size reduced by 50%.`
        };
      }
      
      if (streakCount >= 3) {
        return {
          factor: 0.7, // 70% of normal size
          reason: `Losing streak detected (${streakCount} losses). Position size reduced by 30%.`
        };
      }
    }

    // Low win rate - reduce size
    if (recentWinRate < 30) {
      return {
        factor: 0.6, // 60% of normal size
        reason: `Low win rate detected (${recentWinRate.toFixed(1)}%). Position size reduced by 40%.`
      };
    }

    // Winning streak - can slightly increase (but cap at 110%)
    if (recentStreak === 'WINNING' && streakCount >= 5 && recentWinRate > 70) {
      return {
        factor: 1.1, // 110% of normal size (max increase)
        reason: `Winning streak detected (${streakCount} wins). Position size increased by 10%.`
      };
    }

    return { factor: 1.0 };
  }

  /**
   * Adjust for drawdown
   */
  private static adjustForDrawdown(
    drawdown: DynamicSizingContext['drawdown'],
    maxDrawdownPct: number
  ): { factor: number; reason?: string } {
    if (!drawdown) {
      return { factor: 1.0 };
    }

    const { currentDrawdownPercentage, proximityToMax } = drawdown;

    // Near max drawdown - significant reduction
    if (proximityToMax > 0.9) {
      return {
        factor: 0.4, // 40% of normal size
        reason: `Near max drawdown (${currentDrawdownPercentage.toFixed(2)}% / ${maxDrawdownPct}%). Position size reduced by 60%.`
      };
    }

    if (proximityToMax > 0.8) {
      return {
        factor: 0.6, // 60% of normal size
        reason: `Close to max drawdown (${currentDrawdownPercentage.toFixed(2)}% / ${maxDrawdownPct}%). Position size reduced by 40%.`
      };
    }

    if (proximityToMax > 0.7) {
      return {
        factor: 0.8, // 80% of normal size
        reason: `Approaching max drawdown (${currentDrawdownPercentage.toFixed(2)}% / ${maxDrawdownPct}%). Position size reduced by 20%.`
      };
    }

    // Moderate drawdown - slight reduction
    if (currentDrawdownPercentage > maxDrawdownPct * 0.5) {
      return {
        factor: 0.9, // 90% of normal size
        reason: `Moderate drawdown (${currentDrawdownPercentage.toFixed(2)}%). Position size reduced by 10%.`
      };
    }

    return { factor: 1.0 };
  }

  /**
   * Calculate proximity to max drawdown
   */
  static calculateDrawdownProximity(
    currentDrawdown: number,
    maxDrawdown: number
  ): number {
    if (maxDrawdown <= 0) return 0;
    
    const proximity = Math.min(1.0, currentDrawdown / maxDrawdown);
    return proximity;
  }

  /**
   * Get volatility level from ATR
   */
  static getVolatilityLevel(
    atr: number,
    atrAvg: number,
    currentPrice: number
  ): {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    atrPercent: number;
  } {
    if (currentPrice <= 0) {
      return { level: 'MEDIUM', atrPercent: 0 };
    }

    const atrPercent = (atr / currentPrice) * 100;
    const multiplier = atrAvg > 0 ? atr / atrAvg : 1.0;

    if (multiplier > 3.0 || atrPercent > 10) {
      return { level: 'EXTREME', atrPercent };
    }

    if (multiplier > 2.0 || atrPercent > 5) {
      return { level: 'HIGH', atrPercent };
    }

    if (multiplier > 1.5 || atrPercent > 2) {
      return { level: 'MEDIUM', atrPercent };
    }

    return { level: 'LOW', atrPercent };
  }
}

