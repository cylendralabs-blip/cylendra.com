
import { useMemo } from 'react';
import { TradingSignal } from '@/types/signals';
import { BotSettingsForm } from '@/types/botSettings';

interface TradeCalculationParams {
  signal: TradingSignal | null;
  botSettings: BotSettingsForm | null;
  availableBalance: number;
  riskPercentage: number;
  leverage: number;
  enableDCA: boolean;
  dcaLevels: number;
}

interface DCALevel {
  level: number;
  priceDropPercent: number;
  entryPrice: number;
  amount: number;
  cumulativeAmount: number;
  averageEntry: number;
}

interface TradeCalculation {
  positionSize: number;
  marginUsed: number;
  maxLossAmount: number;
  expectedLoss: number;
  initialAmount: number;
  dcaLevels: DCALevel[];
}

export const useSignalTradeCalculations = (params: TradeCalculationParams) => {
  const { signal, botSettings, availableBalance, riskPercentage, leverage, enableDCA, dcaLevels } = params;

  const tradeCalculation = useMemo((): TradeCalculation | null => {
    if (!signal || !botSettings || availableBalance <= 0) {
      return null;
    }

    // حساب الخسارة المتوقعة من السعر الحالي إلى stop loss
    const entryPrice = signal.entry_price;
    const stopLossPrice = signal.stop_loss_price || 0;
    
    let expectedLossPercent = 0;
    if (stopLossPrice > 0) {
      if (signal.signal_type === 'BUY') {
        expectedLossPercent = ((entryPrice - stopLossPrice) / entryPrice) * 100;
      } else {
        expectedLossPercent = ((stopLossPrice - entryPrice) / entryPrice) * 100;
      }
    } else {
      // استخدام إعدادات البوت الافتراضية
      expectedLossPercent = botSettings.stop_loss_percentage || 5;
    }

    // حساب الحد الأقصى للخسارة المقبولة
    const maxLossAmount = (availableBalance * riskPercentage) / 100;

    // حساب حجم الصفقة بناءً على المخاطرة
    const positionSize = maxLossAmount / (expectedLossPercent / 100);

    // حساب الهامش المستخدم (للتداول بالرافعة)
    const marginUsed = positionSize / leverage;

    // حساب المبلغ الأولي (حسب إعدادات البوت)
    const initialOrderPercentage = botSettings.initial_order_percentage || 25;
    const initialAmount = (positionSize * initialOrderPercentage) / 100;

    // حساب مستويات DCA
    const dcaLevelsArray: DCALevel[] = [];
    if (enableDCA && dcaLevels > 0) {
      const remainingAmount = positionSize - initialAmount;
      const dcaAmountPerLevel = remainingAmount / dcaLevels;
      
      let cumulativeInvestment = initialAmount;
      let cumulativeQuantity = initialAmount / entryPrice;

      for (let i = 1; i <= dcaLevels; i++) {
        const priceDropPercent = i * 2; // 2%, 4%, 6%, etc.
        const dcaEntryPrice = entryPrice * (1 - priceDropPercent / 100);
        
        cumulativeInvestment += dcaAmountPerLevel;
        cumulativeQuantity += dcaAmountPerLevel / dcaEntryPrice;
        
        const averageEntry = cumulativeInvestment / cumulativeQuantity;

        dcaLevelsArray.push({
          level: i,
          priceDropPercent,
          entryPrice: dcaEntryPrice,
          amount: dcaAmountPerLevel,
          cumulativeAmount: cumulativeInvestment,
          averageEntry
        });
      }
    }

    return {
      positionSize: Math.min(positionSize, availableBalance), // لا يتجاوز الرصيد المتاح
      marginUsed,
      maxLossAmount,
      expectedLoss: expectedLossPercent,
      initialAmount,
      dcaLevels: dcaLevelsArray
    };

  }, [signal, botSettings, availableBalance, riskPercentage, leverage, enableDCA, dcaLevels]);

  return { tradeCalculation };
};
