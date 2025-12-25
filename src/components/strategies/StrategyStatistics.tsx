
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/utils/tradingFormat';

interface StrategyStatisticsProps {
  stats: Array<{
    name: string;
    type: string;
    totalProfit: number;
    winRate: number;
    trades: number;
    performance: string;
    color: string;
  }>;
}

const StrategyStatistics = ({ stats }: StrategyStatisticsProps) => {
  if (stats.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 shadow-sm border">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">لا توجد استراتيجيات نشطة حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      <h4 className="font-medium text-sm">إحصائيات مفصلة</h4>
      {stats.map((strategy, index) => (
        <Card key={index} className="bg-white dark:bg-gray-800 shadow-sm border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: strategy.color }}
                ></div>
                <h5 className="font-medium text-sm">{strategy.name}</h5>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {strategy.type}
                </Badge>
              </div>
              <div className={`text-sm font-bold ${strategy.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {strategy.performance}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-bold text-green-600">${formatNumber(strategy.totalProfit)}</div>
                <div className="text-xs text-muted-foreground">إجمالي الربح</div>
              </div>
              <div>
                <div className="text-sm font-bold">{strategy.winRate}%</div>
                <div className="text-xs text-muted-foreground">معدل النجاح</div>
              </div>
              <div>
                <div className="text-sm font-bold">{strategy.trades}</div>
                <div className="text-xs text-muted-foreground">عدد الصفقات</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StrategyStatistics;
