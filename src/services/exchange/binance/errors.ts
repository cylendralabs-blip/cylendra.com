/**
 * Binance Exchange Errors
 * 
 * Custom error classes for Binance API operations
 */

/**
 * Base Binance Error
 */
export class BinanceError extends Error {
  public code?: string | number;
  public statusCode?: number;
  public data?: any;

  constructor(
    message: string,
    code?: string | number,
    statusCode?: number,
    data?: any
  ) {
    super(message);
    this.name = 'BinanceError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Binance API Error
 * Thrown when API returns an error response
 */
export class BinanceAPIError extends BinanceError {
  constructor(
    message: string,
    code?: string | number,
    statusCode?: number,
    data?: any
  ) {
    super(message, code, statusCode, data);
    this.name = 'BinanceAPIError';
  }
}

/**
 * Binance Authentication Error
 * Thrown when authentication fails
 */
export class BinanceAuthError extends BinanceError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'BinanceAuthError';
  }
}

/**
 * Binance Network Error
 * Thrown when network request fails
 */
export class BinanceNetworkError extends BinanceError {
  constructor(message: string = 'Network request failed', originalError?: any) {
    super(message, 'NETWORK_ERROR', undefined, originalError);
    this.name = 'BinanceNetworkError';
  }
}

/**
 * Binance Validation Error
 * Thrown when request validation fails
 */
export class BinanceValidationError extends BinanceError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', undefined, { field });
    this.name = 'BinanceValidationError';
  }
}

/**
 * Parse Binance API Error
 */
export function parseBinanceError(error: any): BinanceError {
  if (error instanceof BinanceError) {
    return error;
  }

  if (error.code === -1022 || error.code === -2015) {
    return new BinanceAuthError(error.msg || 'Invalid API key or signature');
  }

  if (error.code === -1003) {
    return new BinanceNetworkError(error.msg || 'Too many requests');
  }

  if (error.statusCode) {
    return new BinanceAPIError(
      error.msg || error.message || 'API request failed',
      error.code,
      error.statusCode,
      error
    );
  }

  if (error.message) {
    return new BinanceError(error.message, error.code);
  }

  return new BinanceError('Unknown error occurred', 'UNKNOWN_ERROR', undefined, error);
}


