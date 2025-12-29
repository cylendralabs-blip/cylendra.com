
export interface BaseStrategy {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  settings: any; // إضافة خاصية settings
  performance: StrategyPerformance;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
}

export type StrategyType = 
  | 'dca_basic'
  | 'dca_advanced' 
  | 'dca_smart'
  | 'grid_classic'
  | 'grid_infinity'
  | 'grid_futures'
  | 'momentum_breakout'
  | 'momentum_trend'
  | 'momentum_swing'
  | 'arbitrage_simple'
  | 'arbitrage_cross'
  | 'scalping_fast'
  | 'scalping_market_maker';

export interface StrategyPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  averageHoldTime: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  monthlyReturns: MonthlyReturn[];
}

export interface MonthlyReturn {
  month: string;
  return: number;
  trades: number;
}

// DCA Strategies
export interface DCAStrategy extends BaseStrategy {
  type: 'dca_basic' | 'dca_advanced' | 'dca_smart';
  settings: DCASettings;
}

export interface DCASettings {
  maxInvestment: number;
  numberOfLevels: number;
  priceDropPercentages: number[];
  investmentPercentages: number[];
  takeProfitPercentage: number;
  stopLossPercentage: number;
  cooldownPeriod: number; // hours
  maxActiveDeals: number;
  riskRewardRatio: number;
  enableSmartEntry: boolean;
  enableDynamicTP: boolean;
  enableTrailingStop: boolean;
  minVolumeThreshold: number;
  blacklistPeriods: TimeRange[];
}

// Grid Strategies  
export interface GridStrategy extends BaseStrategy {
  type: 'grid_classic' | 'grid_infinity' | 'grid_futures';
  settings: GridSettings;
}

export interface GridSettings {
  upperPrice: number;
  lowerPrice: number;
  gridNumber: number;
  investmentPerGrid: number;
  profitPerGrid: number;
  enableInfiniteGrid: boolean;
  enableFuturesMode: boolean;
  leverage: number;
  hedgingEnabled: boolean;
  rebalanceThreshold: number;
  stopLossPercentage: number;
  dynamicGridAdjustment: boolean;
  volatilityBasedSpacing: boolean;
}

// Momentum Strategies
export interface MomentumStrategy extends BaseStrategy {
  type: 'momentum_breakout' | 'momentum_trend' | 'momentum_swing';
  settings: MomentumSettings;
}

export interface MomentumSettings {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  volumeThreshold: number;
  breakoutThreshold: number;
  entryConfirmations: number;
  dynamicStopLoss: boolean;
  trailingStopPercentage: number;
  partialTakeProfitLevels: number[];
  timeframeConfirmation: string[];
  momentumFilter: MomentumFilter;
}

export interface MomentumFilter {
  minPrice: number;
  maxPrice: number;
  minVolume24h: number;
  minMarketCap: number;
  excludeStablecoins: boolean;
  allowedExchanges: string[];
}

// Additional Strategy Types
export interface ArbitrageStrategy extends BaseStrategy {
  type: 'arbitrage_simple' | 'arbitrage_cross';
  settings: ArbitrageSettings;
}

export interface ArbitrageSettings {
  minProfitPercentage: number;
  maxSpreadPercentage: number;
  exchanges: string[];
  tradingPairs: string[];
  executionSpeed: 'fast' | 'normal' | 'safe';
  enableCrossExchange: boolean;
  slippageTolerance: number;
  maxPositionSize: number;
}

export interface ScalpingStrategy extends BaseStrategy {
  type: 'scalping_fast' | 'scalping_market_maker';
  settings: ScalpingSettings;
}

export interface ScalpingSettings {
  timeframe: string;
  profitTarget: number;
  stopLoss: number;
  maxHoldTime: number; // minutes
  enableMarketMaking: boolean;
  bidAskSpread: number;
  inventoryManagement: boolean;
  maxPositions: number;
  quickExitEnabled: boolean;
  volatilityThreshold: number;
}

export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
  timezone: string;
}

export interface StrategyBacktest {
  id: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
  equity: EquityPoint[];
  settings: any;
  createdAt: string;
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercentage: number;
  commission: number;
  reason: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}
