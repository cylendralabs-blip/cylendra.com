/**
 * Unified Error Codes System
 * 
 * Phase X.15 - Stability Improvements
 * Standardized error codes for better tracking and debugging
 */

export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  AUTH_REQUIRED = 'AUTH_1001',
  AUTH_INVALID_TOKEN = 'AUTH_1002',
  AUTH_EXPIRED_TOKEN = 'AUTH_1003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1004',

  // Rate Limiting (2xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_2001',
  RATE_LIMIT_TOO_MANY_REQUESTS = 'RATE_2002',

  // API Keys & Exchange (3xxx)
  API_KEY_INVALID = 'API_3001',
  API_KEY_EXPIRED = 'API_3002',
  API_KEY_MISSING = 'API_3003',
  EXCHANGE_CONNECTION_FAILED = 'API_3004',
  EXCHANGE_RATE_LIMIT = 'API_3005',

  // Signal Processing (4xxx)
  SIGNAL_INVALID = 'SIGNAL_4001',
  SIGNAL_EXPIRED = 'SIGNAL_4002',
  SIGNAL_PROCESSING_FAILED = 'SIGNAL_4003',
  INDICATOR_CALCULATION_FAILED = 'SIGNAL_4004',

  // Trade Execution (5xxx)
  TRADE_INSUFFICIENT_BALANCE = 'TRADE_5001',
  TRADE_INVALID_PARAMS = 'TRADE_5002',
  TRADE_EXECUTION_FAILED = 'TRADE_5003',
  TRADE_ORDER_REJECTED = 'TRADE_5004',
  TRADE_POSITION_NOT_FOUND = 'TRADE_5005',

  // Portfolio (6xxx)
  PORTFOLIO_SYNC_FAILED = 'PORTFOLIO_6001',
  PORTFOLIO_DATA_INVALID = 'PORTFOLIO_6002',
  PORTFOLIO_SNAPSHOT_FAILED = 'PORTFOLIO_6003',

  // System & Infrastructure (7xxx)
  SYSTEM_ERROR = 'SYSTEM_7001',
  DATABASE_ERROR = 'SYSTEM_7002',
  WEBSOCKET_ERROR = 'SYSTEM_7003',
  EDGE_FUNCTION_ERROR = 'SYSTEM_7004',
  SERVICE_UNAVAILABLE = 'SYSTEM_7005',

  // Validation (8xxx)
  VALIDATION_ERROR = 'VALID_8001',
  INVALID_INPUT = 'VALID_8002',
  MISSING_REQUIRED_FIELD = 'VALID_8003',

  // Security (9xxx)
  SECURITY_HMAC_INVALID = 'SEC_9001',
  SECURITY_IP_BLOCKED = 'SEC_9002',
  SECURITY_UNAUTHORIZED = 'SEC_9003',
  SECURITY_SUSPICIOUS_ACTIVITY = 'SEC_9004',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Create standardized error object
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: any,
  userId?: string,
  context?: Record<string, any>
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    userId,
    context,
  };
}

/**
 * Error code to HTTP status mapping
 */
export function getHttpStatusFromErrorCode(code: ErrorCode): number {
  const prefix = code.split('_')[0];

  switch (prefix) {
    case 'AUTH':
      return 401;
    case 'RATE':
      return 429;
    case 'API':
    case 'SIGNAL':
    case 'TRADE':
    case 'PORTFOLIO':
      return 400;
    case 'SYSTEM':
      return 500;
    case 'VALID':
      return 422;
    case 'SEC':
      return 403;
    default:
      return 500;
  }
}
