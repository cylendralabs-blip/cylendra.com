/**
 * Auto-Close Rules
 * 
 * Automatic position closing rules based on risk conditions
 * Rules: Kill switch, Drawdown hit, Liquidation risk
 * 
 * Phase 6: Position Manager
 */

import { Position } from '@/core/models/Position';
import { cancelAllPendingOrders } from './slManager';

/**
 * Auto-Close Rule Result
 */
export interface AutoCloseRuleResult {
  /** Whether position should be closed */
  shouldClose: boolean;
  
  /** Reason for closing */
  reason?: string;
  
  /** Updated position */
  position?: Position;
  
  /** Priority (higher = more urgent) */
  priority: number;
  
  /** Message */
  message?: string;
}

/**
 * Check kill switch - close all positions if kill switch is active
 */
export async function checkKillSwitch(
  position: Position,
  isKillSwitchActive: boolean
): Promise<AutoCloseRuleResult> {
  if (!isKillSwitchActive) {
    return {
      shouldClose: false,
      priority: 0
    };
  }
  
  // Cancel all pending orders
  const updatedPosition = cancelAllPendingOrders(position);
  
  return {
    shouldClose: true,
    reason: 'KILL_SWITCH_ACTIVE',
    position: {
      ...updatedPosition,
      status: 'closing' as const,
      updatedAt: new Date().toISOString()
    },
    priority: 10, // Highest priority
    message: 'Kill switch is active - closing position'
  };
}

/**
 * Check drawdown limit - close position if drawdown exceeds limit
 */
export async function checkDrawdownLimit(
  position: Position,
  currentDrawdownPct: number,
  maxDrawdownPct: number
): Promise<AutoCloseRuleResult> {
  if (!maxDrawdownPct || maxDrawdownPct <= 0) {
    return {
      shouldClose: false,
      priority: 0
    };
  }
  
  if (currentDrawdownPct >= maxDrawdownPct) {
    // Cancel all pending orders (including DCA)
    const updatedPosition = cancelAllPendingOrders(position);
    
    return {
      shouldClose: true,
      reason: 'MAX_DRAWDOWN_HIT',
      position: {
        ...updatedPosition,
        status: 'closing' as const,
        updatedAt: new Date().toISOString()
      },
      priority: 9,
      message: `Max drawdown limit hit: ${currentDrawdownPct.toFixed(2)}% >= ${maxDrawdownPct}%`
    };
  }
  
  // If approaching limit, disable new DCA but don't close yet
  const warningThreshold = maxDrawdownPct * 0.8; // 80% of limit
  if (currentDrawdownPct >= warningThreshold) {
    return {
      shouldClose: false,
      priority: 5,
      message: `Approaching drawdown limit: ${currentDrawdownPct.toFixed(2)}% (limit: ${maxDrawdownPct}%)`
    };
  }
  
  return {
    shouldClose: false,
    priority: 0
  };
}

/**
 * Check daily loss limit - close position if daily loss exceeds limit
 */
export async function checkDailyLossLimit(
  position: Position,
  dailyPnL: number,
  maxDailyLossUsd: number | null,
  maxDailyLossPct: number | null,
  dailyCapital: number
): Promise<AutoCloseRuleResult> {
  // Check USD limit
  if (maxDailyLossUsd && dailyPnL <= -Math.abs(maxDailyLossUsd)) {
    const updatedPosition = cancelAllPendingOrders(position);
    
    return {
      shouldClose: true,
      reason: 'DAILY_LOSS_LIMIT_USD',
      position: {
        ...updatedPosition,
        status: 'closing' as const,
        updatedAt: new Date().toISOString()
      },
      priority: 8,
      message: `Daily loss limit (USD) hit: ${dailyPnL.toFixed(2)} USD <= -${maxDailyLossUsd} USD`
    };
  }
  
  // Check percentage limit
  if (maxDailyLossPct && dailyCapital > 0) {
    const dailyLossPct = (Math.abs(dailyPnL) / dailyCapital) * 100;
    
    if (dailyLossPct >= maxDailyLossPct) {
      const updatedPosition = cancelAllPendingOrders(position);
      
      return {
        shouldClose: true,
        reason: 'DAILY_LOSS_LIMIT_PCT',
        position: {
          ...updatedPosition,
          status: 'closing' as const,
          updatedAt: new Date().toISOString()
        },
        priority: 8,
        message: `Daily loss limit (%) hit: ${dailyLossPct.toFixed(2)}% >= ${maxDailyLossPct}%`
      };
    }
  }
  
  return {
    shouldClose: false,
    priority: 0
  };
}

