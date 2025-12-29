import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { SignalSummaryCards, type LiveSummaryStats } from '@/components/ultra-signals/SignalSummaryCards';
import { SignalFilters, type SignalFiltersState } from '@/components/ultra-signals/SignalFilters';
import { SignalTable } from '@/components/ultra-signals/SignalTable';
import { SignalDetailsDrawer } from '@/components/ultra-signals/SignalDetailsDrawer';
import { useUltraSignalsLive } from '@/hooks/useUltraSignalsLive';
import type { UltraSignal } from '@/ai-signals';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_FILTERS: SignalFiltersState = {
  symbol: 'ALL',
  timeframe: 'ALL',
  side: 'ALL',
  minConfidence: 0,
  strongOnly: false
};

const STRONG_SIGNAL_THRESHOLD = 75;

const UltraSignalsLive = () => {
  const { t } = useTranslation('ultra_signals');
  const { toast } = useToast();
  const { signals, isLoading, isRealtimeConnected, latestSignal, lastUpdated } =
    useUltraSignalsLive();
  const [filters, setFilters] = useState<SignalFiltersState>(DEFAULT_FILTERS);
  const [selectedSignal, setSelectedSignal] = useState<UltraSignal | null>(null);

  useEffect(() => {
    if (!latestSignal) return;

    if (latestSignal.finalConfidence >= STRONG_SIGNAL_THRESHOLD) {
      toast({
        title: `${latestSignal.symbol} (${latestSignal.timeframe})`,
        description: t('live.toast.strong_signal', {
          side: latestSignal.side === 'BUY' ? t('common.filters.buy') : t('common.filters.sell'),
          confidence: latestSignal.finalConfidence.toFixed(0)
        }),
        duration: 5000
      });
    }
  }, [latestSignal, toast, t]);

  const availableSymbols = useMemo(() => {
    const entries = Array.from(new Set(signals.map((s) => s.symbol)));
    return entries.sort();
  }, [signals]);

  const availableTimeframes = useMemo(() => {
    const entries = Array.from(new Set(signals.map((s) => s.timeframe)));
    return entries.sort();
  }, [signals]);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      if (filters.symbol !== 'ALL' && signal.symbol !== filters.symbol) return false;
      if (filters.timeframe !== 'ALL' && signal.timeframe !== filters.timeframe) return false;
      if (filters.side !== 'ALL' && signal.side !== filters.side) return false;
      if (signal.finalConfidence < filters.minConfidence) return false;
      if (filters.strongOnly && signal.finalConfidence < STRONG_SIGNAL_THRESHOLD) return false;
      return true;
    });
  }, [signals, filters]);

  const summaryStats: LiveSummaryStats = useMemo(() => {
    if (!signals.length) {
      return {
        total: 0,
        buy: 0,
        sell: 0,
        wait: 0,
        avgConfidence: 0,
        strongCount: 0
      };
    }

    const buy = signals.filter((s) => s.side === 'BUY').length;
    const sell = signals.filter((s) => s.side === 'SELL').length;
    const wait = signals.filter((s) => s.side === 'WAIT').length;
    const strongCount = signals.filter((s) => s.finalConfidence >= STRONG_SIGNAL_THRESHOLD).length;
    const avgConfidence =
      signals.reduce((sum, s) => sum + s.finalConfidence, 0) / signals.length;

    return {
      total: signals.length,
      buy,
      sell,
      wait,
      avgConfidence,
      strongCount
    };
  }, [signals]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-primary h-6 w-6" />
            <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
              {t('live.badge')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mt-2">{t('live.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('live.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isRealtimeConnected ? 'default' : 'secondary'}>
            {isRealtimeConnected ? t('live.connected') : t('live.connecting')}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            title={t('live.reset_filters')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SignalSummaryCards
        stats={summaryStats}
        isRealtimeConnected={isRealtimeConnected}
        lastUpdated={lastUpdated}
      />

      <SignalFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        availableSymbols={availableSymbols}
        availableTimeframes={availableTimeframes}
      />

      <SignalTable
        signals={filteredSignals}
        isLoading={isLoading}
        onSelectSignal={setSelectedSignal}
      />

      <SignalDetailsDrawer
        signal={selectedSignal}
        open={!!selectedSignal}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSignal(null);
          }
        }}
      />
    </div>
  );
};

export default UltraSignalsLive;

