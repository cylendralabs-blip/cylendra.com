/**
 * Indicator Filters Component
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { IndicatorAnalyticsFilters } from '@/hooks/useAdvancedIndicatorAnalytics';

interface IndicatorFiltersProps {
  filters: IndicatorAnalyticsFilters;
  onFiltersChange: (filters: IndicatorAnalyticsFilters) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'AVAXUSDT'
];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const PERIODS = [
  { value: '24h', label: 'آخر 24 ساعة' },
  { value: '7d', label: 'آخر 7 أيام' },
  { value: '30d', label: 'آخر 30 يوم' },
  { value: '90d', label: 'آخر 90 يوم' }
] as const;

export function IndicatorFilters({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading
}: IndicatorFiltersProps) {
  const handleFilterChange = (key: keyof IndicatorAnalyticsFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Symbol Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              الرمز
            </label>
            <Select
              value={filters.symbol || 'all'}
              onValueChange={(value) => handleFilterChange('symbol', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="جميع الأزواج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأزواج</SelectItem>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              الإطار الزمني
            </label>
            <Select
              value={filters.timeframe || 'all'}
              onValueChange={(value) => handleFilterChange('timeframe', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="جميع الأطر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأطر</SelectItem>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              الفترة
            </label>
            <Select
              value={filters.period || '7d'}
              onValueChange={(value) => handleFilterChange('period', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

