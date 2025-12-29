/**
 * Indicator Analytics Tab Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 * 
 * Main component that combines all indicator analytics components
 */

import { useState } from 'react';
import { useAdvancedIndicatorAnalytics, IndicatorAnalyticsFilters, SignalAnalyticsRow } from '@/hooks/useAdvancedIndicatorAnalytics';
import { IndicatorFilters } from './IndicatorFilters';
import { IndicatorSummaryCards } from './IndicatorSummaryCards';
import { IndicatorSignalsTable } from './IndicatorSignalsTable';
import { IndicatorDetailsDrawer } from './IndicatorDetailsDrawer';
import { IndicatorChart } from './IndicatorChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function IndicatorAnalyticsTab() {
  const [filters, setFilters] = useState<IndicatorAnalyticsFilters>({
    period: '7d',
    limit: 50
  });

  const [selectedSignal, setSelectedSignal] = useState<SignalAnalyticsRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error, refetch } = useAdvancedIndicatorAnalytics(filters);

  const handleSignalClick = (signal: SignalAnalyticsRow) => {
    setSelectedSignal(signal);
    setDrawerOpen(true);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          حدث خطأ في تحميل البيانات: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <IndicatorFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={() => refetch()}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <IndicatorSummaryCards summary={data.summary} />

          {/* Chart */}
          <IndicatorChart summary={data.summary} />

          {/* Signals Table */}
          <IndicatorSignalsTable
            signals={data.signals}
            onSignalClick={handleSignalClick}
          />

          {/* Details Drawer */}
          <IndicatorDetailsDrawer
            signal={selectedSignal}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        </>
      ) : null}
    </div>
  );
}

