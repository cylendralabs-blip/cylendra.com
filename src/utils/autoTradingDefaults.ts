
import { AutoTradingSettings } from '@/types/automatedTrading';

export const getDefaultAutoTradingSettings = (): AutoTradingSettings => ({
  isEnabled: false,
  maxConcurrentTrades: 3,
  riskPerTrade: 1.5,
  allowedSymbols: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
  minConfidenceScore: 75,
  autoExecuteSignals: false,
  enableDCA: true,
  dcaLevels: 3,
  stopLossPercentage: 3.5,
  takeProfitPercentage: 6.0,
  leverage: 1,
  selectedPlatform: ''
});

export const parseAutoTradingSettings = (data: any): AutoTradingSettings => {
  if (!data || typeof data !== 'object') {
    return getDefaultAutoTradingSettings();
  }

  const defaultSettings = getDefaultAutoTradingSettings();
  
  return {
    isEnabled: typeof data.isEnabled === 'boolean' ? data.isEnabled : defaultSettings.isEnabled,
    maxConcurrentTrades: typeof data.maxConcurrentTrades === 'number' ? data.maxConcurrentTrades : defaultSettings.maxConcurrentTrades,
    riskPerTrade: typeof data.riskPerTrade === 'number' ? data.riskPerTrade : defaultSettings.riskPerTrade,
    allowedSymbols: Array.isArray(data.allowedSymbols) ? data.allowedSymbols : defaultSettings.allowedSymbols,
    minConfidenceScore: typeof data.minConfidenceScore === 'number' ? data.minConfidenceScore : defaultSettings.minConfidenceScore,
    autoExecuteSignals: typeof data.autoExecuteSignals === 'boolean' ? data.autoExecuteSignals : defaultSettings.autoExecuteSignals,
    enableDCA: typeof data.enableDCA === 'boolean' ? data.enableDCA : defaultSettings.enableDCA,
    dcaLevels: typeof data.dcaLevels === 'number' ? data.dcaLevels : defaultSettings.dcaLevels,
    stopLossPercentage: typeof data.stopLossPercentage === 'number' ? data.stopLossPercentage : defaultSettings.stopLossPercentage,
    takeProfitPercentage: typeof data.takeProfitPercentage === 'number' ? data.takeProfitPercentage : defaultSettings.takeProfitPercentage,
    leverage: typeof data.leverage === 'number' ? data.leverage : defaultSettings.leverage,
    selectedPlatform: typeof data.selectedPlatform === 'string' ? data.selectedPlatform : defaultSettings.selectedPlatform
  };
};
