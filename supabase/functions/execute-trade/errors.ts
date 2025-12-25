/**
 * Unified Error System
 * 
 * Standardized error codes and handling for execute-trade
 */

/**
 * Error Codes
 */
export enum ExecuteTradeErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_USER = 'INVALID_USER',
  API_KEY_NOT_FOUND = 'API_KEY_NOT_FOUND',
  API_KEY_INVALID = 'API_KEY_INVALID',
  EXCHANGE_AUTH_FAILED = 'EXCHANGE_AUTH_FAILED',
  
  // Exchange & Symbol
  EXCHANGE_NOT_SUPPORTED = 'EXCHANGE_NOT_SUPPORTED',
  SYMBOL_NOT_SUPPORTED = 'SYMBOL_NOT_SUPPORTED',
  SYMBOL_INFO_FAILED = 'SYMBOL_INFO_FAILED',
  MARKET_TYPE_INVALID = 'MARKET_TYPE_INVALID',
  
  // Balance & Capital
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  BALANCE_FETCH_FAILED = 'BALANCE_FETCH_FAILED',
  
  // Order Validation
  MIN_NOTIONAL_FAIL = 'MIN_NOTIONAL_FAIL',
  PRECISION_FAIL = 'PRECISION_FAIL',
  QUANTITY_TOO_SMALL = 'QUANTITY_TOO_SMALL',
  PRICE_INVALID = 'PRICE_INVALID',
  ORDER_VALIDATION_FAILED = 'ORDER_VALIDATION_FAILED',
  
  // Order Execution
  ORDER_PLACEMENT_FAILED = 'ORDER_PLACEMENT_FAILED',
  ORDER_CANCEL_FAILED = 'ORDER_CANCEL_FAILED',
  PARTIAL_FILL_FAILED = 'PARTIAL_FILL_FAILED',
  
  // Rate Limits
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Network
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  EXCHANGE_UNAVAILABLE = 'EXCHANGE_UNAVAILABLE',
  
  // Retry & Idempotency
  IDEMPOTENCY_KEY_INVALID = 'IDEMPOTENCY_KEY_INVALID',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
  
  // Leverage
  LEVERAGE_SET_FAILED = 'LEVERAGE_SET_FAILED',
  LEVERAGE_INVALID = 'LEVERAGE_INVALID',
  
  // Internal
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Error Details
 */
export interface ErrorDetails {
  code: ExecuteTradeErrorCode;
  message: string;
  details?: any;
  retryable?: boolean;
  statusCode?: number;
}

/**
 * Execute Trade Error Class
 */
export class ExecuteTradeError extends Error {
  public code: ExecuteTradeErrorCode;
  public details?: any;
  public retryable: boolean;
  public statusCode: number;

  constructor(
    code: ExecuteTradeErrorCode,
    message: string,
    details?: any,
    retryable: boolean = false,
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'ExecuteTradeError';
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }

  /**
   * Convert to response format
   */
  toResponse() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable
    };
  }
}

/**
 * Create error from code
 */
