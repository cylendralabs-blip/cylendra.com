
import { useCallback } from 'react';
import { PortfolioRisk, ActiveTrade, RiskParameters } from '@/types/riskManagement';
import { PortfolioAnalysisService } from '@/services/portfolioAnalysisService';

export const usePortfolioAnalysis = (riskParameters: RiskParameters) => {
  const analyzePortfolioRisk = useCallback(async (activeTrades: ActiveTrade[]): Promise<PortfolioRisk> => {
    return PortfolioAnalysisService.analyzePortfolioRisk(activeTrades, riskParameters);
  }, [riskParameters]);

  return {
    analyzePortfolioRisk
  };
};
