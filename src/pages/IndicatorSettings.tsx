import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Save, Settings, Sliders } from 'lucide-react';
import type { UserAISettings } from '@/types/ai-settings';
import { useAISettings } from '@/hooks/useAISettings';
import { useTranslation } from 'react-i18next';
import { cloneSmartDefaults } from '@/core/ai-settings';

const TIMEFRAMES = ['global', '1m', '5m', '15m', '1h', '4h', '1d'] as const;

type IndicatorKey = keyof UserAISettings['indicators'];

const IndicatorSettingsPage = () => {
  const { t } = useTranslation('ai_settings');

  const TECHNICAL_PARAMS = useMemo(() => [
    { key: 'rsiLength', label: t('settings.indicators.technical.params.rsiLength') },
    { key: 'macdFast', label: t('settings.indicators.technical.params.macdFast') },
    { key: 'macdSlow', label: t('settings.indicators.technical.params.macdSlow') },
    { key: 'macdSignal', label: t('settings.indicators.technical.params.macdSignal') },
    { key: 'atrPeriod', label: t('settings.indicators.technical.params.atrPeriod') },
    { key: 'adxPeriod', label: t('settings.indicators.technical.params.adxPeriod') }
  ], [t]) as any;

  const VOLUME_PARAMS = useMemo(() => [
    { key: 'lookback', label: t('settings.indicators.volume.params.lookback') },
    { key: 'spikeMultiplier', label: t('settings.indicators.volume.params.spikeMultiplier') },
    { key: 'deltaMin', label: t('settings.indicators.volume.params.deltaMin') }
  ], [t]) as any;

  const SENTIMENT_PARAMS = useMemo(() => [
    { key: 'minScore', label: t('settings.indicators.sentiment.params.minScore') }
  ], [t]) as any;

  const { settings, isLoading, saveSettings, resetSettings, mergeWithDefaults, buildEffectiveSettings } =
    useAISettings();
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState<(typeof TIMEFRAMES)[number]>('global');
  const [smartMode, setSmartMode] = useState(true);
  const [draft, setDraft] = useState<UserAISettings | null>(null);

  const INDICATOR_LABELS: Record<IndicatorKey, { label: string; description: string }> = {
    technical: { label: t('settings.indicators.technical.label'), description: t('settings.indicators.technical.description') },
    volume: { label: t('settings.indicators.volume.label'), description: t('settings.indicators.volume.description') },
    patterns: { label: t('settings.indicators.patterns.label'), description: t('settings.indicators.patterns.description') },
    elliott: { label: t('settings.indicators.elliott.label'), description: t('settings.indicators.elliott.description') },
    sentiment: { label: t('settings.indicators.sentiment.label'), description: t('settings.indicators.sentiment.description') },
    aiFusion: { label: t('settings.indicators.aiFusion.label'), description: t('settings.indicators.aiFusion.description') },
    wave: { label: t('settings.indicators.wave.label'), description: t('settings.indicators.wave.description') },
    candlePatterns: { label: t('settings.indicators.candlePatterns.label'), description: t('settings.indicators.candlePatterns.description') }
  };

  const TIMEFRAME_LABELS: Record<(typeof TIMEFRAMES)[number], string> = {
    global: t('settings.timeframe_labels.global'),
    '1m': t('settings.timeframe_labels.1m'),
    '5m': t('settings.timeframe_labels.5m'),
    '15m': t('settings.timeframe_labels.15m'),
    '1h': t('settings.timeframe_labels.1h'),
    '4h': t('settings.timeframe_labels.4h'),
    '1d': t('settings.timeframe_labels.1d')
  };

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
      setDraft(cloneSmartDefaults());
      return;
    }

    if (selectedTimeframe === 'global') {
      setDraft(baseGlobal);
    } else {
      setDraft(buildEffectiveSettings(settings, selectedTimeframe));
    }
  }, [settings, selectedTimeframe, baseGlobal, buildEffectiveSettings]);

  const handleIndicatorToggle = (key: IndicatorKey, enabled: boolean) => {
    setDraft((prev) =>
      prev
        ? {
          ...prev,
          indicators: {
            ...prev.indicators,
            [key]: {
              ...prev.indicators[key],
              enabled
            }
          }
        }
        : prev
    );
  };

  const handleParamChange = (
    indicator: IndicatorKey,
    param: string,
    value: number | string
  ) => {
    setDraft((prev) =>
      prev
        ? {
          ...prev,
          indicators: {
            ...prev.indicators,
            [indicator]: {
              ...prev.indicators[indicator],
              params: {
                ...prev.indicators[indicator]?.params,
                [param]: value
              }
            }
          }
        }
        : prev
    );
  };

  const handleSave = async () => {
    if (!draft) return;

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
        title: t('settings.toast.saved_title'),
        description: t('settings.toast.saved_desc')
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t('settings.toast.save_failed_title'),
        description: t('settings.toast.save_failed_desc'),
        variant: 'destructive'
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      toast({
        title: t('settings.toast.reset_title'),
        description: t('settings.toast.reset_desc')
      });
    } catch (error) {
      toast({
        title: t('settings.toast.reset_failed_title'),
        description: t('settings.toast.reset_failed_desc'),
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
            <Settings className="text-primary" />
            <Badge variant={smartMode ? 'default' : 'secondary'}>
              {smartMode ? t('settings.smart_mode') : t('settings.custom_mode')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mt-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('settings.smart_default')}</span>
            <Switch checked={smartMode} onCheckedChange={setSmartMode} />
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('settings.reset_defaults')}
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {t('settings.save_settings')}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('settings.timeframe_card.title')}</CardTitle>
            <CardDescription>{t('settings.timeframe_card.subtitle')}</CardDescription>
          </div>
          <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t('settings.timeframe_card.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {TIMEFRAME_LABELS[tf]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Tabs defaultValue="indicators" className="space-y-6">
        <TabsList className="grid grid-cols-3 md:w-1/2">
          <TabsTrigger value="indicators">{t('settings.tabs.indicators')}</TabsTrigger>
          <TabsTrigger value="filters">{t('settings.tabs.filters')}</TabsTrigger>
          <TabsTrigger value="sources">{t('settings.tabs.sources')}</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-4">
          {Object.entries(INDICATOR_LABELS).map(([key, meta]) => (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{meta.label}</CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </div>
                <Switch
                  checked={draft.indicators[key as IndicatorKey]?.enabled ?? false}
                  onCheckedChange={(checked) => handleIndicatorToggle(key as IndicatorKey, checked)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {key === 'technical' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {TECHNICAL_PARAMS.map((param) => (
                      <div key={param.key}>
                        <label className="text-sm text-muted-foreground">{param.label}</label>
                        <Input
                          type="number"
                          value={(() => {
                            const val = draft.indicators.technical.params?.[param.key];
                            if (typeof val === 'number') return val;
                            if (typeof val === 'string') {
                              const num = Number(val);
                              return isNaN(num) ? '' : num;
                            }
                            return '';
                          })()}
                          onChange={(e) =>
                            handleParamChange('technical', param.key, Number(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {key === 'volume' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {VOLUME_PARAMS.map((param) => (
                      <div key={param.key}>
                        <label className="text-sm text-muted-foreground">{param.label}</label>
                        <Input
                          type="number"
                          value={(() => {
                            const val = draft.indicators.volume.params?.[param.key];
                            if (typeof val === 'number') return val;
                            if (typeof val === 'string') {
                              const num = Number(val);
                              return isNaN(num) ? '' : num;
                            }
                            return '';
                          })()}
                          onChange={(e) =>
                            handleParamChange('volume', param.key, Number(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {key === 'sentiment' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {SENTIMENT_PARAMS.map((param) => (
                      <div key={param.key}>
                        <label className="text-sm text-muted-foreground">{param.label}</label>
                        <Input
                          type="number"
                          value={(() => {
                            const val = draft.indicators.sentiment.params?.[param.key];
                            if (typeof val === 'number') return val;
                            if (typeof val === 'string') {
                              const num = Number(val);
                              return isNaN(num) ? '' : num;
                            }
                            return '';
                          })()}
                          onChange={(e) =>
                            handleParamChange('sentiment', param.key, Number(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.filters.title')}</CardTitle>
              <CardDescription>{t('settings.filters.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">{t('settings.filters.sensitivity_label')}</label>
                  <Select
                    value={draft.sensitivity}
                    onValueChange={(value) =>
                      setDraft((prev) => (prev ? { ...prev, sensitivity: value as UserAISettings['sensitivity'] } : prev))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.filters.sensitivity_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('settings.filters.sensitivity_low')}</SelectItem>
                      <SelectItem value="medium">{t('settings.filters.sensitivity_medium')}</SelectItem>
                      <SelectItem value="high">{t('settings.filters.sensitivity_high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('settings.filters.min_confidence_label')}</label>
                  <Input
                    type="number"
                    min={40}
                    max={90}
                    value={draft.minConfidence}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? { ...prev, minConfidence: Number(e.target.value) } : prev
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('settings.filters.min_confidence_desc')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">{t('settings.filters.bias_mode_label')}</label>
                  <Select
                    value={draft.biasMode}
                    onValueChange={(value) =>
                      setDraft((prev) =>
                        prev ? { ...prev, biasMode: value as UserAISettings['biasMode'] } : prev
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.filters.bias_mode_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('settings.filters.bias_mode_auto')}</SelectItem>
                      <SelectItem value="breakout">{t('settings.filters.bias_mode_breakout')}</SelectItem>
                      <SelectItem value="reversal">{t('settings.filters.bias_mode_reversal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('settings.filters.fusion_model_label')}</label>
                  <Select
                    value={draft.model}
                    onValueChange={(value) =>
                      setDraft((prev) =>
                        prev ? { ...prev, model: value as UserAISettings['model'] } : prev
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.filters.fusion_model_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">{t('settings.filters.fusion_model_hybrid')}</SelectItem>
                      <SelectItem value="technical">{t('settings.filters.fusion_model_technical')}</SelectItem>
                      <SelectItem value="sentiment">{t('settings.filters.fusion_model_sentiment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.sources.title')}</CardTitle>
              <CardDescription>{t('settings.sources.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                { key: 'ai', label: t('settings.sources.ai_analysis') },
                { key: 'tradingview', label: t('settings.sources.tv_signals') },
                { key: 'legacy', label: t('settings.sources.legacy_engine') }
              ].map((source) => (
                <div
                  key={source.key}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">{source.label}</div>
                    <p className="text-sm text-muted-foreground">{t('settings.sources.include_source_desc')}</p>
                  </div>
                  <Switch
                    checked={draft.sources[source.key as keyof typeof draft.sources]}
                    onCheckedChange={(checked) =>
                      setDraft((prev) =>
                        prev
                          ? {
                            ...prev,
                            sources: {
                              ...prev.sources,
                              [source.key]: checked
                            }
                          }
                          : prev
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IndicatorSettingsPage;

