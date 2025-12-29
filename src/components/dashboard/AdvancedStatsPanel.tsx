
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Target,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description?: string;
  trend?: number[];
}

const StatCard = ({ title, value, change, changeType, icon: Icon, description, trend }: StatCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Icon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          {change !== undefined && (
            <Badge className={cn('text-xs', getChangeColor())}>
              {changeType === 'positive' ? '+' : ''}{formatNumber(change)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? formatNumber(value) : value}
          </div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>

        {/* Mini trend chart */}
        {trend && trend.length > 0 && (
          <div className="mt-4 h-8 flex items-end space-x-1">
            {trend.slice(-10).map((point, index) => (
              <div
                key={index}
                className="bg-blue-200 flex-1 rounded-sm opacity-70"
                style={{ height: `${Math.max((point / Math.max(...trend)) * 100, 10)}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdvancedStatsPanel = () => {
  const { realStats, isLoading } = useRealTimeData();
  const { data: performance } = useTradingPerformance();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  const stats = [
    {
      title: 'إجمالي الأرباح',
      value: `$${formatNumber(realStats?.totalProfit || 0)}`,
      change: realStats?.profitPercentage || 0,
      changeType: ((realStats?.profitPercentage || 0) >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      icon: DollarSign,
      description: 'صافي الأرباح المحققة',
      trend: [45, 52, 48, 61, 55, 67, 69, 73, 78, 82]
    },
    {
      title: 'معدل النجاح',
      value: `${formatNumber(performance?.win_rate || 0)}%`,
      change: 2.5,
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
      icon: Target,
      description: 'نسبة الصفقات الرابحة',
      trend: [65, 67, 69, 71, 68, 72, 74, 76, 75, 77]
    },
    {
      title: 'الصفقات النشطة',
      value: realStats?.activeTradesCount || 0,
      change: -1.2,
      changeType: 'negative' as 'positive' | 'negative' | 'neutral',
      icon: Activity,
      description: 'عدد الصفقات المفتوحة حالياً',
      trend: [8, 9, 7, 8, 6, 7, 5, 6, 4, 5]
    },
    {
      title: 'مستوى المخاطر',
      value: `${formatNumber(realStats?.currentRiskPercentage || 2)}%`,
      change: 0,
      changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
      icon: AlertTriangle,
      description: 'نسبة المخاطر الحالية',
      trend: [2, 2.1, 1.9, 2.2, 2, 1.8, 2.1, 2, 1.9, 2]
    },
    {
      title: 'عامل الربح',
      value: formatNumber(performance?.profit_factor || 0),
      change: 0.15,
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
      icon: TrendingUp,
      description: 'نسبة الأرباح إلى الخسائر',
      trend: [1.2, 1.3, 1.25, 1.4, 1.35, 1.45, 1.5, 1.48, 1.52, 1.55]
    },
    {
      title: 'متوسط مدة الصفقة',
      value: '4.2h',
      change: -0.3,
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
      icon: Clock,
      description: 'متوسط وقت بقاء الصفقات',
      trend: [5.1, 4.8, 4.5, 4.3, 4.6, 4.2, 4.0, 4.1, 4.3, 4.2]
    },
    {
      title: 'أقصى انخفاض',
      value: `${formatNumber(performance?.max_drawdown || 0)}%`,
      change: 0.5,
      changeType: 'negative' as 'positive' | 'negative' | 'neutral',
      icon: TrendingDown,
      description: 'أكبر خسارة من أعلى نقطة',
      trend: [2.1, 2.3, 2.0, 2.5, 2.2, 2.8, 2.6, 2.4, 2.7, 2.5]
    },
    {
      title: 'حجم التداول اليومي',
      value: `$${formatNumber(125430)}`,
      change: 8.2,
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
      icon: BarChart3,
      description: 'إجمالي حجم التداول لليوم',
      trend: [98000, 102000, 115000, 118000, 122000, 125000, 128000, 124000, 126000, 125430]
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">الإحصائيات المتقدمة</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            الإحصائيات المتقدمة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مؤشرات الأداء والتحليلات التفصيلية
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 space-x-reverse">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-1 space-x-reverse"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            <span className="text-xs">تحديث</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <PieChart className="w-5 h-5" />
            <span>ملخص الأداء</span>
          </CardTitle>
          <CardDescription>
            تحليل شامل لأداء التداول في الفترة المحددة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Level */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">مستوى المخاطر</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>منخفض</span>
                  <span>عالي</span>
                </div>
                <Progress value={((realStats?.currentRiskPercentage || 2) / 10) * 100} className="h-2" />
                <p className="text-xs text-gray-500">
                  المستوى الحالي: {realStats?.currentRiskPercentage || 2}% من رأس المال
                </p>
              </div>
            </div>

            {/* Portfolio Health */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">صحة المحفظة</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ضعيف</span>
                  <span>ممتاز</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-gray-500">
                  التنويع والتوزيع: جيد جداً
                </p>
              </div>
            </div>

            {/* Strategy Efficiency */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">كفاءة الاستراتيجية</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ضعيف</span>
                  <span>ممتاز</span>
                </div>
                <Progress value={82} className="h-2" />
                <p className="text-xs text-gray-500">
                  معدل الربح/المخاطر: ممتاز
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedStatsPanel;
