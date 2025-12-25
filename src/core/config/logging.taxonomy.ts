/**
 * Logging Taxonomy
 * 
 * Centralized definitions for log categories and actions
 * Ensures consistent logging across the entire system
 * 
 * Phase 8: Logging + Monitoring + Alerting System - Task 4
 */

/**
 * Log Level
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

/**
 * Log Category
 */
export type LogCategory = 
  | 'signal'
  | 'decision'
  | 'order'
  | 'risk'
  | 'position'
  | 'portfolio'
  | 'system'
  | 'ui';

/**
 * Log Action (organized by category)
 */
export const LOG_ACTIONS = {
  // Signal category
  SIGNAL: {
    RECEIVED: 'SIGNAL_RECEIVED',
    FILTERED: 'SIGNAL_FILTERED',
    APPROVED: 'SIGNAL_APPROVED',
    REJECTED: 'SIGNAL_REJECTED',
    EXPIRED: 'SIGNAL_EXPIRED',
    PROCESSED: 'SIGNAL_PROCESSED'
  },
  
  // Decision category
  DECISION: {
    FILTER_APPLIED: 'FILTER_APPLIED',
    FILTER_SKIPPED: 'FILTER_SKIPPED',
    RISK_CHECK_PASSED: 'RISK_CHECK_PASSED',
    RISK_CHECK_FAILED: 'RISK_CHECK_FAILED',
    DUPLICATE_CHECK_PASSED: 'DUPLICATE_CHECK_PASSED',
    DUPLICATE_CHECK_FAILED: 'DUPLICATE_CHECK_FAILED'
  },
  
  // Order category
  ORDER: {
    CREATE_REQUESTED: 'CREATE_ORDER_REQUESTED',
    CREATE_SUCCESS: 'CREATE_ORDER_SUCCESS',
    CREATE_FAILED: 'CREATE_ORDER_FAILED',
    PARTIAL_FILL: 'ORDER_PARTIAL_FILL',
    FILLED: 'ORDER_FILLED',
    CANCELLED: 'ORDER_CANCELLED',
    FAILED: 'ORDER_FAILED',
    EXPIRED: 'ORDER_EXPIRED',
    SYNC_SUCCESS: 'ORDER_SYNC_SUCCESS',
    SYNC_FAILED: 'ORDER_SYNC_FAILED'
  },
  
  // Risk category
  RISK: {
    CHECK_STARTED: 'RISK_CHECK_STARTED',
    DAILY_LOSS_LIMIT_CHECK: 'DAILY_LOSS_LIMIT_CHECK',
    DRAWDOWN_LIMIT_CHECK: 'DRAWDOWN_LIMIT_CHECK',
    EXPOSURE_LIMIT_CHECK: 'EXPOSURE_LIMIT_CHECK',
    VOLATILITY_CHECK: 'VOLATILITY_CHECK',
    KILL_SWITCH_CHECK: 'KILL_SWITCH_CHECK',
    LIMIT_EXCEEDED: 'RISK_LIMIT_EXCEEDED',
    LIMIT_APPROACHING: 'RISK_LIMIT_APPROACHING',
    KILL_SWITCH_ACTIVATED: 'KILL_SWITCH_ACTIVATED',
    KILL_SWITCH_DEACTIVATED: 'KILL_SWITCH_DEACTIVATED'
  },
  
  // Position category
  POSITION: {
    OPENED: 'POSITION_OPENED',
    DCA_EXECUTED: 'DCA_EXECUTED',
    TP_TRIGGERED: 'TP_TRIGGERED',
    TP_PARTIAL: 'TP_PARTIAL',
    TP_FULL: 'TP_FULL',
    SL_TRIGGERED: 'SL_TRIGGERED',
    TRAILING_SL_UPDATED: 'TRAILING_SL_UPDATED',
    BREAK_EVEN_ACTIVATED: 'BREAK_EVEN_ACTIVATED',
    CLOSING: 'POSITION_CLOSING',
    CLOSED: 'POSITION_CLOSED',
    PNL_UPDATED: 'PNL_UPDATED',
    STATUS_UPDATED: 'POSITION_STATUS_UPDATED'
  },
  
  // Portfolio category
  PORTFOLIO: {
    SYNC_STARTED: 'PORTFOLIO_SYNC_STARTED',
    SYNC_SUCCESS: 'PORTFOLIO_SYNC_SUCCESS',
    SYNC_FAILED: 'PORTFOLIO_SYNC_FAILED',
    SNAPSHOT_CREATED: 'PORTFOLIO_SNAPSHOT_CREATED',
    EQUITY_UPDATED: 'EQUITY_UPDATED',
    EXPOSURE_CALCULATED: 'EXPOSURE_CALCULATED',
    ALLOCATION_CALCULATED: 'ALLOCATION_CALCULATED'
  },
  
  // System category
  SYSTEM: {
    WORKER_STARTED: 'WORKER_STARTED',
    WORKER_COMPLETED: 'WORKER_COMPLETED',
    WORKER_FAILED: 'WORKER_FAILED',
    WORKER_HEARTBEAT: 'WORKER_HEARTBEAT',
    WORKER_HEARTBEAT_FAIL: 'WORKER_HEARTBEAT_FAIL',
    API_CONNECTION_SUCCESS: 'API_CONNECTION_SUCCESS',
    API_CONNECTION_FAILED: 'API_CONNECTION_FAILED',
    API_RATE_LIMIT: 'API_RATE_LIMIT',
    DATABASE_ERROR: 'DATABASE_ERROR',
    CONFIG_UPDATED: 'CONFIG_UPDATED'
  },
  
  // UI category
  UI: {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    SETTINGS_SAVED: 'SETTINGS_SAVED',
    API_KEY_ADDED: 'API_KEY_ADDED',
    API_KEY_REMOVED: 'API_KEY_REMOVED',
    API_KEY_TESTED: 'API_KEY_TESTED',
    BOT_ENABLED: 'BOT_ENABLED',
    BOT_DISABLED: 'BOT_DISABLED',
    DASHBOARD_VIEWED: 'DASHBOARD_VIEWED',
    TRADE_VIEWED: 'TRADE_VIEWED',
    POSITION_VIEWED: 'POSITION_VIEWED'
  }
} as const;

