/**
 * Shared Types for Supabase Edge Functions
 * 
 * أنواع موحدة لجميع Edge Functions
 * 
 * Phase 1: تنظيم Supabase Functions
 */

/**
 * Standard Request Payload
 */
export interface StandardRequest {
  user_id?: string; // سيتم الحصول عليه من JWT token
  action?: string;
  data?: any;
  metadata?: {
    timestamp?: string;
    version?: string;
    source?: string;
  };
}

/**
 * Standard Response
 */
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    execution_time_ms: number;
    timestamp: string;
    function_name?: string;
  };
}

/**
 * Create Success Response
 */
export function createSuccessResponse<T>(
  data: T,
  functionName?: string,
  startTime?: number
): StandardResponse<T> {
  const executionTime = startTime ? Date.now() - startTime : 0;
  
  return {
    success: true,
    data,
    metadata: {
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      function_name: functionName
    }
  };
}

/**
 * Create Error Response
 */
export function createErrorResponse(
  error: Error | string,
  code: string = 'INTERNAL_ERROR',
  functionName?: string,
  startTime?: number
): StandardResponse {
  const executionTime = startTime ? Date.now() - startTime : 0;
  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'object' && 'details' in error ? error.details : undefined;
  
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      function_name: functionName
    }
  };
}

/**
 * Execute Trade Request
 */
export interface ExecuteTradeRequest extends StandardRequest {
  platform: string;
  symbol: string;
  marketType: 'spot' | 'futures';
  orderType: 'market' | 'limit';
  tradeDirection: 'long' | 'short';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  initialAmount: number;
  dcaLevels?: Array<{
    level: number;
    targetPrice: number;
    amount: number;
  }>;
  leverage?: number;
  strategy?: string;
  autoExecute?: boolean;
}

/**
 * Execute Trade Response
 */
export interface ExecuteTradeResponse {
  trade_id?: string;
  orders_placed: number;
  orders: Array<{
    order_id: string;
    type: 'entry' | 'stop_loss' | 'take_profit' | 'dca';
    status: 'pending' | 'filled' | 'failed';
  }>;
  message: string;
}

/**
 * Get Balance Request
 */
export interface GetBalanceRequest extends StandardRequest {
  api_key_id: string;
  platform: string;
  market_type: 'spot' | 'futures';
}

/**
 * Get Balance Response
 */
export interface GetBalanceResponse {
  platform: string;
  market_type: 'spot' | 'futures';
  balances: Array<{
    asset: string;
    available: number;
    locked: number;
    total: number;
  }>;
  total_balance_usd: number;
}

/**
 * Sync Trades Request
 */
export interface SyncTradesRequest extends StandardRequest {
  platform: string;
  api_key_id: string;
}

/**
 * Sync Trades Response
 */
export interface SyncTradesResponse {
  platform: string;
  trades_count: number;
  synced_at: string;
  trades?: Array<{
    id: string;
    symbol: string;
    status: string;
  }>;
}

/**
 * TradingView Webhook Request
 */
export interface TradingViewWebhookRequest {
  action?: string;
  symbol?: string;
  price?: number;
  stop_loss?: number;
  take_profit?: number;
  timeframe?: string;
  confidence?: number;
  message?: string;
  strategy?: string;
  indicators?: any;
  conditions?: any;
  [key: string]: any;
}


