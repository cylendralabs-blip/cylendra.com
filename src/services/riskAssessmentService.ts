
import { RiskParameters, TradeRiskAssessment, MarketData } from '@/types/riskManagement';

export class RiskAssessmentService {
  static assessTradeRisk(
    symbol: string,
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    marketData: MarketData,
    riskParameters: RiskParameters
  ): TradeRiskAssessment {
    console.log(`🔍 تقييم المخاطر للرمز: ${symbol}`);

    const reasoning: string[] = [];
    let riskScore = 0;
    let recommendation: 'APPROVE' | 'REDUCE_SIZE' | 'REJECT' = 'APPROVE';

    // حساب نسبة المخاطر للعائد
    const riskAmount = Math.abs(entryPrice - stopLossPrice);
    const rewardAmount = Math.abs(takeProfitPrice - entryPrice);
    const riskRewardRatio = rewardAmount / riskAmount;

    // تقييم نسبة المخاطر للعائد
    if (riskRewardRatio >= 2.0) {
      reasoning.push('نسبة مخاطر/عائد ممتازة (1:' + riskRewardRatio.toFixed(1) + ')');
    } else if (riskRewardRatio >= 1.5) {
      reasoning.push('نسبة مخاطر/عائد جيدة (1:' + riskRewardRatio.toFixed(1) + ')');
      riskScore += 10;
    } else {
      reasoning.push('نسبة مخاطر/عائد ضعيفة (1:' + riskRewardRatio.toFixed(1) + ')');
      riskScore += 30;
    }

    // تقييم التقلبات
    const volatility = marketData?.volatility || 0.03;
    let volatilityRisk = 0;
    
    if (volatility > riskParameters.volatilityThreshold * 2) {
      volatilityRisk = 80;
      reasoning.push('تقلبات عالية جداً - مخاطر مرتفعة');
      riskScore += 40;
    } else if (volatility > riskParameters.volatilityThreshold) {
      volatilityRisk = 50;
      reasoning.push('تقلبات معتدلة إلى مرتفعة');
      riskScore += 20;
    } else {
      volatilityRisk = 20;
      reasoning.push('تقلبات منخفضة - مخاطر محدودة');
    }

    // تقييم السيولة
    const volume24h = marketData?.volume24h || 1000000;
    let liquidityRisk = 0;
    
    if (volume24h < 100000) {
      liquidityRisk = 70;
      reasoning.push('سيولة منخفضة - صعوبة في التنفيذ');
      riskScore += 35;
    } else if (volume24h < 1000000) {
      liquidityRisk = 40;
      reasoning.push('سيولة معتدلة');
      riskScore += 15;
    } else {
      liquidityRisk = 10;
      reasoning.push('سيولة جيدة');
    }

    const correlationRisk = 25; // قيمة افتراضية

    // حساب حجم الصفقة المقترح
    const riskPercentage = Math.abs((stopLossPrice - entryPrice) / entryPrice);
    const maxRiskAmount = (riskParameters.accountBalance * riskParameters.maxRiskPercentage) / 100;
    const maxPositionSize = maxRiskAmount / riskPercentage;

    // تحديد التوصية النهائية
    if (riskScore >= 70) {
      recommendation = 'REJECT';
      reasoning.push('مخاطر مرتفعة جداً - لا ينصح بالدخول');
    } else if (riskScore >= 40) {
      recommendation = 'REDUCE_SIZE';
      reasoning.push('مخاطر معتدلة - يُنصح بتقليل حجم الصفقة');
    } else {
      recommendation = 'APPROVE';
      reasoning.push('مخاطر مقبولة - يمكن الدخول بالحجم المحسوب');
    }

    return {
      symbol,
      riskScore,
      maxPositionSize,
      suggestedStopLoss: stopLossPrice,
      riskRewardRatio,
      correlationRisk,
      volatilityRisk,
      liquidityRisk,
      recommendation,
      reasoning
    };
  }
}
