/**
 * Portfolio Types
 * 
 * Phase X.13 - AI Portfolio Insights + Smart Risk Advisor
 */

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  total_balance: number;
  spot_balance?: Record<string, {
    amount: number;
    value_usd: number;
  }>;
  futures_positions?: Array<{
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entry_price: number;
    leverage: number;
    unrealized_pnl: number;
    margin: number;
  }>;
  exposure?: Record<string, number>; // Percentages
  total_exposure: number;
  leverage_used: number;
  unrealized_pnl: number;
  realized_pnl: number;
  spot_value: number;
  futures_value: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PortfolioRiskScore {
  id: string;
  user_id: string;
  snapshot_id?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  volatility_score?: number;
  leverage_risk?: number;
  exposure_risk?: number;
  diversification_score?: number;
  liquidation_risk?: number;
  funding_risk?: number;
  sentiment_risk?: number;
  overall_score: number;
  ai_comment?: string;
  risk_factors?: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PortfolioRecommendation {
  id: string;
  user_id: string;
  snapshot_id?: string;
  risk_score_id?: string;
  recommendation_type: 'rebalance' | 'reduce_leverage' | 'increase_usdt_buffer' | 'close_position' | 'diversify' | 'take_profit' | 'stop_loss';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description?: string;
  details?: {
    action: string;
    current_value?: number;
    recommended_value?: number;
    reason: string;
    affected_assets?: string[];
  };
  is_applied: boolean;
  applied_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PortfolioForecast {
  id: string;
  user_id: string;
  snapshot_id?: string;
  forecast_period: '7d' | '30d' | '90d';
  expected_growth?: number;
  risk_adjusted_growth?: number;
  best_asset?: string;
  worst_asset?: string;
  momentum_direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence_score?: number;
  forecast_details?: {
    asset_forecasts?: Array<{
      asset: string;
      expected_return: number;
      risk_level: string;
    }>;
    market_conditions?: string;
    key_factors?: string[];
  };
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PortfolioAlert {
  id: string;
  user_id: string;
  alert_type: 'risk_critical' | 'daily_report' | 'recommendation' | 'forecast_update';
  alert_level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  data?: Record<string, any>;
  sent_to_telegram: boolean;
  telegram_sent_at?: string;
  read: boolean;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PortfolioFeatures {
  volatility_risk: number;
  leverage_risk: number;
  exposure_risk: number;
  diversification_risk: number;
  funding_risk: number;
  sentiment_bias: number;
  technical_bias: number;
}

export interface RiskAnalysisResult {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overall_score: number;
  ai_comment: string;
  risk_factors: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  scores: {
    volatility: number;
    leverage: number;
    exposure: number;
    diversification: number;
    liquidation: number;
    funding: number;
    sentiment: number;
  };
}

