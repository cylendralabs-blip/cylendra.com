/**
 * Bot Engine Types
 * 
 * Phase X.6 - Bot Execution Integration with Signal Sources
 */

/**
 * Signal Source Type
 */
export type SignalSourceType = 'ai' | 'tradingview' | 'legacy' | 'realtime_ai';

/**
 * Unified Signal Interface
 * 
 * Standardized signal format that works across all sources
 */
export interface UnifiedSignal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  side: 'BUY' | 'SELL';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
  confidence?: number; // 0-100
  source: SignalSourceType;
  raw?: any; // Original payload from source
  generatedAt: string;
  strategy_name?: string;
  signal_type?: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL'; // For compatibility
}

/**
 * Bot Configuration
 */
export interface BotConfig {
  user_id: string;
  is_active: boolean;
  signal_source: SignalSourceType;
  market_type: 'spot' | 'futures';
  allowed_symbols?: string[];
  blacklist_symbols?: string[];
  min_confidence?: number;
  default_timeframe?: string;
  [key: string]: any;
}

/**
 * Signal Source Adapter Result
 */
export interface SignalAdapterResult {
  signal: UnifiedSignal | null;
  error?: string;
  source: SignalSourceType;
}

