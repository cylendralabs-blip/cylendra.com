
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AutoTradingSettings } from '@/types/automatedTrading';

interface UseEngineMonitoringParams {
  isEnabled: boolean;
  autoTradingSettings: AutoTradingSettings;
  processNewSignals: (userId: string, settings: AutoTradingSettings) => void;
  monitorTrades: () => void;
}

export const useEngineMonitoring = ({
  isEnabled,
  autoTradingSettings,
  processNewSignals,
  monitorTrades
}: UseEngineMonitoringParams) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!isEnabled || !user) return;

    const signalsInterval = setInterval(() => {
      processNewSignals(user.id, autoTradingSettings);
    }, 30000);
    
    const tradesInterval = setInterval(monitorTrades, 10000);

    return () => {
      clearInterval(signalsInterval);
      clearInterval(tradesInterval);
    };
  }, [isEnabled, user, processNewSignals, monitorTrades, autoTradingSettings]);
};
