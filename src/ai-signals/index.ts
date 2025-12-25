/**
 * AI Ultra Signal Engine - Main Export
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 * 
 * This module exports the main analyzer engine and all analyzer modules
 */

// Main engine
export { UltraSignalAnalyzer, analyzeMarket, defaultAnalyzer } from './engine';

// Analyzer modules
export { analyzeTechnical, getRSI, getMACD, getADX, getATR, getStochastic, getBollingerBands, getEMA, getVWAP } from './analyzer/technical';
export { analyzeVolume, getBuyPressure, getSellPressure, getDeltaVolume, checkVolumeSpike } from './analyzer/volume';
export { analyzePatterns } from './analyzer/patterns';
export { analyzeElliottWaves } from './analyzer/elliott';
export { analyzeSentiment, analyzeSentimentSync } from './analyzer/sentiment';
export { fuseAnalysis } from './analyzer/ai';
export { UltraSignalEngine, generateUltraSignal } from './fusion/fusionEngine';

// Dispatcher (Phase X.3)
export {
  handleUltraSignal,
  dispatchRealtimeSignal,
  subscribeToLiveSignals,
  unsubscribeFromLiveSignals,
  broadcastToTelegram,
  formatSignalForTelegram,
  testTelegramConnection,
  addLiveSignal,
  removeSignalFromBuffer,
  getLiveSignals,
  getLiveSignalsFiltered,
  getLiveSignalById,
  clearLiveSignalsBuffer,
  getBufferStats,
  signalTTL,
  isLongTermTimeframe,
  saveSignalToHistory,
  getSignalsFromHistory,
  getHistoryStats
} from './dispatcher';

// Types
export type {
  AnalysisResult,
  AnalysisInput,
  AnalyzerConfig,
  TechnicalAnalysisResult,
  VolumeAnalysisResult,
  PatternAnalysisResult,
  ElliottWaveAnalysisResult,
  SentimentAnalysisResult,
  AIFusionResult,
  VolumeData,
  SentimentData,
  Timeframe,
  TrendDirection,
  MarketBias,
  RiskLevel,
  VolatilityLevel
} from './types';
export type {
  RawSignalSource,
  UltraSignal,
  FusionEngineConfig,
  GenerateUltraSignalParams,
  SignalSourceType
} from './fusion/types';

// Default configuration
export { DEFAULT_ANALYZER_CONFIG } from './types';