/**
 * Get action by category and key
 */
export function getLogAction(category: LogCategory, actionKey: string): string {
  const categoryActions = LOG_ACTIONS[category.toUpperCase() as keyof typeof LOG_ACTIONS];
  if (!categoryActions) {
    return actionKey;
  }
  return categoryActions[actionKey as keyof typeof categoryActions] || actionKey;
}

/**
 * Get default log level for action
 */
export function getDefaultLogLevel(action: string): LogLevel {
  // Error/Critical actions
  if (
    action.includes('FAILED') ||
    action.includes('ERROR') ||
    action.includes('KILL_SWITCH') ||
    action.includes('LIMIT_EXCEEDED')
  ) {
    return 'error';
  }
  
  // Warning actions
  if (
    action.includes('REJECTED') ||
    action.includes('FILTERED') ||
    action.includes('APPROACHING') ||
    action.includes('RATE_LIMIT')
  ) {
    return 'warn';
  }
  
  // Default to info
  return 'info';
}

/**
 * Validate log category
 */
export function isValidCategory(category: string): category is LogCategory {
  const validCategories: LogCategory[] = [
    'signal',
    'decision',
    'order',
    'risk',
    'position',
    'portfolio',
    'system',
    'ui'
  ];
  return validCategories.includes(category as LogCategory);
}

/**
 * Validate log level
 */
export function isValidLevel(level: string): level is LogLevel {
  const validLevels: LogLevel[] = ['info', 'warn', 'error', 'critical'];
  return validLevels.includes(level as LogLevel);
}

