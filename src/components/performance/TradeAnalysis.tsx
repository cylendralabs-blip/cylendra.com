
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatNumber, formatDate } from '@/utils/tradingFormat';
import { useHistoricalTrades } from '@/hooks/useHistoricalTrades';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface TradeAnalysisProps {
  performance: any;
  timeRange: string;
}

const TradeAnalysis = ({ performance, timeRange }: TradeAnalysisProps) => {
  const { t } = useTranslation('performance');
  const { data: trades, isLoading } = useHistoricalTrades(timeRange);

  const analysisData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        topPerformingTrades: [],
        worstPerformingTrades: [],
        tradingMetrics: []
      };
    }

    const closedTrades = trades.filter(trade => trade.status === 'CLOSED' && trade.realized_pnl !== null);

    // Top performing trades
    const topPerformingTrades = [...closedTrades]
      .filter(trade => trade.realized_pnl > 0)
      .sort((a, b) => b.realized_pnl - a.realized_pnl)
      .slice(0, 5)
      .map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        profit: trade.realized_pnl,
        percentage: ((trade.realized_pnl / trade.total_invested) * 100),
        duration: trade.closed_at && trade.opened_at ?
          t('analysis.duration.hours', { h: Math.round((new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60)) }) :
          t('analysis.duration.undefined'),
        date: trade.closed_at || trade.created_at
      }));

    // Worst performing trades
    const worstPerformingTrades = [...closedTrades]
      .filter(trade => trade.realized_pnl < 0)
      .sort((a, b) => a.realized_pnl - b.realized_pnl)
      .slice(0, 5)
      .map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        profit: trade.realized_pnl,
        percentage: ((trade.realized_pnl / trade.total_invested) * 100),
        duration: trade.closed_at && trade.opened_at ?
          t('analysis.duration.hours', { h: Math.round((new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60)) }) :
          t('analysis.duration.undefined'),
        date: trade.closed_at || trade.created_at
      }));

    // Calculate trading metrics
    const profitableTrades = closedTrades.filter(t => t.realized_pnl > 0);
    const losingTrades = closedTrades.filter(t => t.realized_pnl < 0);

    const bestDay = profitableTrades.length > 0 ? Math.max(...profitableTrades.map(t => t.realized_pnl)) : 0;
    const worstDay = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.realized_pnl)) : 0;

    const longestTrade = closedTrades.reduce((longest, trade) => {
      if (!trade.closed_at || !trade.opened_at) return longest;
      const duration = new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime();
      return duration > longest.duration ? { duration, trade } : longest;
    }, { duration: 0, trade: null });

    const tradingMetrics = [
      {
        title: t('analysis.metrics.best_trade'),
        value: `$${formatNumber(bestDay)}`,
        date: profitableTrades.find(t => t.realized_pnl === bestDay)?.symbol || t('analysis.metrics.not_available'),
        icon: TrendingUp,
        color: 'text-green-600'
      },
      {
        title: t('analysis.metrics.worst_trade'),
        value: `$${formatNumber(worstDay)}`,
        date: losingTrades.find(t => t.realized_pnl === worstDay)?.symbol || t('analysis.metrics.not_available'),
        icon: TrendingDown,
        color: 'text-red-600'
      },
      {
        title: t('analysis.metrics.longest_trade'),
        value: longestTrade.trade ? t('analysis.metrics.hours_short', { h: Math.round(longestTrade.duration / (1000 * 60 * 60)) }) : t('analysis.metrics.not_available'),
        date: longestTrade.trade?.symbol || t('analysis.metrics.not_available'),
        icon: Clock,
        color: 'text-blue-600'
      },
      {
        title: t('analysis.metrics.win_rate'),
        value: `${formatNumber(performance?.win_rate || 0)}%`,
        date: `${profitableTrades.length}/${closedTrades.length}`,
        icon: Target,
        color: 'text-purple-600'
      }
    ];

    return {
      topPerformingTrades,
      worstPerformingTrades,
      tradingMetrics
    };
  }, [trades, performance, t]);

  const getSideBadge = (side: string) => {
    return side === 'BUY' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">{t('analysis.sides.buy')}</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">{t('analysis.sides.sell')}</Badge>
    );
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t('analysis.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trading Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysisData.tradingMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className={`text-lg font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500">{metric.date}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Performing Trades */}
      {analysisData.topPerformingTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              {t('analysis.top_trades.title')}
            </CardTitle>
            <CardDescription>{t('analysis.top_trades.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analysis.table.symbol')}</TableHead>
                  <TableHead>{t('analysis.table.side')}</TableHead>
                  <TableHead>{t('analysis.table.profit')}</TableHead>
                  <TableHead>{t('analysis.table.percentage')}</TableHead>
                  <TableHead>{t('analysis.table.duration')}</TableHead>
                  <TableHead>{t('analysis.table.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.topPerformingTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>{getSideBadge(trade.side)}</TableCell>
                    <TableCell className={getProfitColor(trade.profit)}>
                      ${formatNumber(trade.profit)}
                    </TableCell>
                    <TableCell className={getProfitColor(trade.profit)}>
                      +{formatNumber(trade.percentage)}%
                    </TableCell>
                    <TableCell>{trade.duration}</TableCell>
                    <TableCell>{formatDate(trade.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Worst Performing Trades */}
      {analysisData.worstPerformingTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              {t('analysis.worst_trades.title')}
            </CardTitle>
            <CardDescription>{t('analysis.worst_trades.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analysis.table.symbol')}</TableHead>
                  <TableHead>{t('analysis.table.side')}</TableHead>
                  <TableHead>{t('analysis.table.loss')}</TableHead>
                  <TableHead>{t('analysis.table.percentage')}</TableHead>
                  <TableHead>{t('analysis.table.duration')}</TableHead>
                  <TableHead>{t('analysis.table.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.worstPerformingTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>{getSideBadge(trade.side)}</TableCell>
                    <TableCell className={getProfitColor(trade.profit)}>
                      ${formatNumber(trade.profit)}
                    </TableCell>
                    <TableCell className={getProfitColor(trade.profit)}>
                      {formatNumber(trade.percentage)}%
                    </TableCell>
                    <TableCell>{trade.duration}</TableCell>
                    <TableCell>{formatDate(trade.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analysis.summary.title')}</CardTitle>
          <CardDescription>{t('analysis.summary.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700 dark:text-green-400">{t('analysis.summary.strengths')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('analysis.summary.win_rate', { rate: formatNumber(performance?.win_rate || 0) })}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('analysis.summary.profit_factor', { factor: formatNumber(performance?.profit_factor || 0) })}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('analysis.summary.total_trades', { trades: performance?.total_trades || 0 })}
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400">{t('analysis.summary.improvements')}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {t('analysis.summary.reduce_avg_loss', { loss: formatNumber(performance?.average_loss || 0) })}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {t('analysis.summary.improve_entry')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {t('analysis.summary.increase_diversification')}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeAnalysis;
