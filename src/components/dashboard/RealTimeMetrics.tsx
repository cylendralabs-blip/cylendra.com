import { Card, CardContent } from '@/components/ui/card';
import { useActiveTrades } from '@/hooks/useActiveTrades';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import { TrendingUp, TrendingDown, Activity, DollarSign, Target, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { useMemo } from 'react';

const RealTimeMetrics = () => {
  const { data: activeTrades = [] } = useActiveTrades();
  const { trades: allTrades = [] } = useTradingHistory('all', 'all');

  const metrics = useMemo(() => {
    const closedTrades = allTrades.filter(t => t.status === 'CLOSED');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.realized_pnl || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    const unrealizedPnL = activeTrades.reduce((sum, t) => sum + (t.unrealized_pnl || 0), 0);
    const totalInvested = activeTrades.reduce((sum, t) => sum + (t.total_invested || 0), 0);

    return {
      activeTrades: activeTrades.length,
      totalPnL,
      unrealizedPnL,
      winRate,
      totalInvested,
      totalTrades: allTrades.length,
    };
  }, [activeTrades, allTrades]);

  const metricCards = [
    {
      title: 'الصفقات النشطة',
      value: metrics.activeTrades,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'إجمالي الربح/الخسارة',
      value: `$${formatNumber(metrics.totalPnL)}`,
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: metrics.totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      title: 'الربح غير المحقق',
      value: `$${formatNumber(metrics.unrealizedPnL)}`,
      icon: DollarSign,
      color: metrics.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: metrics.unrealizedPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      title: 'معدل النجاح',
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'رأس المال المستثمر',
      value: `$${formatNumber(metrics.totalInvested)}`,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'إجمالي الصفقات',
      value: metrics.totalTrades,
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RealTimeMetrics;
