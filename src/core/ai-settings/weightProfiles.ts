import type { FusionWeights } from '@/types/ai-settings';
import { SMART_DEFAULT_WEIGHTS } from './defaults';

export type WeightPreset = 'balanced' | 'momentum' | 'sentiment' | 'conservative';

export const WEIGHT_PRESETS: Record<WeightPreset, FusionWeights> = {
  balanced: SMART_DEFAULT_WEIGHTS,
  momentum: {
    technical: 30,
    volume: 25,
    patterns: 15,
    elliott: 10,
    sentiment: 5,
    aiFusion: 15
  },
  sentiment: {
    technical: 20,
    volume: 15,
    patterns: 10,
    elliott: 10,
    sentiment: 30,
    aiFusion: 15
  },
  conservative: {
    technical: 22,
    volume: 20,
    patterns: 18,
    elliott: 18,
    sentiment: 7,
    aiFusion: 15
  }
};

export function normalizeWeights(weights: FusionWeights): FusionWeights {
  const total =
    weights.technical +
    weights.volume +
    weights.patterns +
    weights.elliott +
    weights.sentiment +
    weights.aiFusion;

  if (total === 100) {
    return weights;
  }

  const factor = 100 / total;
  return {
    technical: Math.round(weights.technical * factor),
    volume: Math.round(weights.volume * factor),
    patterns: Math.round(weights.patterns * factor),
    elliott: Math.round(weights.elliott * factor),
    sentiment: Math.round(weights.sentiment * factor),
    aiFusion: Math.round(weights.aiFusion * factor)
  };
}

export function getWeightPreset(preset: WeightPreset): FusionWeights {
  return normalizeWeights(structuredClone(WEIGHT_PRESETS[preset]));
}

