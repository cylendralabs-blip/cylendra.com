/**
 * Position Managers
 * 
 * Inline implementations of DCA, TP, SL, and Auto-Close managers for Edge Function
 * These are simplified versions for Deno Edge Function environment
 * 
 * Phase 6: Position Manager
 */

// Type definitions
interface Position {
  id: string;
  userId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbol: string;
  side: 'buy' | 'sell';
  status: 'open' | 'closing' | 'closed' | 'failed';
  avgEntryPrice: number;
  positionQty: number;
  leverage?: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  riskState: {
    stopLossPrice: number;
    takeProfitPrice: number | null;
    trailing?: {
      enabled: boolean;
      activationPrice: number;
      distance: number;
      currentStopPrice: number;
    };
    partialTp?: {
      levels: Array<{
        price: number;
        percentage: number;
        executed: boolean;
        executedAt?: string;
      }>;
    };
    breakEven?: {
      enabled: boolean;
      triggerPrice: number;
      activated: boolean;
      activatedAt?: string;
    };
  };
  meta: {
    strategyId: string;
    signalId?: string;
  };
  openedAt: string;
  closedAt?: string;
  updatedAt: string;
}

interface ManagerResult {
  action: 'none' | 'update' | 'close';
  position?: Position;
  message?: string;
  error?: string;
}

/**
 * Check if stop loss should be triggered
 */
export function shouldTriggerStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  const slPrice = position.riskState.stopLossPrice;
  
  if (!slPrice || slPrice <= 0) {
    return false;
  }
  
  if (position.side === 'buy') {
    return currentPrice <= slPrice;
  } else {
    return currentPrice >= slPrice;
  }
}

/**
 * Check if take profit should be triggered
 */
export function shouldTriggerTakeProfit(
  position: Position,
  currentPrice: number
): boolean {
  const tpPrice = position.riskState.takeProfitPrice;
  
  if (!tpPrice || tpPrice <= 0) {
    return false;
  }
  
  if (position.side === 'buy') {
    return currentPrice >= tpPrice;
  } else {
    return currentPrice <= tpPrice;
  }
}

/**
 * Check partial TP levels
 */
export function checkPartialTPLevels(
  position: Position,
  currentPrice: number
): ManagerResult {
  const partialTp = position.riskState.partialTp;
  
  if (!partialTp || !partialTp.levels) {
    return { action: 'none' };
  }
  
  // Check each TP level
  for (const level of partialTp.levels) {
    if (level.executed) continue;
    
    const shouldTrigger = position.side === 'buy'
      ? currentPrice >= level.price
      : currentPrice <= level.price;
    
    if (shouldTrigger) {
      // Mark level as executed (in real implementation, would close partial position)
      const updatedLevels = partialTp.levels.map(l =>
        l.price === level.price
          ? { ...l, executed: true, executedAt: new Date().toISOString() }
          : l
      );
      
      return {
        action: 'update',
        position: {
          ...position,
          riskState: {
            ...position.riskState,
            partialTp: {
              ...partialTp,
              levels: updatedLevels
            }
          },
          updatedAt: new Date().toISOString()
        },
        message: `Partial TP level ${level.price} triggered`
      };
    }
  }
  
  return { action: 'none' };
}

/**
 * Update trailing stop loss
 */
export function updateTrailingStopLoss(
  position: Position,
  currentPrice: number,
  highestPrice: number
): ManagerResult {
  const trailing = position.riskState.trailing;
  
  if (!trailing || !trailing.enabled) {
    return { action: 'none' };
  }
  
  // Check if activation price reached
  if (currentPrice < trailing.activationPrice) {
    return { action: 'none' };
  }
  
  // Calculate new trailing stop price
  const distanceAmount = (highestPrice * trailing.distance) / 100;
  const newTrailingStopPrice = highestPrice - distanceAmount;
  
  // Only move stop up (for buy positions) or down (for sell positions)
  const shouldUpdate = position.side === 'buy'
    ? newTrailingStopPrice > trailing.currentStopPrice
    : newTrailingStopPrice < trailing.currentStopPrice;
  
  if (shouldUpdate && newTrailingStopPrice !== trailing.currentStopPrice) {
    return {
      action: 'update',
      position: {
        ...position,
        riskState: {
          ...position.riskState,
          trailing: {
            ...trailing,
            currentStopPrice: newTrailingStopPrice
          },
          stopLossPrice: newTrailingStopPrice
        },
        updatedAt: new Date().toISOString()
      },
      message: `Trailing stop updated to ${newTrailingStopPrice.toFixed(8)}`
    };
  }
  
  return { action: 'none' };
}

/**
 * Update break-even stop loss
 */
export function updateBreakEvenStopLoss(
  position: Position,
  currentPrice: number
): ManagerResult {
  const breakEven = position.riskState.breakEven;
  
  if (!breakEven || !breakEven.enabled || breakEven.activated) {
    return { action: 'none' };
  }
  
  // Check if trigger price reached
  const shouldActivate = position.side === 'buy'
    ? currentPrice >= breakEven.triggerPrice
    : currentPrice <= breakEven.triggerPrice;
  
  if (shouldActivate) {
    // Move stop loss to break-even (avg entry price)
    return {
      action: 'update',
      position: {
        ...position,
        riskState: {
          ...position.riskState,
          breakEven: {
            ...breakEven,
            activated: true,
            activatedAt: new Date().toISOString()
          },
          stopLossPrice: position.avgEntryPrice // Move to break-even
        },
        updatedAt: new Date().toISOString()
      },
      message: 'Break-even activated - SL moved to entry price'
    };
  }
  
  return { action: 'none' };
}

