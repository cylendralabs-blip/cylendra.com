/**
 * Drawdown Calculator
 * 
 * Calculates and tracks drawdown
 * Phase 5: Risk Management Engine (Advanced)
 */

/**
 * Drawdown Snapshot
 */
export interface DrawdownSnapshot {
  user_id: string;
  timestamp: string;
  peak_equity: number;
  current_equity: number;
  current_drawdown: number;
  current_drawdown_percentage: number;
  max_drawdown: number;
  max_drawdown_percentage: number;
  drawdown_duration_days: number;
  peak_date: string;
  recovery_needed: number;
}

/**
 * Calculate drawdown
 */
export function calculateDrawdown(
  currentEquity: number,
  peakEquity: number,
  peakDate?: string
): {
  currentDrawdown: number;
  currentDrawdownPercentage: number;
} {
  if (peakEquity <= 0) {
    return {
      currentDrawdown: 0,
      currentDrawdownPercentage: 0
    };
  }

  const drawdown = peakEquity - currentEquity;
  const drawdownPercentage = (drawdown / peakEquity) * 100;

  return {
    currentDrawdown: Math.max(0, drawdown),
    currentDrawdownPercentage: Math.max(0, drawdownPercentage)
  };
}

/**
 * Check max drawdown limit
 */
export function checkMaxDrawdown(
  currentDrawdownPercentage: number,
  maxDrawdownPct: number
): {
  exceeded: boolean;
  reason?: string;
  flag?: string;
} {
  if (currentDrawdownPercentage >= maxDrawdownPct) {
    return {
      exceeded: true,
      reason: `Max drawdown exceeded: ${currentDrawdownPercentage.toFixed(2)}% >= ${maxDrawdownPct}%`,
      flag: 'MAX_DRAWDOWN_EXCEEDED'
    };
  }

  return { exceeded: false };
}

/**
 * Calculate recovery needed
 */
export function calculateRecoveryNeeded(
  currentEquity: number,
  peakEquity: number
): {
  recoveryAmount: number;
  recoveryPercentage: number;
} {
  if (currentEquity >= peakEquity) {
    return {
      recoveryAmount: 0,
      recoveryPercentage: 0
    };
  }

  const recoveryAmount = peakEquity - currentEquity;
  const recoveryPercentage = (recoveryAmount / currentEquity) * 100;

  return {
    recoveryAmount,
    recoveryPercentage
  };
}

/**
 * Update peak equity
 */
export function updatePeakEquity(
  currentEquity: number,
  currentPeakEquity: number,
  currentPeakDate?: string
): {
  peakEquity: number;
  peakDate: string;
  isNewPeak: boolean;
} {
  if (currentEquity > currentPeakEquity) {
    return {
      peakEquity: currentEquity,
      peakDate: new Date().toISOString(),
      isNewPeak: true
    };
  }

  return {
    peakEquity: currentPeakEquity,
    peakDate: currentPeakDate || new Date().toISOString(),
    isNewPeak: false
  };
}

/**
 * Calculate drawdown duration in days
 */
export function calculateDrawdownDuration(
  peakDate: string,
  currentDate?: string
): number {
  const peak = new Date(peakDate);
  const current = currentDate ? new Date(currentDate) : new Date();
  
  const diffTime = Math.abs(current.getTime() - peak.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Create drawdown snapshot
 */
export function createDrawdownSnapshot(
  userId: string,
  currentEquity: number,
  peakEquity: number,
  peakDate?: string,
  maxDrawdown?: number,
  maxDrawdownPercentage?: number
): DrawdownSnapshot {
  const drawdown = calculateDrawdown(currentEquity, peakEquity, peakDate);
  const recovery = calculateRecoveryNeeded(currentEquity, peakEquity);
  const duration = peakDate ? calculateDrawdownDuration(peakDate) : 0;

  return {
    user_id: userId,
    timestamp: new Date().toISOString(),
    peak_equity: peakEquity,
    current_equity: currentEquity,
    current_drawdown: drawdown.currentDrawdown,
    current_drawdown_percentage: drawdown.currentDrawdownPercentage,
    max_drawdown: maxDrawdown || drawdown.currentDrawdown,
    max_drawdown_percentage: maxDrawdownPercentage || drawdown.currentDrawdownPercentage,
    drawdown_duration_days: duration,
    peak_date: peakDate || new Date().toISOString(),
    recovery_needed: recovery.recoveryAmount
  };
}

