import type { FusionWeights, IndicatorSettings, UserAISettings } from '@/types/ai-settings';

export const SMART_DEFAULT_WEIGHTS: FusionWeights = {
  technical: 25,
  volume: 20,
  patterns: 15,
  elliott: 15,
  sentiment: 10,
  aiFusion: 15
};

const indicator = (enabled = true, params: IndicatorSettings['params'] = {}): IndicatorSettings => ({
  enabled,
  params
});

export const SMART_DEFAULT_INDICATORS: Record<string, IndicatorSettings> = {
  technical: indicator(true, {
    rsiLength: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    atrPeriod: 14,
    adxPeriod: 14
  }),
  volume: indicator(true, {
    lookback: 20,
    spikeMultiplier: 2,
    deltaMin: 0.1
  }),
  patterns: indicator(true, {
    minPatternStrength: 60
  }),
  elliott: indicator(true, {
    minWaveConfidence: 55
  }),
  sentiment: indicator(true, {
    minScore: 45
  }),
  aiFusion: indicator(true),
  wave: indicator(true),
  candlePatterns: indicator(true)
};

export const SMART_DEFAULT_SETTINGS: UserAISettings = {
  indicators: SMART_DEFAULT_INDICATORS as Record<any, IndicatorSettings>,
  fusionWeights: SMART_DEFAULT_WEIGHTS,
  sensitivity: 'medium',
  minConfidence: 60,
  biasMode: 'auto',
  model: 'hybrid',
  sources: {
    ai: true,
    tradingview: true,
    legacy: true
  }
};

export function cloneSmartDefaults(): UserAISettings {
  return structuredClone(SMART_DEFAULT_SETTINGS);
}

