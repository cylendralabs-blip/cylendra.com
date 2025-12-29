
import { useMemo } from 'react';
import { TradingSignal } from '@/types/signals';

interface SmartLossParams {
  signal: TradingSignal | null;
  riskPercentage: number;
  availableBalance: number;
}

interface SmartLossResult {
  suggestedLossPercentage: number;
  maxAllowedLoss: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}

export const useSmartLossCalculator = (params: SmartLossParams) => {
  const { signal, riskPercentage, availableBalance } = params;

  const smartLossCalculation = useMemo((): SmartLossResult | null => {
    if (!signal || availableBalance <= 0) {
      return null;
    }

    // حساب الحد الأقصى للخسارة المسموح به حسب إدارة المخاطر
    const maxAllowedLoss = (availableBalance * riskPercentage) / 100;

    let suggestedLossPercentage = 2.5; // القيمة الافتراضية المنخفضة
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    let reasoning = '';

    // تحليل الرمز لتحديد نسبة الخسارة المناسبة
    const symbol = signal.symbol.toUpperCase();
    
    // تصنيف العملات حسب المخاطر والسيولة
    const highLiquidityCoins = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK', 'UNI'];
    const mediumLiquidityCoins = ['SOL', 'AVAX', 'MATIC', 'ATOM', 'XRP', 'LTC', 'DOGE'];
    const lowLiquidityCoins = ['FTM', 'SAND', 'MANA', 'GALA', 'CHZ', 'ENJ'];
    
    // استخراج اسم العملة من الرمز
    const coinName = symbol.replace('/USDT', '').replace('USDT', '').replace('/BUSD', '').replace('BUSD', '');
    
    // تحديد مستوى السيولة
    let liquidityLevel = 'low';
    if (highLiquidityCoins.includes(coinName)) {
      liquidityLevel = 'high';
    } else if (mediumLiquidityCoins.includes(coinName)) {
      liquidityLevel = 'medium';
    }

    // حساب نسبة الخسارة بناءً على مستوى السيولة
    if (liquidityLevel === 'high') {
      suggestedLossPercentage = 2.0; // عملات عالية السيولة - خسارة أقل
      riskLevel = 'LOW';
      reasoning = 'عملة عالية السيولة، تقلبات منخفضة';
    } else if (liquidityLevel === 'medium') {
      suggestedLossPercentage = 3.5; // عملات متوسطة السيولة
      riskLevel = 'MEDIUM';
      reasoning = 'عملة متوسطة السيولة، تقلبات معتدلة';
    } else {
      suggestedLossPercentage = 5.5; // عملات منخفضة السيولة - خسارة أعلى
      riskLevel = 'HIGH';
      reasoning = 'عملة منخفضة السيولة، تقلبات عالية';
    }

    // تعديل إضافي بناءً على درجة الثقة في الإشارة
    const confidenceScore = signal.confidence_score || 50;
    if (confidenceScore >= 80) {
      suggestedLossPercentage *= 0.8; // تقليل الخسارة للإشارات عالية الثقة
      reasoning += '، ثقة عالية في الإشارة';
    } else if (confidenceScore <= 40) {
      suggestedLossPercentage *= 1.3; // زيادة الخسارة للإشارات منخفضة الثقة
      reasoning += '، ثقة منخفضة في الإشارة';
    } else {
      reasoning += '، ثقة متوسطة في الإشارة';
    }

    // تعديل بناءً على نوع الإشارة
    if (signal.signal_type.includes('STRONG')) {
      suggestedLossPercentage *= 0.9; // تقليل الخسارة للإشارات القوية
      reasoning += '، إشارة قوية';
    }

    // التأكد من أن النسبة ضمن حدود معقولة
    suggestedLossPercentage = Math.max(1.5, Math.min(suggestedLossPercentage, 8.0));

    // إعادة تحديد مستوى المخاطرة بناءً على النسبة النهائية
    if (suggestedLossPercentage <= 2.5) {
      riskLevel = 'LOW';
    } else if (suggestedLossPercentage <= 4.5) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    reasoning += ` (${suggestedLossPercentage.toFixed(1)}%)`;

    console.log('🧠 Smart Loss Calculation:', {
      symbol: coinName,
      liquidityLevel,
      confidenceScore,
      suggestedLossPercentage: suggestedLossPercentage.toFixed(2),
      riskLevel,
      reasoning
    });

    return {
      suggestedLossPercentage: Number(suggestedLossPercentage.toFixed(2)),
      maxAllowedLoss,
      riskLevel,
      reasoning
    };

  }, [signal, riskPercentage, availableBalance]);

  return { smartLossCalculation };
};
