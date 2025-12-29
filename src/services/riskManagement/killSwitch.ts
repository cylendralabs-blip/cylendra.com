/**
 * Kill Switch Engine
 * 
 * Automatic and manual kill switch functionality
 * Phase 5: Risk Management Engine (Advanced)
 */

/**
 * Kill Switch State
 */
export interface KillSwitchState {
  user_id?: string; // null for system-wide kill switch
  is_active: boolean;
  reason: string;
  triggered_at: string;
  triggered_by: 'automatic' | 'manual' | 'admin';
  cooldown_minutes: number;
  expires_at?: string;
  can_reset: boolean;
}

/**
 * Kill Switch Trigger Reasons
 */
export enum KillSwitchReason {
  DAILY_LOSS_LIMIT_EXCEEDED = 'Daily loss limit exceeded',
  MAX_DRAWDOWN_EXCEEDED = 'Max drawdown exceeded',
  EXPOSURE_LIMIT_EXCEEDED = 'Exposure limit exceeded',
  VOLATILITY_TOO_HIGH = 'Volatility too high',
  MANUAL_TRIGGER = 'Manual kill switch activated',
  ADMIN_TRIGGER = 'Admin kill switch activated',
  SYSTEM_ERROR = 'System error detected'
}

/**
 * Check if kill switch is active
 */
export function isKillSwitchActive(
  killSwitchState?: KillSwitchState
): boolean {
  if (!killSwitchState) return false;
  
  if (!killSwitchState.is_active) return false;

  // Check if cooldown expired
  if (killSwitchState.expires_at) {
    const expiresAt = new Date(killSwitchState.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      // Cooldown expired, kill switch should be reset
      return false;
    }
  }

  return true;
}

/**
 * Create kill switch state
 */
export function createKillSwitchState(
  reason: KillSwitchReason,
  triggeredBy: 'automatic' | 'manual' | 'admin',
  cooldownMinutes: number,
  userId?: string
): KillSwitchState {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cooldownMinutes * 60 * 1000);

  return {
    user_id: userId,
    is_active: true,
    reason: reason.toString(),
    triggered_at: now.toISOString(),
    triggered_by: triggeredBy,
    cooldown_minutes: cooldownMinutes,
    expires_at: expiresAt.toISOString(),
    can_reset: triggeredBy === 'manual' || triggeredBy === 'admin'
  };
}

/**
 * Reset kill switch
 */
export function resetKillSwitch(
  currentState?: KillSwitchState
): KillSwitchState | null {
  if (!currentState || !currentState.can_reset) {
    return null;
  }

  return {
    ...currentState,
    is_active: false,
    expires_at: undefined
  };
}

/**
 * Auto-trigger kill switch based on risk conditions
 */
export function shouldTriggerKillSwitch(
  dailyLossExceeded: boolean,
  drawdownExceeded: boolean,
  exposureExceeded: boolean,
  volatilityTooHigh: boolean,
  killSwitchEnabled: boolean
): {
  shouldTrigger: boolean;
  reason?: KillSwitchReason;
} {
  if (!killSwitchEnabled) {
    return { shouldTrigger: false };
  }

  // Priority order: drawdown > daily loss > exposure > volatility
  if (drawdownExceeded) {
    return {
      shouldTrigger: true,
      reason: KillSwitchReason.MAX_DRAWDOWN_EXCEEDED
    };
  }

  if (dailyLossExceeded) {
    return {
      shouldTrigger: true,
      reason: KillSwitchReason.DAILY_LOSS_LIMIT_EXCEEDED
    };
  }

  if (exposureExceeded) {
    return {
      shouldTrigger: true,
      reason: KillSwitchReason.EXPOSURE_LIMIT_EXCEEDED
    };
  }

  if (volatilityTooHigh) {
    return {
      shouldTrigger: true,
      reason: KillSwitchReason.VOLATILITY_TOO_HIGH
    };
  }

  return { shouldTrigger: false };
}

/**
 * Get kill switch message
 */
export function getKillSwitchMessage(
  killSwitchState: KillSwitchState
): string {
  const { reason, triggered_by, expires_at } = killSwitchState;

  let message = `Kill switch is active. Reason: ${reason}.`;

  if (expires_at) {
    const expiresAt = new Date(expires_at);
    const now = new Date();
    const minutesLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60));
    
    if (minutesLeft > 0) {
      message += ` Cooldown: ${minutesLeft} minutes remaining.`;
    } else {
      message += ` Cooldown expired. Ready to reset.`;
    }
  }

  return message;
}

