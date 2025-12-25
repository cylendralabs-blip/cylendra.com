import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import { formatNumber } from '@/utils/tradingFormat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const PortfolioChart = () => {
  const { t, i18n } = useTranslation('dashboard');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('7d');
  const { trades = [] } = useTradingHistory('all', 'all');

  // Subscribe to real-time portfolio updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('portfolio-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['trading-history'] });
          queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users_portfolio_state',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const chartData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.realized_pnl);

    // Group trades by date
    const groupedByDate = closedTrades.reduce((acc, trade) => {
      const date = new Date(trade.closed_at || trade.created_at || '').toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
      if (!acc[date]) {
        acc[date] = { date, profit: 0, loss: 0, net: 0, trades: 0 };
      }
      const pnl = trade.realized_pnl || 0;
      acc[date].trades += 1;
      if (pnl > 0) {
        acc[date].profit += pnl;
      } else {
        acc[date].loss += Math.abs(pnl);
      }
      acc[date].net += pnl;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate cumulative
    let cumulative = 0;
    return Object.values(groupedByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => {
        cumulative += item.net;
        return {
          ...item,
          cumulative: cumulative,
        };
      })
      .slice(-parseInt(timeRange));
  }, [trades, timeRange]);

  const totalProfit = chartData.reduce((sum, item: any) => sum + item.profit, 0);
  const totalLoss = chartData.reduce((sum, item: any) => sum + item.loss, 0);
  const netProfit = totalProfit - totalLoss;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>{t('portfolio_chart.title')}</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 {t('portfolio_chart.days')}</SelectItem>
              <SelectItem value="30">30 {t('portfolio_chart.day')}</SelectItem>
              <SelectItem value="90">90 {t('portfolio_chart.day')}</SelectItem>
              <SelectItem value="365">{t('portfolio_chart.year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          {t('portfolio_chart.net_profit')}: <span className={netProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
            ${formatNumber(netProfit)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('portfolio_chart.no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${formatNumber(value)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`$${formatNumber(value)}`, t('portfolio_chart.cumulative_profit')]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
