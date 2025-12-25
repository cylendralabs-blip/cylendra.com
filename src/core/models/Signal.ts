/**
 * Signal Model
 * 
 * نموذج البيانات للإشارات (Signals)
 * 
 * Phase 1: تنظيم Models
 */

/**
 * Trading Signal - البيانات الأساسية للإشارة
 */
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
  technical_analysis: TechnicalAnalysis;
  volume_analysis: VolumeAnalysis;
  pattern_analysis: PatternAnalysis;
  ai_analysis: AIAnalysis;
  sentiment_analysis: SentimentAnalysis;
  confirmations: string[];
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED';
  expires_at?: string;
  triggered_at?: string;
  result?: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
  profit_loss_percentage?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced Trading Signal - إشارة محسنة مع خصائص إضافية
 */
export interface EnhancedTradingSignal extends TradingSignal {
  auto_trade_executed?: boolean;
  price_timestamp?: string;
  price_verified?: boolean;
}

/**
 * Technical Analysis Data
 */
export interface TechnicalAnalysis {
  rsi?: number;
  macd?: number;
  ema_20?: number;
  ema_50?: number;
  support_level?: number;
  resistance_level?: number;
  trend?: string;
  [key: string]: any;
}

/**
 * Volume Analysis Data
 */
export interface VolumeAnalysis {
  volume_24h?: number;
  volume_avg?: number;
  volume_trend?: string;
  whale_activity?: boolean;
  [key: string]: any;
}

/**
 * Pattern Analysis Data
 */
export interface PatternAnalysis {
  pattern_type?: string;
  pattern_strength?: number;
  breakout_probability?: number;
  [key: string]: any;
}

/**
 * AI Analysis Data
 */
export interface AIAnalysis {
  prediction?: string;
  confidence?: number;
  market_sentiment?: string;
  risk_assessment?: string;
  [key: string]: any;
}

/**
 * Sentiment Analysis Data
 */
export interface SentimentAnalysis {
  score?: number;
  trend?: string;
  social_sentiment?: string;
  news_sentiment?: string;
  [key: string]: any;
}

/**
 * Signal Settings - إعدادات الإشارات
 */
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

/**
 * Convert Database Row to TradingSignal
 */
export function fromDatabaseRow(row: any): TradingSignal {
  return {
    id: row.id,
    user_id: row.user_id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    signal_type: row.signal_type,
    signal_strength: row.signal_strength,
    confidence_score: Number(row.confidence_score),
    entry_price: Number(row.entry_price),
    stop_loss_price: row.stop_loss_price ? Number(row.stop_loss_price) : undefined,
    take_profit_price: row.take_profit_price ? Number(row.take_profit_price) : undefined,
    risk_reward_ratio: row.risk_reward_ratio ? Number(row.risk_reward_ratio) : undefined,
    price_source: row.price_source,
    live_price_timestamp: row.live_price_timestamp,
    price_validation: row.price_validation,
    technical_analysis: row.technical_analysis || {},
    volume_analysis: row.volume_analysis || {},
    pattern_analysis: row.pattern_analysis || {},
    ai_analysis: row.ai_analysis || {},
    sentiment_analysis: row.sentiment_analysis || {},
    confirmations: row.confirmations || [],
    status: row.status,
    expires_at: row.expires_at,
    triggered_at: row.triggered_at,
    result: row.result,
    profit_loss_percentage: row.profit_loss_percentage ? Number(row.profit_loss_percentage) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Convert TradingSignal to Database Row
 */
export function toDatabaseRow(signal: Partial<TradingSignal>): any {
  return {
    ...signal,
    confidence_score: signal.confidence_score?.toString(),
    entry_price: signal.entry_price?.toString(),
    stop_loss_price: signal.stop_loss_price?.toString(),
    take_profit_price: signal.take_profit_price?.toString(),
    risk_reward_ratio: signal.risk_reward_ratio?.toString()
  };
}

/**
 * Validate TradingSignal
 */
export function validateSignal(signal: any): signal is TradingSignal {
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
}


