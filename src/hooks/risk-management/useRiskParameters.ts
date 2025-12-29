
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RiskParameters } from '@/types/riskManagement';

export const useRiskParameters = () => {
  const { toast } = useToast();
  const [riskParameters, setRiskParameters] = useState<RiskParameters>({
    accountBalance: 10000,
    maxRiskPercentage: 2.0,
    maxConcurrentTrades: 5,
    correlationLimit: 0.7,
    drawdownLimit: 10.0,
    volatilityThreshold: 0.05
  });

  const updateRiskParameters = useCallback((newParams: Partial<RiskParameters>) => {
    setRiskParameters(prev => ({ ...prev, ...newParams }));
    
    toast({
      title: 'تم تحديث معايير المخاطر',
      description: 'تم تطبيق الإعدادات الجديدة لإدارة المخاطر',
    });
  }, [toast]);

  return {
    riskParameters,
    updateRiskParameters
  };
};
