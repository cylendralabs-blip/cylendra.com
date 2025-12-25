/**
 * Ultra Signals History Page
 * 
 * Displays historical Ultra Signals with statistics and filters
 * 
 * Phase X.4: UI - History Dashboard
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUltraSignalsHistory, type HistoryFilters } from '@/hooks/useUltraSignalsHistory';
import { SignalSummaryCards } from '@/components/ultra-signals/SignalSummaryCards';
import { SignalFilters, type SignalFiltersState } from '@/components/ultra-signals/SignalFilters';
import { SignalTable } from '@/components/ultra-signals/SignalTable';
import { SignalDetailsDrawer } from '@/components/ultra-signals/SignalDetailsDrawer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, History, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UltraSignal } from '@/ai-signals';
import { useTranslation } from 'react-i18next';

const DEFAULT_FILTERS: SignalFiltersState = {
  symbol: 'ALL',
  timeframe: 'ALL',
  side: 'ALL',
  minConfidence: 0,
  strongOnly: false
};

const UltraSignalsHistory = () => {
  const { t } = useTranslation('ultra_signals');
  const isMobile = useIsMobile();
  const [selectedSignal, setSelectedSignal] = useState<UltraSignal | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [uiFilters, setUiFilters] = useState<SignalFiltersState>(DEFAULT_FILTERS);
  const [dbFilters, setDbFilters] = useState<HistoryFilters>({
    limit: 50,
    offset: 0,
  });
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Convert UI filters to DB filters
  const effectiveFilters: HistoryFilters = useMemo(() => ({
    ...dbFilters,
    symbol: uiFilters.symbol !== 'ALL' ? uiFilters.symbol : undefined,
    timeframe: uiFilters.timeframe !== 'ALL' ? uiFilters.timeframe : undefined,
    side: uiFilters.side !== 'ALL' ? uiFilters.side : undefined,
    minConfidence: uiFilters.minConfidence > 0 ? uiFilters.minConfidence : undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
  }), [uiFilters, dbFilters, dateRange]);

  const { signals, stats, isLoading, error, refetch } = useUltraSignalsHistory(effectiveFilters);

  const availableSymbols = useMemo(() => {
    const entries = Array.from(new Set(signals.map((s) => s.symbol)));
    return entries.sort();
  }, [signals]);

  const availableTimeframes = useMemo(() => {
    const entries = Array.from(new Set(signals.map((s) => s.timeframe)));
    return entries.sort();
  }, [signals]);

  const handleFilterChange = (newFilters: SignalFiltersState) => {
    setUiFilters(newFilters);
    setDbFilters((prev) => ({ ...prev, offset: 0 }));
  };

  const handleDateRangeChange = (start?: string, end?: string) => {
    setDateRange({ start, end });
    setDbFilters((prev) => ({ ...prev, offset: 0 }));
  };

  const handleResetFilters = () => {
    setUiFilters(DEFAULT_FILTERS);
    setDateRange({});
    setDbFilters({ limit: 50, offset: 0 });
  };

  const handleLoadMore = () => {
    setDbFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }));
  };

  const handleSignalClick = (signal: UltraSignal) => {
    setSelectedSignal(signal);
    setIsDrawerOpen(true);
  };

  // Check if there are more signals to load
  // If we got exactly the limit, there might be more
  const hasMore = signals.length === (dbFilters.limit || 50);

  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1
          className={`font-bold mb-3 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-foreground ${isMobile ? 'text-2xl' : 'text-4xl'
            }`}
        >
          <div className="flex items-center gap-2">
            <History className={`text-blue-600 ${isMobile ? 'w-6 h-6' : 'w-10 h-10'}`} />
            <span>{t('history.title')}</span>
          </div>
          <span
            className={`bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-lg ${isMobile ? 'text-sm self-start' : 'text-lg'
              }`}
          >
            {t('history.badge')}
          </span>
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
          {t('history.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SignalSummaryCards
          totalSignals={stats.totalSignals}
          buySignals={stats.buySignals}
          sellSignals={stats.sellSignals}
          averageConfidence={stats.averageConfidence}
          averageRR={stats.averageRR}
          isLive={false}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('common.filters.title')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SignalFilters
            filters={uiFilters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            availableSymbols={availableSymbols}
            availableTimeframes={availableTimeframes}
            showDateRange={true}
            onDateRangeChange={handleDateRangeChange}
            dateRange={dateRange}
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('history.error_loading')}
          </AlertDescription>
        </Alert>
      )}

      {/* Signals Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
          <CardDescription>
            {stats.totalSignals > 0
              ? t('history.total_signals_desc', { count: stats.totalSignals })
              : t('history.no_signals_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && signals.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('history.loading_signals')}</span>
            </div>
          ) : signals.length === 0 ? (
            <Alert>
              <AlertDescription>
                {t('history.no_results')}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <SignalTable
                signals={signals}
                isLoading={isLoading}
                onSelectSignal={handleSignalClick}
              />

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t('history.loading_more')}
                      </>
                    ) : (
                      t('history.load_more')
                    )}
                  </Button>
                </div>
              )}

              {/* Results Count */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('history.showing_results', { current: signals.length, total: stats.totalSignals })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Signal Details Drawer */}
      <SignalDetailsDrawer
        signal={selectedSignal}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
};

export default UltraSignalsHistory;