/**
 * Check liquidation risk (for futures) - close immediately if at risk
 */
export async function checkLiquidationRisk(
  position: Position,
  liquidationPrice: number | null,
  currentPrice: number,
  safetyMargin: number = 0.02 // 2% safety margin
): Promise<AutoCloseRuleResult> {
  // Only for futures
  if (position.marketType !== 'futures' || !position.leverage) {
    return {
      shouldClose: false,
      priority: 0
    };
  }
  
  if (!liquidationPrice || liquidationPrice <= 0) {
    return {
      shouldClose: false,
      priority: 0
    };
  }
  
  // Calculate distance to liquidation
  const distanceToLiquidation = position.side === 'buy'
    ? ((currentPrice - liquidationPrice) / currentPrice) * 100
    : ((liquidationPrice - currentPrice) / currentPrice) * 100;
  
  // Close if within safety margin
  if (distanceToLiquidation <= safetyMargin * 100) {
    const updatedPosition = cancelAllPendingOrders(position);
    
    return {
      shouldClose: true,
      reason: 'LIQUIDATION_RISK',
      position: {
        ...updatedPosition,
        status: 'closing' as const,
        updatedAt: new Date().toISOString()
      },
      priority: 10, // Highest priority - immediate close
      message: `Liquidation risk detected: ${distanceToLiquidation.toFixed(2)}% from liquidation price`
    };
  }
  
  // Warning if approaching liquidation
  const warningThreshold = safetyMargin * 2; // 4% for warning
  if (distanceToLiquidation <= warningThreshold * 100) {
    return {
      shouldClose: false,
      priority: 7,
      message: `Approaching liquidation: ${distanceToLiquidation.toFixed(2)}% from liquidation price`
    };
  }
  
  return {
    shouldClose: false,
    priority: 0
  };
}

/**
 * Evaluate all auto-close rules
 */
export async function evaluateAutoCloseRules(
  position: Position,
  context: {
    isKillSwitchActive: boolean;
    currentDrawdownPct?: number;
    maxDrawdownPct?: number;
    dailyPnL?: number;
    maxDailyLossUsd?: number | null;
    maxDailyLossPct?: number | null;
    dailyCapital?: number;
    liquidationPrice?: number | null;
    currentPrice: number;
  }
): Promise<AutoCloseRuleResult> {
  const results: AutoCloseRuleResult[] = [];
  
  // Check kill switch (highest priority)
  const killSwitchResult = await checkKillSwitch(
    position,
    context.isKillSwitchActive
  );
  if (killSwitchResult.shouldClose) {
    return killSwitchResult;
  }
  
  // Check liquidation risk (for futures)
  if (context.liquidationPrice) {
    const liquidationResult = await checkLiquidationRisk(
      position,
      context.liquidationPrice,
      context.currentPrice
    );
    if (liquidationResult.shouldClose) {
      return liquidationResult;
    }
    results.push(liquidationResult);
  }
  
  // Check drawdown limit
  if (context.currentDrawdownPct !== undefined && context.maxDrawdownPct) {
    const drawdownResult = await checkDrawdownLimit(
      position,
      context.currentDrawdownPct,
      context.maxDrawdownPct
    );
    if (drawdownResult.shouldClose) {
      return drawdownResult;
    }
    results.push(drawdownResult);
  }
  
  // Check daily loss limit
  if (context.dailyPnL !== undefined) {
    const dailyLossResult = await checkDailyLossLimit(
      position,
      context.dailyPnL,
      context.maxDailyLossUsd || null,
      context.maxDailyLossPct || null,
      context.dailyCapital || 0
    );
    if (dailyLossResult.shouldClose) {
      return dailyLossResult;
    }
    results.push(dailyLossResult);
  }
  
  // Return highest priority result
  const highestPriorityResult = results.reduce((prev, current) =>
    current.priority > prev.priority ? current : prev,
    { shouldClose: false, priority: 0 } as AutoCloseRuleResult
  );
  
  return highestPriorityResult;
}

