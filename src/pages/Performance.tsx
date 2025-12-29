
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import PerformanceOverview from '@/components/performance/PerformanceOverview';
import PerformanceCharts from '@/components/performance/PerformanceCharts';
import TradeAnalysis from '@/components/performance/TradeAnalysis';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { formatNumber } from '@/utils/tradingFormat';
import { useTranslation } from 'react-i18next';

const Performance = () => {
  const { t } = useTranslation('performance');
  const [timeRange, setTimeRange] = useState('7d');
  const { data: performance, isLoading, refetch } = useTradingPerformance();
  const { data: activeTrades } = useActiveTrades();

  const handleRefresh = () => {
    refetch();
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const timeRanges = [
    { value: '1d', label: t('time_ranges.1d') },
    { value: '7d', label: t('time_ranges.7d') },
    { value: '30d', label: t('time_ranges.30d') },
    { value: '90d', label: t('time_ranges.90d') },
    { value: '1y', label: t('time_ranges.1y') }
  ];

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4 mt-0 lg:mt-4">
        <div className="mb-2 lg:mb-0">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] h-7 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh} size="sm" className="h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            {t('refresh')}
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Download className="w-3 h-3 mr-1" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 lg:mb-4">
        <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium">{t('stats.total_profit')}</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className={`text-sm font-bold ${getPerformanceColor(performance?.total_profit || 0)}`}>
              ${formatNumber(performance?.total_profit || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {performance?.roi_percentage ? t('stats.roi', { roi: formatNumber(performance.roi_percentage) }) : t('stats.no_data')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium">{t('stats.win_rate')}</CardTitle>
            <Target className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-sm font-bold">
              {formatNumber(performance?.win_rate || 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.winning_trades', { winning: performance?.winning_trades || 0, total: performance?.total_trades || 0 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium">{t('stats.profit_factor')}</CardTitle>
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-sm font-bold">
              {formatNumber(performance?.profit_factor || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.profit_factor_desc')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-2">
            <CardTitle className="text-xs font-medium">{t('stats.max_drawdown')}</CardTitle>
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-sm font-bold text-red-600">
              {formatNumber(performance?.max_drawdown || 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('stats.max_drawdown_desc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-2">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border h-8">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs h-6">
            <PieChart className="w-3 h-3" />
            <span className="hidden sm:inline">{t('tabs.overview.full')}</span>
            <span className="sm:hidden">{t('tabs.overview.short')}</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-1 text-xs h-6">
            <BarChart3 className="w-3 h-3" />
            <span className="hidden sm:inline">{t('tabs.charts.full')}</span>
            <span className="sm:hidden">{t('tabs.charts.short')}</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1 text-xs h-6">
            <Target className="w-3 h-3" />
            <span className="hidden sm:inline">{t('tabs.analysis.full')}</span>
            <span className="sm:hidden">{t('tabs.analysis.short')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-2">
          <PerformanceOverview
            performance={performance}
            activeTrades={activeTrades}
            timeRange={timeRange}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="charts" className="mt-2">
          <PerformanceCharts
            timeRange={timeRange}
            performance={performance}
          />
        </TabsContent>

        <TabsContent value="analysis" className="mt-2">
          <TradeAnalysis
            performance={performance}
            timeRange={timeRange}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Performance;
