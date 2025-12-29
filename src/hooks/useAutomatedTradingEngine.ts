
import { useAuth } from '@/hooks/useAuth';
import { useAutoTradingSettings } from '@/hooks/useAutoTradingSettings';
// import { useAutoTradeExecution } from '@/hooks/useAutoTradeExecution'; // REMOVED: Mock file - use auto-trader-worker instead
import { useEngineStatus } from '@/hooks/automated-trading/useEngineStatus';
import { useEngineMonitoring } from '@/hooks/automated-trading/useEngineMonitoring';
import { useSignalProcessor } from '@/hooks/automated-trading/useSignalProcessor';

export const useAutomatedTradingEngine = () => {
  const { user } = useAuth();
  
  const {
    autoTradingSettings,
    loading: settingsLoading,
    saveSettings
  } = useAutoTradingSettings();

  // REMOVED: Mock implementation - auto-trader-worker handles this now
  const activeTrades: any[] = [];
  const processingSignals = false;
  const engineStats = {
    tradesExecuted: 0,
    successfulTrades: 0,
    totalPnL: 0,
    winRate: 0,
    averageProfit: 0
  };
  const monitorTrades = async () => {
    console.log('⚠️ useAutoTradeExecution removed - auto-trader-worker handles trade monitoring now');
  };

  const { isEngineRunning, toggleTradingEngine } = useEngineStatus();
  const { processNewSignals: processSignalsWrapper } = useSignalProcessor();

  // Create a function that matches useEngineMonitoring's expected signature
  // useEngineMonitoring expects: (userId: string, settings: AutoTradingSettings) => void
  const processNewSignals = async (userId: string, settings: typeof autoTradingSettings) => {
    if (!settings.isEnabled || !settings.autoExecuteSignals) {
      return;
    }
    console.log('🤖 Processing new signals for user:', userId);
    // The actual processing is handled by auto-trader-worker Edge Function
    // This is just a placeholder for the monitoring hook
  };

  // إعداد المراقبة التلقائية
  useEngineMonitoring({
    isEnabled: autoTradingSettings.isEnabled,
    autoTradingSettings,
    processNewSignals,
    monitorTrades
  });

  return {
    isEngineRunning,
    autoTradingSettings,
    activeTrades,
    processingSignals,
    engineStats,
    settingsLoading,
    toggleTradingEngine,
    saveAutoTradingSettings: saveSettings,
    processNewSignals: processSignalsWrapper
  };
};
