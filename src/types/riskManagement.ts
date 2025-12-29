
export interface RiskParameters {
  accountBalance: number;
  maxRiskPercentage: number;
  maxConcurrentTrades: number;
  correlationLimit: number;
  drawdownLimit: number;
  volatilityThreshold: number;
}

export interface TradeRiskAssessment {
  symbol: string;
  riskScore: number;
  maxPositionSize: number;
  suggestedStopLoss: number;
  riskRewardRatio: number;
  correlationRisk: number;
  volatilityRisk: number;
  liquidityRisk: number;
  recommendation: 'APPROVE' | 'REDUCE_SIZE' | 'REJECT';
  reasoning: string[];
}

export interface PortfolioRisk {
  totalExposure: number;
  diversificationScore: number;
  correlationMatrix: { [key: string]: number };
  currentDrawdown: number;
  riskUtilization: number;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MarketData {
  volatility?: number;
  volume24h?: number;
}

export interface ActiveTrade {
  symbol: string;
  positionSize?: number;
  unrealizedPnL?: number;
}
