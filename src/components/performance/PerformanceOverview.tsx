
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { useTranslation } from 'react-i18next';

interface PerformanceOverviewProps {
  performance: any;
  activeTrades: any[];
  timeRange: string;
  isLoading: boolean;
}

const PerformanceOverview = ({ performance, activeTrades, timeRange, isLoading }: PerformanceOverviewProps) => {
  const { t } = useTranslation('performance');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const winRate = performance?.win_rate || 0;
  const profitFactor = performance?.profit_factor || 0;
  const totalTrades = performance?.total_trades || 0;
  const winningTrades = performance?.winning_trades || 0;
  const losingTrades = performance?.losing_trades || 0;

  const getRiskLevel = () => {
    const drawdown = Math.abs(performance?.max_drawdown || 0);
    if (drawdown < 5) return { level: t('overview.risk_analysis.levels.low'), color: 'bg-green-500', textColor: 'text-green-700' };
    if (drawdown < 15) return { level: t('overview.risk_analysis.levels.medium'), color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: t('overview.risk_analysis.levels.high'), color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const riskLevel = getRiskLevel();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trading Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('overview.trading_summary.title')}
          </CardTitle>
          <CardDescription>{t('overview.trading_summary.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.trading_summary.total_trades')}</span>
            <span className="font-semibold">{totalTrades}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.trading_summary.winning_trades')}</span>
            <span className="font-semibold text-green-600">{winningTrades}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.trading_summary.losing_trades')}</span>
            <span className="font-semibold text-red-600">{losingTrades}</span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('overview.trading_summary.win_rate')}</span>
              <span className="font-semibold">{formatNumber(winRate)}%</span>
            </div>
            <Progress value={winRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Financial Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('overview.financial_performance.title')}
          </CardTitle>
          <CardDescription>{t('overview.financial_performance.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.financial_performance.total_profit')}</span>
            <span className="font-semibold text-green-600">
              ${formatNumber(performance?.total_profit || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.financial_performance.total_loss')}</span>
            <span className="font-semibold text-red-600">
              ${formatNumber(performance?.total_loss || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.financial_performance.net_profit')}</span>
            <span className={`font-semibold ${(performance?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${formatNumber(performance?.net_profit || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.financial_performance.roi')}</span>
            <Badge variant={`${(performance?.roi_percentage || 0) >= 0 ? 'default' : 'destructive'}`}>
              {formatNumber(performance?.roi_percentage || 0)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t('overview.risk_analysis.title')}
          </CardTitle>
          <CardDescription>{t('overview.risk_analysis.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.risk_analysis.risk_level')}</span>
            <Badge className={`${riskLevel.textColor} bg-${riskLevel.color}/10`}>
              {riskLevel.level}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.risk_analysis.max_drawdown')}</span>
            <span className="font-semibold text-red-600">
              {formatNumber(performance?.max_drawdown || 0)}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.risk_analysis.profit_factor')}</span>
            <span className={`font-semibold ${profitFactor >= 1.5 ? 'text-green-600' : profitFactor >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
              {formatNumber(profitFactor)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.risk_analysis.average_win')}</span>
            <span className="font-semibold text-green-600">
              ${formatNumber(performance?.average_win || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Active Trades Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('overview.active_trades.title')}
          </CardTitle>
          <CardDescription>{t('overview.active_trades.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('overview.active_trades.active_count')}</span>
            <span className="font-semibold">{activeTrades?.length || 0}</span>
          </div>

          {activeTrades && activeTrades.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('overview.active_trades.total_invested')}</span>
                <span className="font-semibold">
                  ${formatNumber(activeTrades.reduce((sum, trade) => sum + (trade.total_invested || 0), 0))}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('overview.active_trades.unrealized_pnl')}</span>
                <span className={`font-semibold ${activeTrades.reduce((sum, trade) => sum + (trade.unrealized_pnl || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${formatNumber(activeTrades.reduce((sum, trade) => sum + (trade.unrealized_pnl || 0), 0))}
                </span>
              </div>
            </>
          )}

          {(!activeTrades || activeTrades.length === 0) && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">{t('overview.active_trades.no_trades')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;
