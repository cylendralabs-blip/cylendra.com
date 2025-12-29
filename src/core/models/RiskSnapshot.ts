/**
 * Risk Snapshot Model
 * 
 * نموذج البيانات لمخاطر المحفظة
 * 
 * Phase 1: تنظيم Models
 */

/**
 * Risk Level
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Risk Parameters - معاملات المخاطرة
 */
export interface RiskParameters {
  accountBalance: number;
  maxRiskPercentage: number;
  maxConcurrentTrades: number;
  correlationLimit: number;
  drawdownLimit: number;
  volatilityThreshold: number;
}

/**
 * Trade Risk Assessment - تقييم مخاطر الصفقة
 */
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

/**
 * Portfolio Risk - مخاطر المحفظة الإجمالية
 */
export interface PortfolioRisk {
  totalExposure: number;
  diversificationScore: number;
  correlationMatrix: { [key: string]: number };
  currentDrawdown: number;
  riskUtilization: number;
  overallRiskLevel: RiskLevel;
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Market Data - بيانات السوق للمخاطرة
 */
export interface MarketData {
  volatility?: number;
  volume24h?: number;
  bidAskSpread?: number;
  liquidity?: number;
}

/**
 * Risk Snapshot - لقطة من حالة المخاطرة في وقت معين
 */
export interface RiskSnapshot {
  id: string;
  user_id: string;
  timestamp: string;
  
  // Risk Parameters
  risk_parameters: RiskParameters;
  
  // Portfolio Risk
  portfolio_risk: PortfolioRisk;
  
  // Active Trades Count
  active_trades_count: number;
  
  // Total Exposure
  total_exposure: number;
  total_exposure_percentage: number;
  
  // Drawdown
  current_drawdown: number;
  max_drawdown: number;
  
  // Risk Utilization
  risk_utilization_percentage: number;
  
  // Warnings
  warnings: string[];
  alerts: string[];
  
  created_at: string;
}

/**
 * Create Risk Snapshot
 */
export function createRiskSnapshot(
  user_id: string,
  riskParameters: RiskParameters,
  portfolioRisk: PortfolioRisk,
  activeTradesCount: number,
  totalExposure: number,
  currentDrawdown: number,
  maxDrawdown: number
): RiskSnapshot {
  const totalExposurePercentage = (totalExposure / riskParameters.accountBalance) * 100;
  const riskUtilizationPercentage = (activeTradesCount / riskParameters.maxConcurrentTrades) * 100;
  
  // جمع التحذيرات
  const warnings: string[] = [];
  const alerts: string[] = [];
  
  if (portfolioRisk.overallRiskLevel === 'CRITICAL') {
    alerts.push('مخاطر حرجة - يجب إغلاق بعض الصفقات فوراً');
  }
  
  if (currentDrawdown > riskParameters.drawdownLimit) {
    warnings.push(`الانسحاب الحالي (${currentDrawdown.toFixed(2)}%) يتجاوز الحد المسموح`);
  }
  
  if (totalExposurePercentage > 80) {
    warnings.push(`التعرض الإجمالي (${totalExposurePercentage.toFixed(2)}%) مرتفع جداً`);
  }
  
  if (riskUtilizationPercentage > 90) {
    warnings.push(`استخدام المخاطرة (${riskUtilizationPercentage.toFixed(2)}%) قريب من الحد الأقصى`);
  }
  
  return {
    id: crypto.randomUUID(),
    user_id,
    timestamp: new Date().toISOString(),
    risk_parameters: riskParameters,
    portfolio_risk: portfolioRisk,
    active_trades_count: activeTradesCount,
    total_exposure: totalExposure,
    total_exposure_percentage: totalExposurePercentage,
    current_drawdown: currentDrawdown,
    max_drawdown: maxDrawdown,
    risk_utilization_percentage: riskUtilizationPercentage,
    warnings,
    alerts,
    created_at: new Date().toISOString()
  };
}

/**
 * Check if Risk Level is Acceptable
 */
export function isRiskAcceptable(riskLevel: RiskLevel): boolean {
  return riskLevel === 'LOW' || riskLevel === 'MEDIUM';
}


