export type IndicatorToggle =
  | 'technical'
  | 'volume'
  | 'patterns'
  | 'elliott'
  | 'sentiment'
  | 'aiFusion'
  | 'wave'
  | 'candlePatterns';

export interface IndicatorSettings {
  enabled: boolean;
  params?: Record<string, number | string | boolean>;
}

export interface FusionWeights {
  technical: number;
  volume: number;
  patterns: number;
  elliott: number;
  sentiment: number;
  aiFusion: number;
}

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface TimeframeProfile {
  timeframe: string;
  overrides: Partial<UserAISettings>;
}

export interface UserAISettings {
  indicators: Record<IndicatorToggle, IndicatorSettings>;
  fusionWeights: FusionWeights;
  sensitivity: SensitivityLevel;
  minConfidence: number;
  biasMode: 'auto' | 'breakout' | 'reversal';
  model: 'hybrid' | 'technical' | 'sentiment';
  sources: {
    ai: boolean;
    tradingview: boolean;
    legacy: boolean;
  };
}

export interface StoredAISettings {
  userId: string;
  smartModeEnabled: boolean;
  globalSettings: UserAISettings;
  timeframeProfiles: Record<string, UserAISettings>;
  weightPresets?: Record<string, FusionWeights>;
  lastResetAt?: string | null;
  signalSource: 'ai' | 'tradingview' | 'legacy';
  createdAt: string;
  updatedAt: string;
}

