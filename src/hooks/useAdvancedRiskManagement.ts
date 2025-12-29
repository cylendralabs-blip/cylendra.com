
import { useRiskParameters } from '@/hooks/risk-management/useRiskParameters';
import { useRiskAssessment } from '@/hooks/risk-management/useRiskAssessment';
import { usePortfolioAnalysis } from '@/hooks/risk-management/usePortfolioAnalysis';
import { useRiskAlerts } from '@/hooks/risk-management/useRiskAlerts';

export const useAdvancedRiskManagement = () => {
  const { riskParameters, updateRiskParameters } = useRiskParameters();
  const { assessTradeRisk } = useRiskAssessment(riskParameters);
  const { analyzePortfolioRisk } = usePortfolioAnalysis(riskParameters);
  const { checkRiskAlerts } = useRiskAlerts(riskParameters);

  return {
    riskParameters,
    assessTradeRisk,
    analyzePortfolioRisk,
    updateRiskParameters,
    checkRiskAlerts
  };
};
