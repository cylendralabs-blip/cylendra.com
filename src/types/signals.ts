
export interface SignalSettings {
  id?: string;
  user_id?: string;
  is_enabled: boolean;
  timeframes: string[];
  symbols: string[];
  min_confidence_score: number;
  enable_ai_analysis: boolean;
  enable_sentiment_analysis: boolean;
  enable_advanced_indicators: boolean;
  cache_duration_minutes: number;
}

export interface TradingSignal {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  signal_strength: 'EXCEPTIONAL' | 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK';
  confidence_score: number;
  entry_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_reward_ratio?: number;
  price_source?: string;
  live_price_timestamp?: string;
  price_validation?: any;
  technical_analysis: any;
  volume_analysis: any;
  pattern_analysis: any;
  ai_analysis: any;
  sentiment_analysis: any;
  confirmations: string[];
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED';
  expires_at?: string;
  triggered_at?: string;
  result?: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
  profit_loss_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedTradingSignal extends TradingSignal {
  // إضافة خصائص محسنة
  auto_trade_executed?: boolean;
  price_timestamp?: string;
  price_verified?: boolean;
  // التأكد من وجود جميع الخصائص المطلوبة
  technical_analysis: {
    rsi?: number;
    macd?: number;
    ema_20?: number;
    ema_50?: number;
    support_level?: number;
    resistance_level?: number;
    trend?: string;
    [key: string]: any;
  };
  volume_analysis: {
    volume_24h?: number;
    volume_avg?: number;
    volume_trend?: string;
    whale_activity?: boolean;
    [key: string]: any;
  };
  pattern_analysis: {
    pattern_type?: string;
    pattern_strength?: number;
    breakout_probability?: number;
    [key: string]: any;
  };
  ai_analysis: {
    prediction?: string;
    confidence?: number;
    market_sentiment?: string;
    risk_assessment?: string;
    [key: string]: any;
  };
  sentiment_analysis: {
    score?: number;
    trend?: string;
    social_sentiment?: string;
    news_sentiment?: string;
    [key: string]: any;
  };
}

export interface SignalPerformance {
  id: string;
  user_id: string;
  date: string;
  total_signals: number;
  successful_signals: number;
  failed_signals: number;
  pending_signals: number;
  win_rate: number;
  average_profit: number;
  average_loss: number;
  total_profit_loss: number;
  by_symbol: any;
  by_timeframe: any;
  by_strength: any;
}

export interface MarketAnalysisData {
  id: string;
  symbol: string;
  timeframe: string;
  analysis_type: 'TECHNICAL' | 'VOLUME' | 'PATTERN' | 'AI' | 'SENTIMENT';
  analysis_data: any;
  confidence_score?: number;
  created_at: string;
}

export interface SignalError {
  id: string;
  user_id?: string;
  analyzer_type: string;
  error_type: string;
  error_message: string;
  symbol?: string;
  timeframe?: string;
  occurred_at: string;
}

// وظائف مساعدة للتحقق من صحة البيانات
export const validateTradingSignal = (signal: any): signal is TradingSignal => {
  return (
    signal &&
    typeof signal.id === 'string' &&
    typeof signal.symbol === 'string' &&
    typeof signal.signal_type === 'string' &&
    typeof signal.confidence_score === 'number' &&
    typeof signal.entry_price === 'number' &&
    signal.technical_analysis &&
    signal.volume_analysis &&
    signal.pattern_analysis &&
    signal.ai_analysis &&
    signal.sentiment_analysis &&
    Array.isArray(signal.confirmations)
  );
};

export const createDefaultAnalysis = () => ({
  technical_analysis: {
    rsi: 50,
    macd: 0,
    ema_20: 0,
    ema_50: 0,
    trend: 'NEUTRAL'
  },
  volume_analysis: {
    volume_24h: 0,
    volume_trend: 'STABLE',
    whale_activity: false
  },
  pattern_analysis: {
    pattern_type: 'NONE',
    pattern_strength: 0,
    breakout_probability: 50
  },
  ai_analysis: {
    prediction: 'NEUTRAL',
    confidence: 50,
    market_sentiment: 'NEUTRAL',
    risk_assessment: 'MODERATE'
  },
  sentiment_analysis: {
    score: 50,
    trend: 'NEUTRAL',
    social_sentiment: 'NEUTRAL',
    news_sentiment: 'NEUTRAL'
  }
});
