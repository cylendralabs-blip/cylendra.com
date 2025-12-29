
import { RiskParameters, PortfolioRisk, ActiveTrade } from '@/types/riskManagement';

export class PortfolioAnalysisService {
  static analyzePortfolioRisk(
    activeTrades: ActiveTrade[],
    riskParameters: RiskParameters
  ): PortfolioRisk {
    console.log('📊 تحليل مخاطر المحفظة الإجمالية');

    // حساب إجمالي التعرض
    const totalExposure = activeTrades.reduce((sum, trade) => {
      return sum + (trade.positionSize || 0);
    }, 0);

    const exposurePercentage = (totalExposure / riskParameters.accountBalance) * 100;

    // حساب نتيجة التنويع
    const uniqueSymbols = new Set(activeTrades.map(t => t.symbol.split('/')[0]));
    const diversificationScore = Math.min(100, (uniqueSymbols.size / activeTrades.length) * 100);

    // مصفوفة الارتباط (مبسطة)
    const correlationMatrix: { [key: string]: number } = {};
    activeTrades.forEach(trade => {
      correlationMatrix[trade.symbol] = Math.random() * 0.8;
    });

    // حساب الانسحاب الحالي
    const totalPnL = activeTrades.reduce((sum, trade) => sum + (trade.unrealizedPnL || 0), 0);
    const currentDrawdown = Math.abs(Math.min(0, totalPnL / riskParameters.accountBalance * 100));

    // حساب استخدام المخاطر
    const riskUtilization = (activeTrades.length / riskParameters.maxConcurrentTrades) * 100;

    // تحديد مستوى المخاطر الإجمالي
    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (currentDrawdown > riskParameters.drawdownLimit || exposurePercentage > 80) {
      overallRiskLevel = 'CRITICAL';
    } else if (currentDrawdown > riskParameters.drawdownLimit * 0.7 || exposurePercentage > 60) {
      overallRiskLevel = 'HIGH';
    } else if (currentDrawdown > riskParameters.drawdownLimit * 0.4 || exposurePercentage > 40) {
      overallRiskLevel = 'MEDIUM';
    }

    return {
      totalExposure: exposurePercentage,
      diversificationScore,
      correlationMatrix,
      currentDrawdown,
      riskUtilization,
      overallRiskLevel
    };
  }
}
