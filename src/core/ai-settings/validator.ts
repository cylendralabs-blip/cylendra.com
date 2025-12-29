import { z } from 'zod';
import type {
  IndicatorSettings,
  UserAISettings,
  FusionWeights,
  StoredAISettings
} from '@/types/ai-settings';

const indicatorSchema = z.object({
  enabled: z.boolean(),
  params: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
});

const fusionWeightsSchema = z.object({
  technical: z.number().min(0).max(100),
  volume: z.number().min(0).max(100),
  patterns: z.number().min(0).max(100),
  elliott: z.number().min(0).max(100),
  sentiment: z.number().min(0).max(100),
  aiFusion: z.number().min(0).max(100)
});

export const userSettingsSchema = z.object({
  indicators: z.record(indicatorSchema),
  fusionWeights: fusionWeightsSchema.refine((w) => {
    const total =
      w.technical + w.volume + w.patterns + w.elliott + w.sentiment + w.aiFusion;
    return total === 100;
  }, 'Weights must sum to 100'),
  sensitivity: z.enum(['low', 'medium', 'high']),
  minConfidence: z.number().min(40).max(90),
  biasMode: z.enum(['auto', 'breakout', 'reversal']),
  model: z.enum(['hybrid', 'technical', 'sentiment']),
  sources: z.object({
    ai: z.boolean(),
    tradingview: z.boolean(),
    legacy: z.boolean()
  })
});

export const storedSettingsSchema = z.object({
  userId: z.string().uuid(),
  smartModeEnabled: z.boolean(),
  globalSettings: userSettingsSchema,
  timeframeProfiles: z.record(userSettingsSchema.partial()) as z.ZodType<Record<string, UserAISettings>>,
  weightPresets: z
    .record(fusionWeightsSchema)
    .optional(),
  lastResetAt: z.string().datetime().nullable().optional(),
  signalSource: z.enum(['ai', 'tradingview', 'legacy']),
  createdAt: z.string(),
  updatedAt: z.string()
});

export function validateUserSettings(settings: UserAISettings): UserAISettings {
  return userSettingsSchema.parse(settings) as UserAISettings;
}

