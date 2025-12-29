
import { useCallback } from 'react';
import { TradeRiskAssessment, MarketData, RiskParameters } from '@/types/riskManagement';
import { RiskAssessmentService } from '@/services/riskAssessmentService';

export const useRiskAssessment = (riskParameters: RiskParameters) => {
  const assessTradeRisk = useCallback(async (
    symbol: string,
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    marketData: MarketData
  ): Promise<TradeRiskAssessment> => {
    return RiskAssessmentService.assessTradeRisk(
      symbol,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      marketData,
      riskParameters
    );
  }, [riskParameters]);

  return {
    assessTradeRisk
  };
};
