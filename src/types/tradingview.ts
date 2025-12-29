
export interface TradingViewSignal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  signal_type: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  signal_strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' | 'EXCEPTIONAL';
  confidence_score: number;
  entry_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_reward_ratio: number;
  strategy_name: string;
  alert_message?: string;
  webhook_data: Record<string, any>;
  technical_indicators: Record<string, any>;
  market_conditions: Record<string, any>;
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED';
  result?: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
  profit_loss_percentage: number;
  auto_trade_executed: boolean;
  execution_status?: 'PENDING' | 'FILTERED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'IGNORED';
  execution_reason?: string;
  executed_trade_id?: string;
  execution_attempts?: number;
  execution_scheduled_at?: string;
  execution_started_at?: string;
  execution_completed_at?: string;
  execution_error?: string;
  expires_at?: string;
  triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TradingViewSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  webhook_secret?: string;
  auto_cleanup_enabled: boolean;
  cleanup_days_1m: number;
  cleanup_days_5m: number;
  cleanup_days_15m: number;
  cleanup_days_1h: number;
  cleanup_days_4h: number;
  cleanup_days_1d: number;
  auto_trade_enabled: boolean;
  min_confidence_score: number;
  allowed_symbols: string[];
  allowed_strategies: string[];
  max_daily_signals: number;
  created_at: string;
  updated_at: string;
}

export interface TradingViewWebhookPayload {
  strategy: string;
  symbol: string;
  timeframe: string;
  action: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  price: number;
  stop_loss?: number;
  take_profit?: number;
  confidence?: number;
  indicators?: Record<string, any>;
  conditions?: Record<string, any>;
  message?: string;
  timestamp?: number;
  secret?: string;
}

export interface TradingViewPerformance {
  total_signals: number;
  successful_signals: number;
  failed_signals: number;
  pending_signals: number;
  win_rate: number;
  average_profit: number;
  average_loss: number;
  total_pnl: number;
  by_timeframe: Record<string, number>;
  by_strategy: Record<string, number>;
}
