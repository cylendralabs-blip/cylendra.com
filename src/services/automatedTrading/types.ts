/**
 * Automated Trading Types
 * 
 * Type definitions for automated trading system
 */

/**
 * Signal Source
 */
export type SignalSource = 'tradingview' | 'internal_engine';

/**
 * Execution Status
 */
export type ExecutionStatus = 
  | 'PENDING' 
  | 'FILTERED' 
  | 'EXECUTING' 
  | 'EXECUTED' 
  | 'FAILED' 
  | 'IGNORED';

/**
 * Filter Result
 */
export interface FilterResult {
  passed: boolean;
  reason?: string;
  code?: string;
}

/**
 * Signal for Processing
 */
export interface ProcessingSignal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  entry_price: number;
  stop_loss_price?: number | null;
  take_profit_price?: number | null;
  confidence_score: number;
  strategy_name: string;
  timeframe: string;
  created_at: string;
  execution_status?: ExecutionStatus;
  execution_reason?: string | null;
}

/**
 * Bot Settings for Filtering
 */
export interface FilterBotSettings {
  is_active: boolean;
  market_type: 'spot' | 'futures';
  max_active_trades: number;
  allow_long_trades: boolean;
  allow_short_trades: boolean;
  default_platform?: string | null;
  total_capital?: number | null;
}

/**
 * Filter Context
 */
export interface FilterContext {
  signal: ProcessingSignal;
  botSettings: FilterBotSettings;
  activeTradesCount: number;
  exchangeHealth: boolean;
  lastTradeTime?: Date;
  allowedSymbols?: string[];
  blacklistSymbols?: string[];
}

/**
 * Execution Event
 */
export interface ExecutionEvent {
  signal_id: string;
  user_id: string;
  event_type: 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED';
  reason?: string;
  trade_id?: string;
  error?: string;
  timestamp: Date;
}

