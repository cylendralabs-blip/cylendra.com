
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import { formatNumber } from '@/utils/tradingFormat';
import { cn } from '@/lib/utils';

interface RiskMetric {
  name: string;
  value: number;
  target: number;
  status: 'safe' | 'warning' | 'danger';
  description: string;
}

interface RiskMetricsGridProps {
  metrics: RiskMetric[];
}

const RiskMetricsGrid = ({ metrics }: RiskMetricsGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'danger': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className={cn('border-l-4', getStatusColor(metric.status))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                {getStatusIcon(metric.status)}
                <span className="font-medium text-sm">{metric.name}</span>
              </div>
              <Badge className={getStatusColor(metric.status)}>
                {metric.status === 'safe' ? 'آمن' : 
                 metric.status === 'warning' ? 'تحذير' : 'خطر'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">
                  {formatNumber(metric.value)}{metric.name.includes('نسبة') || metric.name.includes('مستوى') ? '%' : ''}
                </span>
                <span className="text-sm text-gray-500">
                  الهدف: {formatNumber(metric.target)}{metric.name.includes('نسبة') || metric.name.includes('مستوى') ? '%' : ''}
                </span>
              </div>
              
              <Progress 
                value={Math.min((metric.value / metric.target) * 100, 100)} 
                className="h-2"
              />
              
              <p className="text-xs text-gray-600">{metric.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RiskMetricsGrid;