/**
 * Check auto-close rules (kill switch, drawdown, daily loss, liquidation)
 */
export function checkAutoCloseRules(
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
): ManagerResult {
  // Check kill switch (highest priority)
  if (context.isKillSwitchActive) {
    return {
      action: 'close',
      position: {
        ...position,
        status: 'closing',
        updatedAt: new Date().toISOString()
      },
      message: 'Kill switch is active - closing position'
    };
  }
  
  // Check liquidation risk (for futures)
  if (position.marketType === 'futures' && context.liquidationPrice) {
    const distanceToLiquidation = position.side === 'buy'
      ? ((context.currentPrice - context.liquidationPrice) / context.currentPrice) * 100
      : ((context.liquidationPrice - context.currentPrice) / context.currentPrice) * 100;
    
    if (distanceToLiquidation <= 2) { // 2% safety margin
      return {
        action: 'close',
        position: {
          ...position,
          status: 'closing',
          updatedAt: new Date().toISOString()
        },
        message: `Liquidation risk detected: ${distanceToLiquidation.toFixed(2)}% from liquidation`
      };
    }
  }
  
  // Check drawdown limit
  if (context.currentDrawdownPct !== undefined && context.maxDrawdownPct) {
    if (context.currentDrawdownPct >= context.maxDrawdownPct) {
      return {
        action: 'close',
        position: {
          ...position,
          status: 'closing',
          updatedAt: new Date().toISOString()
        },
        message: `Max drawdown limit hit: ${context.currentDrawdownPct.toFixed(2)}% >= ${context.maxDrawdownPct}%`
      };
    }
  }
  
  // Check daily loss limit
  if (context.dailyPnL !== undefined) {
    // Check USD limit
    if (context.maxDailyLossUsd && context.dailyPnL <= -Math.abs(context.maxDailyLossUsd)) {
      return {
        action: 'close',
        position: {
          ...position,
          status: 'closing',
          updatedAt: new Date().toISOString()
        },
        message: `Daily loss limit (USD) hit: ${context.dailyPnL.toFixed(2)} USD <= -${context.maxDailyLossUsd} USD`
      };
    }
    
    // Check percentage limit
    if (context.maxDailyLossPct && context.dailyCapital && context.dailyCapital > 0) {
      const dailyLossPct = (Math.abs(context.dailyPnL) / context.dailyCapital) * 100;
      
      if (dailyLossPct >= context.maxDailyLossPct) {
        return {
          action: 'close',
          position: {
            ...position,
            status: 'closing',
            updatedAt: new Date().toISOString()
          },
          message: `Daily loss limit (%) hit: ${dailyLossPct.toFixed(2)}% >= ${context.maxDailyLossPct}%`
        };
      }
    }
  }
  
  return { action: 'none' };
}

/**
 * Process all managers for a position
 */
export function processPositionManagers(
  position: Position,
  currentPrice: number,
  highestPrice: number,
  context: {
    isKillSwitchActive: boolean;
    currentDrawdownPct?: number;
    maxDrawdownPct?: number;
    dailyPnL?: number;
    maxDailyLossUsd?: number | null;
    maxDailyLossPct?: number | null;
    dailyCapital?: number;
    liquidationPrice?: number | null;
  }
): ManagerResult {
  // 1. Check auto-close rules first (highest priority)
  const autoCloseResult = checkAutoCloseRules(position, {
    ...context,
    currentPrice
  });
  
  if (autoCloseResult.action === 'close') {
    return autoCloseResult;
  }
  
  // 2. Check stop loss
  if (shouldTriggerStopLoss(position, currentPrice)) {
    return {
      action: 'close',
      position: {
        ...position,
        status: 'closing',
        updatedAt: new Date().toISOString()
      },
      message: `Stop loss triggered at ${currentPrice} (SL: ${position.riskState.stopLossPrice})`
    };
  }
  
  // 3. Check take profit
  if (shouldTriggerTakeProfit(position, currentPrice)) {
    return {
      action: 'close',
      position: {
        ...position,
        status: 'closing',
        updatedAt: new Date().toISOString()
      },
      message: `Take profit triggered at ${currentPrice} (TP: ${position.riskState.takeProfitPrice})`
    };
  }
  
  // 4. Check partial TP levels
  const partialTPResult = checkPartialTPLevels(position, currentPrice);
  if (partialTPResult.action === 'update') {
    // Continue processing other managers with updated position
    position = partialTPResult.position || position;
  }
  
  // 5. Update trailing stop loss
  const trailingResult = updateTrailingStopLoss(position, currentPrice, highestPrice);
  if (trailingResult.action === 'update') {
    position = trailingResult.position || position;
  }
  
  // 6. Update break-even stop loss
  const breakEvenResult = updateBreakEvenStopLoss(position, currentPrice);
  if (breakEvenResult.action === 'update') {
    position = breakEvenResult.position || position;
  }
  
  // Return most important action
  if (breakEvenResult.action === 'update') {
    return breakEvenResult;
  }
  
  if (trailingResult.action === 'update') {
    return trailingResult;
  }
  
  if (partialTPResult.action === 'update') {
    return partialTPResult;
  }
  
  return { action: 'none' };
}