export function createError(
  code: ExecuteTradeErrorCode,
  message?: string,
  details?: any
): ExecuteTradeError {
  const errorMessages: Record<ExecuteTradeErrorCode, string> = {
    [ExecuteTradeErrorCode.AUTH_REQUIRED]: 'Authentication required',
    [ExecuteTradeErrorCode.INVALID_USER]: 'Invalid user',
    [ExecuteTradeErrorCode.API_KEY_NOT_FOUND]: 'API key not found',
    [ExecuteTradeErrorCode.API_KEY_INVALID]: 'API key is invalid',
    [ExecuteTradeErrorCode.EXCHANGE_AUTH_FAILED]: 'Exchange authentication failed',
    [ExecuteTradeErrorCode.EXCHANGE_NOT_SUPPORTED]: 'Exchange not supported',
    [ExecuteTradeErrorCode.SYMBOL_NOT_SUPPORTED]: 'Symbol not supported',
    [ExecuteTradeErrorCode.SYMBOL_INFO_FAILED]: 'Failed to get symbol information',
    [ExecuteTradeErrorCode.MARKET_TYPE_INVALID]: 'Invalid market type',
    [ExecuteTradeErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance',
    [ExecuteTradeErrorCode.BALANCE_FETCH_FAILED]: 'Failed to fetch balance',
    [ExecuteTradeErrorCode.MIN_NOTIONAL_FAIL]: 'Order value is below exchange minimum',
    [ExecuteTradeErrorCode.PRECISION_FAIL]: 'Quantity or price precision validation failed',
    [ExecuteTradeErrorCode.QUANTITY_TOO_SMALL]: 'Quantity is too small',
    [ExecuteTradeErrorCode.PRICE_INVALID]: 'Price is invalid',
    [ExecuteTradeErrorCode.ORDER_VALIDATION_FAILED]: 'Order validation failed',
    [ExecuteTradeErrorCode.ORDER_PLACEMENT_FAILED]: 'Failed to place order',
    [ExecuteTradeErrorCode.ORDER_CANCEL_FAILED]: 'Failed to cancel order',
    [ExecuteTradeErrorCode.PARTIAL_FILL_FAILED]: 'Failed to handle partial fill',
    [ExecuteTradeErrorCode.RATE_LIMITED]: 'Rate limit exceeded',
    [ExecuteTradeErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
    [ExecuteTradeErrorCode.NETWORK_TIMEOUT]: 'Network timeout',
    [ExecuteTradeErrorCode.NETWORK_ERROR]: 'Network error',
    [ExecuteTradeErrorCode.EXCHANGE_UNAVAILABLE]: 'Exchange is unavailable',
    [ExecuteTradeErrorCode.IDEMPOTENCY_KEY_INVALID]: 'Invalid idempotency key',
    [ExecuteTradeErrorCode.DUPLICATE_ORDER]: 'Duplicate order detected',
    [ExecuteTradeErrorCode.RETRY_EXHAUSTED]: 'Retry attempts exhausted',
    [ExecuteTradeErrorCode.LEVERAGE_SET_FAILED]: 'Failed to set leverage',
    [ExecuteTradeErrorCode.LEVERAGE_INVALID]: 'Invalid leverage value',
    [ExecuteTradeErrorCode.DATABASE_ERROR]: 'Database error',
    [ExecuteTradeErrorCode.VALIDATION_ERROR]: 'Validation error',
    [ExecuteTradeErrorCode.INTERNAL_ERROR]: 'Internal error'
  };

  const retryableCodes: ExecuteTradeErrorCode[] = [
    ExecuteTradeErrorCode.RATE_LIMITED,
    ExecuteTradeErrorCode.NETWORK_TIMEOUT,
    ExecuteTradeErrorCode.NETWORK_ERROR,
    ExecuteTradeErrorCode.EXCHANGE_UNAVAILABLE,
    ExecuteTradeErrorCode.TOO_MANY_REQUESTS
  ];

  const statusCodes: Record<ExecuteTradeErrorCode, number> = {
    [ExecuteTradeErrorCode.AUTH_REQUIRED]: 401,
    [ExecuteTradeErrorCode.INVALID_USER]: 401,
    [ExecuteTradeErrorCode.API_KEY_NOT_FOUND]: 404,
    [ExecuteTradeErrorCode.API_KEY_INVALID]: 403,
    [ExecuteTradeErrorCode.EXCHANGE_AUTH_FAILED]: 403,
    [ExecuteTradeErrorCode.EXCHANGE_NOT_SUPPORTED]: 400,
    [ExecuteTradeErrorCode.SYMBOL_NOT_SUPPORTED]: 400,
    [ExecuteTradeErrorCode.SYMBOL_INFO_FAILED]: 500,
    [ExecuteTradeErrorCode.MARKET_TYPE_INVALID]: 400,
    [ExecuteTradeErrorCode.INSUFFICIENT_BALANCE]: 400,
    [ExecuteTradeErrorCode.BALANCE_FETCH_FAILED]: 500,
    [ExecuteTradeErrorCode.MIN_NOTIONAL_FAIL]: 400,
    [ExecuteTradeErrorCode.PRECISION_FAIL]: 400,
    [ExecuteTradeErrorCode.QUANTITY_TOO_SMALL]: 400,
    [ExecuteTradeErrorCode.PRICE_INVALID]: 400,
    [ExecuteTradeErrorCode.ORDER_VALIDATION_FAILED]: 400,
    [ExecuteTradeErrorCode.ORDER_PLACEMENT_FAILED]: 500,
    [ExecuteTradeErrorCode.ORDER_CANCEL_FAILED]: 500,
    [ExecuteTradeErrorCode.PARTIAL_FILL_FAILED]: 500,
    [ExecuteTradeErrorCode.RATE_LIMITED]: 429,
    [ExecuteTradeErrorCode.TOO_MANY_REQUESTS]: 429,
    [ExecuteTradeErrorCode.NETWORK_TIMEOUT]: 504,
    [ExecuteTradeErrorCode.NETWORK_ERROR]: 502,
    [ExecuteTradeErrorCode.EXCHANGE_UNAVAILABLE]: 503,
    [ExecuteTradeErrorCode.IDEMPOTENCY_KEY_INVALID]: 400,
    [ExecuteTradeErrorCode.DUPLICATE_ORDER]: 409,
    [ExecuteTradeErrorCode.RETRY_EXHAUSTED]: 500,
    [ExecuteTradeErrorCode.LEVERAGE_SET_FAILED]: 500,
    [ExecuteTradeErrorCode.LEVERAGE_INVALID]: 400,
    [ExecuteTradeErrorCode.DATABASE_ERROR]: 500,
    [ExecuteTradeErrorCode.VALIDATION_ERROR]: 400,
    [ExecuteTradeErrorCode.INTERNAL_ERROR]: 500
  };

  return new ExecuteTradeError(
    code,
    message || errorMessages[code],
    details,
    retryableCodes.includes(code),
    statusCodes[code]
  );
}

/**
 * Parse exchange error to unified error
 */
export function parseExchangeError(
  error: any,
  exchange: 'binance' | 'okx'
): ExecuteTradeError {
  const errorMsg = error?.message || String(error);
  const errorCode = error?.code || 0;

  // Binance errors
  if (exchange === 'binance') {
    if (errorCode === -2010 || errorMsg.includes('insufficient balance')) {
      return createError(
        ExecuteTradeErrorCode.INSUFFICIENT_BALANCE,
        'Insufficient balance',
        error
      );
    }
    
    if (errorCode === -1121 || errorMsg.includes('invalid symbol')) {
      return createError(
        ExecuteTradeErrorCode.SYMBOL_NOT_SUPPORTED,
        'Symbol not supported',
        error
      );
    }
    
    if (errorCode === -1022 || errorMsg.includes('signature')) {
      return createError(
        ExecuteTradeErrorCode.EXCHANGE_AUTH_FAILED,
        'Exchange authentication failed',
        error
      );
    }
    
    if (errorCode === -1013 || errorMsg.includes('MIN_NOTIONAL')) {
      return createError(
        ExecuteTradeErrorCode.MIN_NOTIONAL_FAIL,
        'Order value is below exchange minimum',
        error
      );
    }
    
    if (errorCode === -1111 || errorMsg.includes('precision')) {
      return createError(
        ExecuteTradeErrorCode.PRECISION_FAIL,
        'Quantity or price precision validation failed',
        error
      );
    }
    
    if (errorCode === -1003 || errorMsg.includes('rate limit')) {
      return createError(
        ExecuteTradeErrorCode.RATE_LIMITED,
        'Rate limit exceeded',
        error
      );
    }
  }

  // OKX errors
  if (exchange === 'okx') {
    if (errorCode === '51000' || errorMsg.includes('insufficient')) {
      return createError(
        ExecuteTradeErrorCode.INSUFFICIENT_BALANCE,
        'Insufficient balance',
        error
      );
    }
    
    if (errorCode === '51001' || errorMsg.includes('invalid')) {
      return createError(
        ExecuteTradeErrorCode.SYMBOL_NOT_SUPPORTED,
        'Symbol not supported',
        error
      );
    }
  }

  // Default to internal error
  return createError(
    ExecuteTradeErrorCode.INTERNAL_ERROR,
    errorMsg,
    error
  );
}


