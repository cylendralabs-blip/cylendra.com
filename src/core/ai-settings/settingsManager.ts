import type {
  StoredAISettings,
  UserAISettings,
  FusionWeights,
  IndicatorSettings
} from '@/types/ai-settings';
import { cloneSmartDefaults } from './defaults';
import { applyTimeframeProfile } from './timeframeProfiles';
import { getWeightPreset, normalizeWeights } from './weightProfiles';
import { userSettingsSchema } from './validator';

type PartialUserSettings = Partial<UserAISettings>;

function deepMerge<T extends Record<string, any>>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const result: Record<string, any> = structuredClone(base);

  Object.entries(override).forEach(([key, value]) => {
    if (value === undefined) return;

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      result[key] = deepMerge(result[key] ?? {}, value);
    } else {
      result[key] = value;
    }
  });

  return result as T;
}

function normalizeIndicators(
  base: Record<string, IndicatorSettings>,
  override?: Record<string, IndicatorSettings>
) {
  if (!override) return base;
  const indicators = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    indicators[key] = {
      ...indicators[key],
      ...value,
      params: { ...indicators[key]?.params, ...value.params }
    };
  });
  return indicators;
}

export function mergeWithDefaults(
  userSettings?: PartialUserSettings
): UserAISettings {
  const base = cloneSmartDefaults();

  if (!userSettings) {
    return base;
  }

  const merged: UserAISettings = {
    ...base,
    ...userSettings,
    fusionWeights: userSettings.fusionWeights
      ? normalizeWeights({
          ...base.fusionWeights,
          ...userSettings.fusionWeights
        } as FusionWeights)
      : base.fusionWeights,
    indicators: normalizeIndicators(base.indicators, userSettings.indicators)
  };

  return userSettingsSchema.parse(merged);
}

export function buildEffectiveSettings(
  stored: StoredAISettings | null,
  timeframe?: string
): UserAISettings {
  const base = mergeWithDefaults(stored?.globalSettings);
  if (!timeframe) {
    return base;
  }

  const override = stored?.timeframeProfiles?.[timeframe];
  if (override) {
    const merged = mergeWithDefaults(deepMerge(base, override));
    return applyTimeframeProfile(merged, timeframe);
  }

  return applyTimeframeProfile(base, timeframe);
}

export function applyWeightPreset(
  settings: UserAISettings,
  preset: Parameters<typeof getWeightPreset>[0]
): UserAISettings {
  return {
    ...settings,
    fusionWeights: getWeightPreset(preset)
  };
}

