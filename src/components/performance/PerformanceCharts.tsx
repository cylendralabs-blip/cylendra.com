
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { formatNumber } from '@/utils/tradingFormat';
import { useHistoricalTrades } from '@/hooks/useHistoricalTrades';
import { useMemo } from 'react';
import CustomTooltip from './charts/CustomTooltip';
import { useTranslation } from 'react-i18next';

interface PerformanceChartsProps {
  timeRange: string;
  performance: any;
}

const PerformanceCharts = ({ timeRange, performance }: PerformanceChartsProps) => {
  const { t, i18n } = useTranslation('performance');
  const { data: trades, isLoading } = useHistoricalTrades(timeRange);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        profitLossData: [],
        portfolioGrowthData: [],
        tradeDistributionData: [],
        monthlyPerformanceData: []
      };
    }

    // Generate profit/loss chart data
    const profitLossData = trades
      .filter(trade => trade.status === 'CLOSED')
      .reduce((acc, trade) => {
        const date = new Date(trade.closed_at || trade.created_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);

        if (existing) {
          if (trade.realized_pnl > 0) {
            existing.profit += trade.realized_pnl;
          } else {
            existing.loss += Math.abs(trade.realized_pnl);
          }
          existing.net = existing.profit - existing.loss;
        } else {
          acc.push({
            date,
            profit: trade.realized_pnl > 0 ? trade.realized_pnl : 0,
            loss: trade.realized_pnl < 0 ? Math.abs(trade.realized_pnl) : 0,
            net: trade.realized_pnl
          });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate portfolio growth data
    let cumulativeValue = 10000; // Starting capital
    const portfolioGrowthData = profitLossData.map(item => {
      cumulativeValue += item.net;
      return {
        date: item.date,
        value: cumulativeValue
      };
    });

    // Generate trade distribution data
    const winningTrades = trades.filter(t => t.realized_pnl > 0).length;
    const losingTrades = trades.filter(t => t.realized_pnl < 0).length;
    const tradeDistributionData = [
      { name: t('charts.trade_distribution.winning'), value: winningTrades, color: '#10b981' },
      { name: t('charts.trade_distribution.losing'), value: losingTrades, color: '#ef4444' },
    ];

    // Generate monthly performance data
    const monthlyData = trades
      .filter(trade => trade.status === 'CLOSED')
      .reduce((acc, trade) => {
        const monthLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
        const month = new Date(trade.closed_at || trade.created_at).toLocaleDateString(monthLocale, { month: 'long' });
        const existing = acc.find(item => item.month === month);

        if (existing) {
          existing.profit += trade.realized_pnl;
          existing.trades += 1;
        } else {
          acc.push({
            month,
            profit: trade.realized_pnl,
            trades: 1
          });
        }
        return acc;
      }, []);

    return {
      profitLossData,
      portfolioGrowthData,
      tradeDistributionData,
      monthlyPerformanceData: monthlyData
    };
  }, [trades, t, i18n.language]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const xAxisTickFormatter = (value: string) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Growth Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('charts.portfolio_growth.title')}</CardTitle>
          <CardDescription>{t('charts.portfolio_growth.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.portfolioGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={xAxisTickFormatter}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <CustomTooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit/Loss Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.daily_pl.title')}</CardTitle>
          <CardDescription>{t('charts.daily_pl.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.profitLossData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={xAxisTickFormatter}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <CustomTooltip />
              <Bar dataKey="profit" fill="#10b981" name={t('charts.daily_pl.profit')} />
              <Bar dataKey="loss" fill="#ef4444" name={t('charts.daily_pl.loss')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trade Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.trade_distribution.title')}</CardTitle>
          <CardDescription>{t('charts.trade_distribution.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.tradeDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.tradeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <CustomTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('charts.trade_distribution.win_rate', { rate: formatNumber(performance?.win_rate || 0) })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Performance Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('charts.monthly_performance.title')}</CardTitle>
          <CardDescription>{t('charts.monthly_performance.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="profit" orientation="left" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <YAxis yAxisId="trades" orientation="right" />
              <CustomTooltip />
              <Legend />
              <Line
                yAxisId="profit"
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={3}
                name={t('charts.monthly_performance.profit')}
              />
              <Line
                yAxisId="trades"
                type="monotone"
                dataKey="trades"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name={t('charts.monthly_performance.trades')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceCharts;
