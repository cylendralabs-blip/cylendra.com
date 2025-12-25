
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { useStrategyPerformanceData } from '@/hooks/useStrategyPerformanceData';
import PerformanceChart from './PerformanceChart';
import StrategyStatistics from './StrategyStatistics';
import PerformanceLoading from './PerformanceLoading';

const StrategyPerformance = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { performanceData, strategyStats, isLoading } = useStrategyPerformanceData(timeRange);

  if (isLoading) {
    return <PerformanceLoading />;
  }

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">أداء الاستراتيجيات</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px] h-7 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">أسبوع</SelectItem>
            <SelectItem value="30d">شهر</SelectItem>
            <SelectItem value="90d">3 أشهر</SelectItem>
            <SelectItem value="1y">سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Chart */}
      <PerformanceChart data={performanceData} />

      {/* Strategy Statistics */}
      <StrategyStatistics stats={strategyStats} />
    </div>
  );
};

export default StrategyPerformance;
