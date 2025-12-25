
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StrategyStatusList from './StrategyStatusList';
import { useTranslation } from 'react-i18next';

interface PerformancePanelProps {
  usedCapital: number;
  totalCapital: number;
  activeTrades: any[];
  performance: any;
}

const PerformancePanel = ({ usedCapital, totalCapital, activeTrades, performance }: PerformancePanelProps) => {
  const { t } = useTranslation('dashboard');
  const strategyStatus = [
    { name: t('performance.strategies.dca_advanced'), status: t('performance.status.active'), color: 'bg-trading-success' },
    { name: t('performance.strategies.risk_management'), status: t('performance.status.active'), color: 'bg-trading-success' },
    { name: t('performance.strategies.smart_tp'), status: t('performance.status.disabled'), color: 'bg-trading-warning' },
    { name: t('performance.strategies.market_analysis'), status: t('performance.status.active'), color: 'bg-trading-info' }
  ];

  return (
    <Card className="p-3 sm:p-4 lg:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
        {t('performance.title')}
      </h3>

      {/* Capital Usage */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
            {t('performance.capital_usage')}
          </span>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            ${usedCapital.toLocaleString()} / ${totalCapital.toLocaleString()}
          </span>
        </div>
        <Progress
          value={(usedCapital / totalCapital) * 100}
          className="h-1.5 sm:h-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('performance.percent_used', { value: ((usedCapital / totalCapital) * 100).toFixed(1) })}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
          <p className="text-lg sm:text-2xl font-bold text-accent">{activeTrades?.length || 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('performance.active_trades')}</p>
        </div>
        <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
          <p className="text-lg sm:text-2xl font-bold text-trading-success">
            {performance?.win_rate?.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('performance.win_rate')}</p>
        </div>
      </div>

      {/* Strategy Status */}
      <StrategyStatusList strategies={strategyStatus} />
    </Card>
  );
};

export default PerformancePanel;
