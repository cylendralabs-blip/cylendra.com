
import { useMemo } from 'react';
import { TradingSignal } from '@/types/signals';
import { TechnicalAnalysisEngine, SmartStopLossResult } from '@/utils/technicalAnalysis';

interface TechnicalStopLossParams {
  signal: TradingSignal | null;
  availableBalance: number;
  riskPercentage: number;
}

export const useTechnicalAnalysisStopLoss = (params: TechnicalStopLossParams) => {
  const { signal, availableBalance, riskPercentage } = params;

  const technicalStopLoss = useMemo((): SmartStopLossResult | null => {
    // التحقق من وجود signal وخصائصه الأساسية
    if (!signal || availableBalance <= 0) {
      return null;
    }

    // التحقق من وجود جميع الخصائص المطلوبة
    if (!signal.symbol || !signal.entry_price || !signal.timeframe || !signal.signal_type) {
      return null;
    }

    try {
    console.log('🔬 بدء التحليل الفني المحسن لـ', signal.symbol, 'على', signal.timeframe);

    // محاكاة بيانات الأسعار (في التطبيق الحقيقي، هذه ستأتي من API)
    const currentPrice = signal.entry_price;
      const signalType = signal.signal_type;
      const symbol = signal.symbol;
      const timeframe = signal.timeframe;
      const confidenceScore = signal.confidence_score || 70;
    
    // توليد بيانات سعرية واقعية للتحليل
    const generatePriceData = (basePrice: number, periods: number = 50) => {
      const prices: number[] = [];
      const highs: number[] = [];
      const lows: number[] = [];
      
      let price = basePrice * 0.95; // بدء من سعر أقل قليلاً
      
      for (let i = 0; i < periods; i++) {
        // إضافة تذبذب واقعي
        const volatility = 0.015 + Math.random() * 0.02; // 1.5% to 3.5%
        const change = (Math.random() - 0.5) * volatility;
        
        price = price * (1 + change);
        
        // تدرج تصاعدي أو تنازلي حسب نوع الإشارة
          if (signalType === 'BUY') {
          price += (basePrice - price) * 0.02; // تدرج نحو السعر المستهدف
        }
        
        const high = price * (1 + Math.random() * 0.008);
        const low = price * (1 - Math.random() * 0.008);
        
        prices.push(price);
        highs.push(high);
        lows.push(low);
      }
      
      // إضافة السعر الحالي في النهاية
      prices.push(currentPrice);
      highs.push(currentPrice * 1.003);
      lows.push(currentPrice * 0.997);
      
      return { prices, highs, lows };
    };

    const { prices, highs, lows } = generatePriceData(currentPrice);

    // تحليل المستويات الفنية
    const technicalLevels = TechnicalAnalysisEngine.analyzeTechnicalLevels(
      prices,
      highs,
      lows,
      currentPrice
    );

    // حساب stop loss الذكي مع التايم فريم والرمز
    const smartStopLoss = TechnicalAnalysisEngine.calculateSmartStopLoss(
      currentPrice,
        signalType,
      technicalLevels,
        confidenceScore,
        timeframe,  // تمرير التايم فريم
        symbol     // تمرير الرمز
    );

    // التأكد من أن الخسارة ضمن حدود إدارة المخاطر
    const maxAllowedLoss = (availableBalance * riskPercentage) / 100;
    const maxAllowedLossPercent = (maxAllowedLoss / (availableBalance * 0.3)) * 100; // افتراض 30% من الرصيد كحد أقصى للصفقة

    if (smartStopLoss.lossPercentage > maxAllowedLossPercent) {
      // تعديل stop loss ليكون ضمن حدود إدارة المخاطر
      const adjustedLossPercent = Math.min(smartStopLoss.lossPercentage, maxAllowedLossPercent);
      
      return {
        ...smartStopLoss,
        lossPercentage: adjustedLossPercent,
        reasoning: smartStopLoss.reasoning + ' (معدل لإدارة المخاطر)',
        confidence: Math.max(smartStopLoss.confidence - 10, 60)
      };
    }

    return smartStopLoss;
    } catch (error) {
      console.error('Error in technical stop loss calculation:', error);
      return null;
    }

  }, [signal, availableBalance, riskPercentage]);

  return { technicalStopLoss };
};
