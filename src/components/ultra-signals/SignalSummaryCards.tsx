import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface LiveSummaryStats {
  total: number;
  buy: number;
  sell: number;
  wait: number;
  avgConfidence: number;
  strongCount: number;
}

export interface HistorySummaryStats {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  averageConfidence: number;
  averageRR: number;
}

interface SignalSummaryCardsProps {
  // Live mode props
  stats?: LiveSummaryStats;
  isRealtimeConnected?: boolean;
  lastUpdated?: string | null;
  // History mode props
  totalSignals?: number;
  buySignals?: number;
  sellSignals?: number;
  averageConfidence?: number;
  averageRR?: number;
  isLive?: boolean;
}

export const SignalSummaryCards = ({
  stats,
  isRealtimeConnected,
  lastUpdated,
  // History mode props
  totalSignals,
  buySignals,
  sellSignals,
  averageConfidence,
  averageRR,
  isLive = true
}: SignalSummaryCardsProps) => {
  const { t, i18n } = useTranslation('ultra_signals');
  // Determine if we're in history mode
  const isHistoryMode = !isLive || (totalSignals !== undefined && stats === undefined);

  const SUMMARY_CARDS = [
    { key: 'total', label: t('common.summary.total_signals'), color: 'text-primary' },
    { key: 'buy', label: t('common.summary.buy_signals'), color: 'text-emerald-500' },
    { key: 'sell', label: t('common.summary.sell_signals'), color: 'text-red-500' },
    { key: 'strongCount', label: t('common.summary.strong_signals'), color: 'text-purple-500' }
  ] as const;

  if (isHistoryMode) {
    // History mode
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {t('common.summary.total_signals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {(totalSignals || 0).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {t('common.summary.buy_signals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-emerald-500">
              {(buySignals || 0).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {t('common.summary.sell_signals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-red-500">
              {(sellSignals || 0).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {t('common.summary.avg_confidence')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-blue-500">
              {Math.round(averageConfidence || 0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {t('common.summary.avg_rr')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-purple-500">
              {(averageRR || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live mode
  if (!stats) return null;

  const connectionBadge = isRealtimeConnected ? (
    <Badge className="bg-emerald-500 text-white">{t('common.summary.connected')}</Badge>
  ) : (
    <Badge variant="secondary">{t('common.summary.reconnecting')}</Badge>
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {SUMMARY_CARDS.map((card) => (
        <Card key={card.key} className="border border-border/60 bg-muted/30 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-3xl font-semibold', card.color)}>
              {stats[card.key as keyof LiveSummaryStats].toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2 xl:col-span-1 border border-border/60 bg-muted/30 backdrop-blur">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs text-muted-foreground font-medium">
            {t('common.summary.realtime_status')}
          </CardTitle>
          {connectionBadge}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('common.summary.last_updated')}:{' '}
            <span className="font-medium text-foreground">
              {lastUpdated
                ? new Date(lastUpdated).toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                : '—'}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('common.summary.avg_confidence')}: <span className="font-semibold">{Math.round(stats.avgConfidence)}%</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

