
import { useMemo } from 'react';
import { TradingSignal } from '@/types/signals';
import { BotSettingsForm } from '@/types/botSettings';
import { useTechnicalAnalysisStopLoss } from './useTechnicalAnalysisStopLoss';
import { useRiskManagementEngine } from './useRiskManagementEngine';

interface AdvancedTradeCalculationParams {
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
  stopLossPrice: number;
  actualLossAmount: number;
}

interface AdvancedTradeCalculation {
  positionSize: number;
  marginUsed: number;
  maxLossAmount: number;
  suggestedLossPercentage: number;
  initialAmount: number;
  dcaLevels: DCALevel[];
  isWithinRiskLimits: boolean;
  riskWarning?: string;
  smartLossReasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  technicalLevel: string;
  confidence: number;
}

export const useAdvancedSignalTradeCalculations = (params: AdvancedTradeCalculationParams) => {
  const { signal, botSettings, availableBalance, riskPercentage, leverage, enableDCA, dcaLevels } = params;

  // استخدام التحليل الفني لحساب stop loss الذكي
  const { technicalStopLoss } = useTechnicalAnalysisStopLoss({
    signal,
    availableBalance,
    riskPercentage
  });

  // حساب إدارة المخاطر المتقدمة باستخدام التحليل الفني
  // تأخير استدعاء useRiskManagementEngine حتى يكون signal موجود
  const entryPrice = signal?.entry_price || 0;
  const suggestedLossPercentage = technicalStopLoss?.lossPercentage || 3.0;
  
  const { riskCalculation } = useRiskManagementEngine({
    availableBalance,
    riskPercentage,
    suggestedLossPercentage,
    entryPrice,
    botSettings,
    enableDCA,
    dcaLevels
  });

  const advancedTradeCalculation = useMemo((): AdvancedTradeCalculation | null => {
    if (!signal || !botSettings || !technicalStopLoss || !riskCalculation) {
      return null;
    }

    console.log('📊 حساب متقدم بالتحليل الفني:', {
      symbol: signal.symbol,
      technicalLevel: technicalStopLoss.technicalLevel,
      lossPercentage: technicalStopLoss.lossPercentage,
      confidence: technicalStopLoss.confidence,
      reasoning: technicalStopLoss.reasoning
    });

    return {
      positionSize: riskCalculation.positionSize,
      marginUsed: riskCalculation.marginUsed,
      maxLossAmount: riskCalculation.maxAllowedLoss,
      suggestedLossPercentage: technicalStopLoss.lossPercentage,
      initialAmount: riskCalculation.initialAmount,
      dcaLevels: riskCalculation.dcaLevels,
      isWithinRiskLimits: riskCalculation.isWithinRiskLimits,
      riskWarning: riskCalculation.riskWarning,
      smartLossReasoning: technicalStopLoss.reasoning,
      riskLevel: technicalStopLoss.riskLevel,
      technicalLevel: technicalStopLoss.technicalLevel,
      confidence: technicalStopLoss.confidence
    };

  }, [signal, botSettings, technicalStopLoss, riskCalculation]);

  return { advancedTradeCalculation };
};
