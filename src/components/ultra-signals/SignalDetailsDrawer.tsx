import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import type { UltraSignal } from '@/ai-signals';
import { useTranslation } from 'react-i18next';

interface SignalDetailsDrawerProps {
  signal: UltraSignal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LabelValue = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-semibold">{value ?? '—'}</span>
  </div>
);

export const SignalDetailsDrawer = ({ signal, open, onOpenChange }: SignalDetailsDrawerProps) => {
  const { t, i18n } = useTranslation('ultra_signals');

  if (!signal) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('common.details.title')}
          </SheetTitle>
          <SheetDescription>
            {signal.symbol} • {signal.timeframe} • {signal.side === 'BUY' ? t('common.filters.buy') : signal.side === 'SELL' ? t('common.filters.sell') : t('common.filters.wait')}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-120px)] pr-2">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <LabelValue label={t('common.details.metrics.final_confidence')} value={`${signal.finalConfidence.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.risk_level')} value={signal.riskLevel} />
              <LabelValue label={t('common.details.metrics.entry')} value={signal.entryPrice ? `$${signal.entryPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : null} />
              <LabelValue label={t('common.details.metrics.target')} value={signal.takeProfit ? `$${signal.takeProfit.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : null} />
              <LabelValue label={t('common.details.metrics.stop_loss')} value={signal.stopLoss ? `$${signal.stopLoss.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : null} />
              <LabelValue label={t('common.details.metrics.rr_ratio')} value={signal.rrRatio ? `1:${signal.rrRatio}` : null} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <LabelValue label={t('common.details.metrics.technical_score')} value={`${signal.technicalScore.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.volume_score')} value={`${signal.volumeScore.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.pattern_score')} value={`${signal.patternScore.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.wave_score')} value={`${signal.waveScore.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.sentiment_score')} value={`${signal.sentimentScore.toFixed(0)}%`} />
              <LabelValue label={t('common.details.metrics.ai_score')} value={`${signal.aiScore.toFixed(0)}%`} />
            </div>

            {signal.sourcesUsed?.length ? (
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('common.details.sources_used')}</h4>
                <div className="flex flex-wrap gap-2">
                  {signal.sourcesUsed.map((source) => (
                    <Badge key={`${source.source}-${source.symbol}-${source.timeframe}-${source.generatedAt}`}>
                      {source.source === 'AI_ANALYZER'
                        ? t('common.details.sources.ai_analyzer')
                        : source.source === 'TV_WEBHOOK'
                          ? t('common.details.sources.tv_webhook')
                          : source.source === 'LEGACY_ENGINE'
                            ? t('common.details.sources.legacy_engine')
                            : t('common.details.sources.manual')}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {signal.reasoning?.length ? (
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('common.details.reasoning_title')}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {signal.reasoning.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Phase X.11: Forecast Section */}
            {signal.forecast ? (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('common.details.forecast.title')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <LabelValue
                      label={t('common.details.forecast.success_probability')}
                      value={`${signal.forecast.success_probability.toFixed(1)}%`}
                    />
                    <LabelValue
                      label={t('common.details.forecast.classification')}
                      value={
                        signal.forecast.forecast_label === 'HIGH' ? t('common.table.high') :
                          signal.forecast.forecast_label === 'MEDIUM' ? t('common.table.medium') : t('common.table.low')
                      }
                    />
                    {signal.forecast.expected_return_pct !== undefined && (
                      <LabelValue
                        label={t('common.details.forecast.expected_return')}
                        value={`${signal.forecast.expected_return_pct > 0 ? '+' : ''}${signal.forecast.expected_return_pct.toFixed(2)}%`}
                      />
                    )}
                    {signal.forecast.expected_holding_seconds && (
                      <LabelValue
                        label={t('common.details.forecast.expected_duration')}
                        value={t('common.details.forecast.duration_value', { minutes: Math.round(signal.forecast.expected_holding_seconds / 60) })}
                      />
                    )}
                    {signal.forecast.risk_adjusted_score !== undefined && (
                      <LabelValue
                        label={t('common.details.forecast.risk_adjusted_score')}
                        value={`${signal.forecast.risk_adjusted_score.toFixed(1)}%`}
                      />
                    )}
                    {signal.forecast.sample_size !== undefined && (
                      <LabelValue
                        label={t('common.details.forecast.sample_size')}
                        value={t('common.details.forecast.sample_size_value', { count: signal.forecast.sample_size })}
                      />
                    )}
                  </div>
                  {signal.forecast.sample_size !== undefined && signal.forecast.sample_size > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('common.details.forecast.forecast_desc', { count: signal.forecast.sample_size })}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

