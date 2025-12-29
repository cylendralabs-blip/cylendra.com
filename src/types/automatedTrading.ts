
export interface AutoTradingSettings {
  isEnabled: boolean;
  maxConcurrentTrades: number;
  riskPerTrade: number;
  allowedSymbols: string[];
  minConfidenceScore: number;
  autoExecuteSignals: boolean;
  enableDCA: boolean;
  dcaLevels: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  leverage: number;
  selectedPlatform: string;
}

export interface ActiveAutoTrade {
  id: string;
  signalId: string;
  symbol: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  riskAmount: number;
  dcaLevel: number;
  createdAt: string;
}

export interface EnhancedTradingSignal {
  id: string;
  user_id: string;
  symbol: string;
  signal_type: string;
  signal_strength: string;
  confidence_score: number;
  entry_price: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  risk_reward_ratio?: number;
  timeframe: string;
  status: string;
  result?: string;
  created_at: string;
  updated_at: string;
  auto_trade_executed?: boolean;
  // إضافة الخصائص المفقودة
  technical_analysis?: any;
  volume_analysis?: any;
  pattern_analysis?: any;
  ai_analysis?: any;
  sentiment_analysis?: any;
  confirmations?: string[];
  price_source?: string;
  live_price_timestamp?: string;
  price_validation?: any;
}

export interface EngineStats {
  tradesExecuted: number;
  successfulTrades: number;
  totalPnL: number;
  winRate: number;
  averageProfit: number;
}
