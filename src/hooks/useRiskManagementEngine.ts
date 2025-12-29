
import { useMemo } from 'react';
import { BotSettingsForm } from '@/types/botSettings';

interface RiskEngineParams {
  availableBalance: number;
  riskPercentage: number;
  suggestedLossPercentage: number;
  entryPrice: number;
  botSettings: BotSettingsForm | null;
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
  stopLossPrice: number;
  actualLossAmount: number;
}

interface RiskManagementResult {
  positionSize: number;
  marginUsed: number;
  maxAllowedLoss: number;
  initialAmount: number;
  stopLossPrice: number;
  dcaLevels: DCALevel[];
  isWithinRiskLimits: boolean;
  riskWarning?: string;
}

export const useRiskManagementEngine = (params: RiskEngineParams) => {
  const {
    availableBalance,
    riskPercentage,
    suggestedLossPercentage,
    entryPrice,
    botSettings,
    enableDCA,
    dcaLevels
  } = params;

  const riskCalculation = useMemo((): RiskManagementResult | null => {
    if (!botSettings || availableBalance <= 0 || entryPrice <= 0) {
      return null;
    }

    // الحد الأقصى للخسارة المسموح به حسب إدارة المخاطر
    const maxAllowedLoss = (availableBalance * riskPercentage) / 100;

    // حساب حجم الصفقة بناءً على الحد الأقصى للخسارة ونسبة الخسارة الذكية
    // هذا يضمن أن الخسارة الفعلية = maxAllowedLoss بالضبط
    const calculatedPositionSize = maxAllowedLoss / (suggestedLossPercentage / 100);

    // التأكد من أن حجم الصفقة لا يتجاوز الرصيد المتاح
    const finalPositionSize = Math.min(calculatedPositionSize, availableBalance * 0.95); // 95% من الرصيد كحد أقصى

    // حساب الهامش المستخدم (للتداول بالرافعة)
    const leverage = botSettings.leverage || 1;
    const marginUsed = finalPositionSize / leverage;

    // حساب المبلغ الأولي
    const initialOrderPercentage = botSettings.initial_order_percentage || 25;
    const initialAmount = (finalPositionSize * initialOrderPercentage) / 100;

    // حساب stop loss الأولي بناءً على نسبة الخسارة الذكية
    const initialStopLossPrice = entryPrice * (1 - suggestedLossPercentage / 100);

    // حساب مستويات DCA مع stop loss محسوب بدقة
    const dcaLevelsArray: DCALevel[] = [];
    let currentStopLoss = initialStopLossPrice;

    if (enableDCA && dcaLevels > 0) {
      const remainingAmount = finalPositionSize - initialAmount;
      const dcaAmountPerLevel = remainingAmount / dcaLevels;
      
      let cumulativeInvestment = initialAmount;
      let cumulativeQuantity = initialAmount / entryPrice;

      for (let i = 1; i <= dcaLevels; i++) {
        const priceDropPercent = i * 2; // 2%, 4%, 6%, etc.
        const dcaEntryPrice = entryPrice * (1 - priceDropPercent / 100);
        
        cumulativeInvestment += dcaAmountPerLevel;
        cumulativeQuantity += dcaAmountPerLevel / dcaEntryPrice;
        
        const averageEntry = cumulativeInvestment / cumulativeQuantity;

        // حساب stop loss حسب الإعداد المحدد
        let levelStopLoss: number;
        let actualLossAmount: number;

        if (botSettings.stop_loss_calculation_method === 'average_position') {
          // من سعر المركز المتوسط (متحرك)
          // حساب stop loss بحيث تكون الخسارة = maxAllowedLoss
          levelStopLoss = averageEntry - (maxAllowedLoss / cumulativeQuantity);
          actualLossAmount = (averageEntry - levelStopLoss) * cumulativeQuantity;
        } else {
          // من سعر الدخول الأول (ثابت)
          // حساب stop loss بحيث تكون الخسارة = maxAllowedLoss
          levelStopLoss = entryPrice - (maxAllowedLoss / cumulativeQuantity);
          actualLossAmount = (entryPrice - levelStopLoss) * cumulativeQuantity;
        }

        // التأكد من أن stop loss لا يكون أعلى من سعر الدخول
        if (levelStopLoss >= averageEntry) {
          levelStopLoss = averageEntry * 0.99; // 1% أقل من سعر الدخول كحد أدنى
          actualLossAmount = (averageEntry - levelStopLoss) * cumulativeQuantity;
        }

        // إعادة حساب الخسارة الفعلية للتأكد من الدقة
        actualLossAmount = Math.min(actualLossAmount, maxAllowedLoss);

        currentStopLoss = levelStopLoss;

        dcaLevelsArray.push({
          level: i,
          priceDropPercent,
          entryPrice: dcaEntryPrice,
          amount: dcaAmountPerLevel,
          cumulativeAmount: cumulativeInvestment,
          averageEntry,
          stopLossPrice: levelStopLoss,
          actualLossAmount
        });
      }
    }

    // حساب الخسارة الفعلية النهائية
    const totalQuantity = enableDCA && dcaLevelsArray.length > 0 
      ? dcaLevelsArray[dcaLevelsArray.length - 1].cumulativeAmount / dcaLevelsArray[dcaLevelsArray.length - 1].averageEntry
      : initialAmount / entryPrice;

    const referencePrice = enableDCA && dcaLevelsArray.length > 0
      ? dcaLevelsArray[dcaLevelsArray.length - 1].averageEntry
      : entryPrice;

    const finalLossAmount = (referencePrice - currentStopLoss) * totalQuantity;

    // التحقق من الحدود مع هامش خطأ صغير (1%)
    const isWithinRiskLimits = finalLossAmount <= maxAllowedLoss * 1.01;
    let riskWarning: string | undefined;

    if (!isWithinRiskLimits) {
      riskWarning = `تحذير: الخسارة المحتملة (${finalLossAmount.toFixed(2)}$) تتجاوز الحد المسموح (${maxAllowedLoss.toFixed(2)}$)`;
    }

    console.log('🔍 Risk Management Calculation:', {
      maxAllowedLoss: maxAllowedLoss.toFixed(2),
      finalLossAmount: finalLossAmount.toFixed(2),
      positionSize: finalPositionSize.toFixed(2),
      suggestedLossPercentage: suggestedLossPercentage.toFixed(2),
      isWithinRiskLimits
    });

    return {
      positionSize: finalPositionSize,
      marginUsed,
      maxAllowedLoss,
      initialAmount,
      stopLossPrice: currentStopLoss,
      dcaLevels: dcaLevelsArray,
      isWithinRiskLimits,
      riskWarning
    };

  }, [availableBalance, riskPercentage, suggestedLossPercentage, entryPrice, botSettings, enableDCA, dcaLevels]);

  return { riskCalculation };
};
