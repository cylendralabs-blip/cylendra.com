
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PortfolioRisk, RiskParameters } from '@/types/riskManagement';

export const useRiskAlerts = (riskParameters: RiskParameters) => {
  const { toast } = useToast();

  const checkRiskAlerts = useCallback((portfolioRisk: PortfolioRisk) => {
    const alerts: string[] = [];

    if (portfolioRisk.overallRiskLevel === 'CRITICAL') {
      alerts.push('تحذير: مستوى مخاطر حرج - يُنصح بإغلاق بعض الصفقات');
    } else if (portfolioRisk.overallRiskLevel === 'HIGH') {
      alerts.push('تنبيه: مستوى مخاطر مرتفع - راقب المحفظة بعناية');
    }

    if (portfolioRisk.currentDrawdown > riskParameters.drawdownLimit * 0.8) {
      alerts.push(`تحذير: الانسحاب قارب الحد الأقصى (${portfolioRisk.currentDrawdown.toFixed(1)}%)`);
    }

    if (portfolioRisk.diversificationScore < 50) {
      alerts.push('تنبيه: تنويع المحفظة ضعيف - فكر في تنويع أكبر');
    }

    alerts.forEach(alert => {
      toast({
        title: 'تنبيه إدارة المخاطر',
        description: alert,
        variant: alert.includes('تحذير') ? 'destructive' : 'default',
      });
    });

    return alerts;
  }, [riskParameters, toast]);

  return {
    checkRiskAlerts
  };
};
