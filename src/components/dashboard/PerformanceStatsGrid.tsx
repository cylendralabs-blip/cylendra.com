
import { DollarSign, Activity, Target, Percent } from 'lucide-react';
import StatCard from './StatCard';

interface RealTimeStats {
  totalProfit: number;
  profitPercentage: number;
  activeTradesCount: number;
  winRate: number;
  currentRiskPercentage: number;
  strategyType: string;
}

interface PerformanceStatsGridProps {
  realStats: RealTimeStats | null;
}

const PerformanceStatsGrid = ({ realStats }: PerformanceStatsGridProps) => {
  const stats = [
    {
      title: 'إجمالي الأرباح',
      value: `$${realStats?.totalProfit?.toFixed(2) || '0.00'}`,
      change: realStats?.profitPercentage ? `${realStats.profitPercentage > 0 ? '+' : ''}${realStats.profitPercentage.toFixed(2)}%` : '0.00%',
      changeType: (realStats?.profitPercentage || 0) >= 0 ? 'positive' as const : 'negative' as const,
      icon: DollarSign,
      description: 'إجمالي الربح المحقق'
    },
    {
      title: 'الصفقات النشطة',
      value: realStats?.activeTradesCount?.toString() || '0',
      change: '0',
      changeType: 'neutral' as const,
      icon: Activity,
      description: 'عدد الصفقات الجارية'
    },
    {
      title: 'معدل النجاح',
      value: `${realStats?.winRate?.toFixed(1) || '0.0'}%`,
      change: '0.0%',
      changeType: 'neutral' as const,
      icon: Target,
      description: 'نسبة الصفقات الرابحة'
    },
    {
      title: 'المخاطرة المحددة',
      value: `${realStats?.currentRiskPercentage?.toFixed(1) || '0.0'}%`,
      change: '0.0%',
      changeType: 'neutral' as const,
      icon: Percent,
      description: 'نسبة المخاطرة المحددة'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </div>
  );
};

export default PerformanceStatsGrid;
