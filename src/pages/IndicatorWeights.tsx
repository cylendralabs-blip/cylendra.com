import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import type { FusionWeights, UserAISettings } from '@/types/ai-settings';
import { applyWeightPreset } from '@/core/ai-settings';
import { Loader2, Scale, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TIMEFRAMES = ['global', '1m', '5m', '15m', '1h', '4h', '1d'] as const;

const IndicatorWeightsPage = () => {
  const { t } = useTranslation('ai_settings');
  const { settings, isLoading, saveSettings, mergeWithDefaults, buildEffectiveSettings } =
    useAISettings();
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState<(typeof TIMEFRAMES)[number]>('global');
  const [smartMode, setSmartMode] = useState(true);
  const [draft, setDraft] = useState<UserAISettings | null>(null);

  const PRESETS = [
    { key: 'balanced', label: t('weights.presets.balanced') },
    { key: 'momentum', label: t('weights.presets.momentum') },
    { key: 'sentiment', label: t('weights.presets.sentiment') },
    { key: 'conservative', label: t('weights.presets.conservative') }
  ] as const;

  const WEIGHT_FIELDS: { key: keyof FusionWeights; label: string }[] = [
    { key: 'technical', label: t('weights.fields.technical') },
    { key: 'volume', label: t('weights.fields.volume') },
    { key: 'patterns', label: t('weights.fields.patterns') },
    { key: 'elliott', label: t('weights.fields.elliott') },
    { key: 'sentiment', label: t('weights.fields.sentiment') },
    { key: 'aiFusion', label: t('weights.fields.aiFusion') }
  ];

  const baseGlobal = useMemo(
    () => mergeWithDefaults(settings?.globalSettings),
    [settings, mergeWithDefaults]
  );

  useEffect(() => {
    if (settings) {
      setSmartMode(settings.smartModeEnabled ?? true);
    }
  }, [settings]);

  useEffect(() => {
    if (!settings) {
      setDraft(mergeWithDefaults(undefined));
      return;
    }

    if (selectedTimeframe === 'global') {
      setDraft(baseGlobal);
    } else {
      setDraft(buildEffectiveSettings(settings, selectedTimeframe));
    }
  }, [settings, selectedTimeframe, baseGlobal, buildEffectiveSettings]);

  const setWeights = (weights: FusionWeights) => {
    setDraft((prev) => (prev ? { ...prev, fusionWeights: weights } : prev));
  };

  const updateWeight = (key: keyof FusionWeights, value: number) => {
    setDraft((prev) =>
      prev
        ? {
          ...prev,
          fusionWeights: {
            ...prev.fusionWeights,
            [key]: value
          }
        }
        : prev
    );
  };

  const totalWeight = draft
    ? WEIGHT_FIELDS.reduce((sum, field) => sum + (draft.fusionWeights[field.key] ?? 0), 0)
    : 0;

  const handleApplyPreset = (preset: any) => {
    if (!draft) return;
    const updated = applyWeightPreset(draft, preset);
    setDraft(updated);
  };

  const handleSave = async () => {
    if (!draft || totalWeight !== 100) {
      toast({
        title: t('weights.invalid_sum_title'),
        description: t('weights.invalid_sum_desc'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        smartModeEnabled: smartMode,
        globalSettings: selectedTimeframe === 'global' ? draft : baseGlobal,
        timeframeProfiles:
          selectedTimeframe === 'global'
            ? settings?.timeframeProfiles ?? {}
            : {
              ...(settings?.timeframeProfiles ?? {}),
              [selectedTimeframe]: draft
            }
      };

      await saveSettings(payload);
      toast({
        title: t('weights.toast.saved_title'),
        description: t('weights.toast.saved_desc')
      });
    } catch (error) {
      toast({
        title: t('weights.toast.save_failed_title'),
        description: t('weights.toast.save_failed_desc'),
        variant: 'destructive'
      });
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="text-primary" />
            <Badge variant={smartMode ? 'default' : 'secondary'}>
              {smartMode ? t('settings.smart_mode') : t('settings.custom_mode')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mt-2">{t('weights.title')}</h1>
          <p className="text-muted-foreground">
            {t('weights.subtitle')}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {t('weights.save_weights')}
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('weights.timeframe_label')}</CardTitle>
            <CardDescription>{t('weights.timeframe_desc')}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('settings.timeframe_card.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf === 'global' ? t('settings.timeframe_labels.global') : tf.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {t('settings.smart_default')}
              <Switch checked={smartMode} onCheckedChange={setSmartMode} />
            </div>
            <div className={`text-sm font-semibold ${totalWeight === 100 ? 'text-primary' : 'text-destructive'}`}>
              {t('weights.total_sum_label', { total: totalWeight })}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('weights.presets_title')}</CardTitle>
          <CardDescription>{t('weights.presets_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {PRESETS.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="outline"
              onClick={() => handleApplyPreset(preset.key)}
            >
              {preset.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('weights.weights_title')}</CardTitle>
          <CardDescription>{t('weights.weights_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {WEIGHT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{field.label}</span>
                <Badge variant="secondary">{draft.fusionWeights[field.key]}%</Badge>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.fusionWeights[field.key]}
                onChange={(e) => updateWeight(field.key, Number(e.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default IndicatorWeightsPage;
