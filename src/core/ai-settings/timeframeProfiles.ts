import type { UserAISettings } from '@/types/ai-settings';
import { cloneSmartDefaults } from './defaults';

type TimeframeProfileMap = Record<string, Partial<UserAISettings>>;

export const TIMEFRAME_PROFILES: TimeframeProfileMap = {
  '1m': {
    sensitivity: 'high',
    minConfidence: 65,
    fusionWeights: {
      technical: 30,
      volume: 25,
      patterns: 15,
      elliott: 10,
      sentiment: 10,
      aiFusion: 10
    }
  },
  '5m': {
    sensitivity: 'high',
    fusionWeights: {
      technical: 28,
      volume: 22,
      patterns: 18,
      elliott: 12,
      sentiment: 10,
      aiFusion: 10
    }
  },
  '15m': {
    sensitivity: 'medium',
    minConfidence: 60
  },
  '1h': {
    sensitivity: 'medium',
    minConfidence: 62,
    fusionWeights: {
      technical: 24,
      volume: 20,
      patterns: 15,
      elliott: 18,
      sentiment: 8,
      aiFusion: 15
    }
  },
  '4h': {
    sensitivity: 'medium',
    minConfidence: 65,
    fusionWeights: {
      technical: 22,
      volume: 18,
      patterns: 15,
      elliott: 20,
      sentiment: 10,
      aiFusion: 15
    }
  },
  '1d': {
    sensitivity: 'low',
    minConfidence: 70,
    fusionWeights: {
      technical: 20,
      volume: 15,
      patterns: 20,
      elliott: 20,
      sentiment: 10,
      aiFusion: 15
    }
  }
};

export function getTimeframeProfile(timeframe: string): Partial<UserAISettings> | undefined {
  return TIMEFRAME_PROFILES[timeframe];
}

export function applyTimeframeProfile(
  settings: UserAISettings,
  timeframe?: string
): UserAISettings {
  if (!timeframe) {
    return settings;
  }

  const profile = getTimeframeProfile(timeframe);
  if (!profile) {
    return settings;
  }

  const merged = structuredClone(settings);

  if (profile.fusionWeights) {
    merged.fusionWeights = {
      ...merged.fusionWeights,
      ...profile.fusionWeights
    };
  }

  Object.assign(merged, { ...profile, fusionWeights: merged.fusionWeights });
  return merged;
}

export function buildDefaultProfileMap(): Record<string, UserAISettings> {
  const base = cloneSmartDefaults();
  const profiles: Record<string, UserAISettings> = {};

  Object.keys(TIMEFRAME_PROFILES).forEach((tf) => {
    profiles[tf] = applyTimeframeProfile(structuredClone(base), tf);
  });

  return profiles;
}

