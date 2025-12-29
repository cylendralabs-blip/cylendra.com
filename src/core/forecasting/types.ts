/**
 * Forecasting Types
 * 
 * Phase X.11 - AI Trade Forecasting Engine
 */

export interface SignalFeatures {
  ai_score: number;
  technical_score: number;
  volume_score: number;
  pattern_score: number;
  wave_score: number;
  sentiment_score: number;
  risk_level_numeric: number;     // LOW=1, MEDIUM=2, HIGH=3, EXTREME=4
  volatility_score: number;       // from market_heatmap_metrics
  activity_score: number;         // from heatmap
  funding_rate: number;           // from funding_rates
  market_sentiment_value: number; // from market_sentiment_snapshots
  timeframe_bucket: number;      // 1m=1, 5m=2, 15m=3, 1h=4, 4h=5, 1d=6
  symbol_category?: string;      // "major", "alt", "meme", etc.
}

export interface ForecastResult {
  success_probability: number;      // 0-100
  expected_return_pct: number;      // %
  expected_holding_seconds: number; // seconds
  risk_adjusted_score: number;      // 0-100
  forecast_label: "HIGH" | "MEDIUM" | "LOW";
  sample_size?: number;            // Number of similar historical signals used
  confidence?: number;              // Confidence in the forecast (0-100)
}

export interface SignalOutcome {
  id: string;
  signal_id?: string;
  user_id?: string;
  symbol: string;
  timeframe: string;
  side: string;
  ai_score?: number;
  technical_score?: number;
  volume_score?: number;
  pattern_score?: number;
  wave_score?: number;
  sentiment_score?: number;
  risk_level?: string;
  entered_at?: string;
  exited_at?: string;
  holding_duration_seconds?: number;
  entry_price?: number;
  exit_price?: number;
  max_favorable_excursion?: number;
  max_adverse_excursion?: number;
  profit_loss_percentage: number;
  result_label: "WIN" | "LOSS" | "BREAKEVEN";
  signal_source?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SignalForecast {
  id: string;
  signal_id?: string;
  user_id?: string;
  symbol: string;
  timeframe: string;
  side: string;
  forecast_model_version: string;
  success_probability: number;
  expected_return_pct?: number;
  expected_holding_seconds?: number;
  risk_adjusted_score?: number;
  forecast_label: "HIGH" | "MEDIUM" | "LOW";
  features_snapshot?: SignalFeatures;
  metadata?: Record<string, any>;
  created_at: string;
}

