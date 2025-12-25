import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { UltraSignal } from '@/ai-signals';
import { cn } from '@/lib/utils';
import { memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { arSA, enUS } from 'date-fns/locale';

interface SignalTableProps {
  signals: UltraSignal[];
  isLoading: boolean;
  onSelectSignal?: (signal: UltraSignal) => void;
}

const sideBadgeVariant: Record<UltraSignal['side'], string> = {
  BUY: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
  SELL: 'bg-red-500/15 text-red-500 border border-red-500/30',
  WAIT: 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
};

const riskBadgeClass: Record<string, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-500 border border-orange-500/30',
  EXTREME: 'bg-red-500/15 text-red-500 border border-red-500/30'
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-emerald-500';
  if (confidence >= 65) return 'text-blue-500';
  if (confidence >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const forecastLabelColor: Record<string, string> = {
  HIGH: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
  LOW: 'bg-red-500/15 text-red-500 border border-red-500/30'
};

// Phase X.15: Memoized SignalTable for performance
export const SignalTable = memo(({ signals, isLoading, onSelectSignal }: SignalTableProps) => {
  const { t, i18n } = useTranslation('ultra_signals');

  // Phase X.15: Memoize signal rows to prevent unnecessary re-renders
  const signalRows = useMemo(() => {
    return signals.map((signal) => ({
      ...signal,
      key: signal.id,
    }));
  }, [signals]);

  // Phase X.15: Memoize click handler
  const handleSignalClick = useCallback((signal: UltraSignal) => {
    onSelectSignal?.(signal);
  }, [onSelectSignal]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.table.loading_live')}
      </div>
    );
  }

  if (!signals.length) {
    return (
      <div className="text-muted-foreground text-sm py-8 border border-dashed border-border rounded-lg text-center">
        {t('common.table.no_signals')}
      </div>
    );
  }

  const dateLocale = i18n.language === 'ar' ? arSA : enUS;

  return (
    <ScrollArea className="w-full overflow-x-auto rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>{t('common.table.time')}</TableHead>
            <TableHead>{t('common.table.symbol')}</TableHead>
            <TableHead>{t('common.table.timeframe')}</TableHead>
            <TableHead>{t('common.table.side')}</TableHead>
            <TableHead>{t('common.table.entry_target_sl')}</TableHead>
            <TableHead>{t('common.table.confidence')}</TableHead>
            <TableHead>{t('common.table.risk')}</TableHead>
            <TableHead>{t('common.table.rr')}</TableHead>
            <TableHead>{t('common.table.success_prob')}</TableHead>
            <TableHead>{t('common.table.expected_return')}</TableHead>
            <TableHead>{t('common.table.forecast')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signalRows.map((signal) => (
            <TableRow
              key={signal.id}
              className="cursor-pointer transition hover:bg-muted/30"
              onClick={() => handleSignalClick(signal)}
            >
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {signal.createdAt
                  ? formatDistanceToNow(new Date(signal.createdAt), {
                    addSuffix: true,
                    locale: dateLocale
                  })
                  : '—'}
              </TableCell>
              <TableCell className="font-semibold">{signal.symbol}</TableCell>
              <TableCell>{signal.timeframe}</TableCell>
              <TableCell>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', sideBadgeVariant[signal.side])}>
                  {signal.side === 'BUY' ? t('common.filters.buy') : signal.side === 'SELL' ? t('common.filters.sell') : t('common.filters.wait')}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs min-w-[120px]">
                  <span>{t('common.table.entry')}: {signal.entryPrice ? `$${signal.entryPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : '—'}</span>
                  <span>{t('common.table.target')}: {signal.takeProfit ? `$${signal.takeProfit.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : '—'}</span>
                  <span>{t('common.table.stop')}: {signal.stopLoss ? `$${signal.stopLoss.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}` : '—'}</span>
                </div>
              </TableCell>
              <TableCell className={cn('font-semibold', confidenceColor(signal.finalConfidence))}>
                {signal.finalConfidence.toFixed(0)}%
              </TableCell>
              <TableCell>
                <Badge className={riskBadgeClass[signal.riskLevel] || 'bg-slate-500'}>
                  {signal.riskLevel}
                </Badge>
              </TableCell>
              <TableCell>{signal.rrRatio ? `1:${signal.rrRatio}` : '—'}</TableCell>
              <TableCell className={cn('font-semibold', signal.forecast ? confidenceColor(signal.forecast.success_probability) : 'text-muted-foreground')}>
                {signal.forecast ? `${signal.forecast.success_probability.toFixed(0)}%` : '—'}
              </TableCell>
              <TableCell className={cn('font-semibold', signal.forecast?.expected_return_pct && signal.forecast.expected_return_pct > 0 ? 'text-emerald-500' : signal.forecast?.expected_return_pct && signal.forecast.expected_return_pct < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                {signal.forecast?.expected_return_pct !== undefined
                  ? `${signal.forecast.expected_return_pct > 0 ? '+' : ''}${signal.forecast.expected_return_pct.toFixed(2)}%`
                  : '—'}
              </TableCell>
              <TableCell>
                {signal.forecast ? (
                  <Badge className={forecastLabelColor[signal.forecast.forecast_label] || 'bg-slate-500'}>
                    {signal.forecast.forecast_label === 'HIGH' ? t('common.table.high') : signal.forecast.forecast_label === 'MEDIUM' ? t('common.table.medium') : t('common.table.low')}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
});

SignalTable.displayName = 'SignalTable';

