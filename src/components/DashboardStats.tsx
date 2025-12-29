
import { Card, CardContent } from '@/components/ui/card';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import StrategyInfoCard from './dashboard/StrategyInfoCard';
import PerformanceStatsGrid from './dashboard/PerformanceStatsGrid';

const DashboardStats = () => {
  const { realStats, botSettings, isLoading } = useRealTimeData();

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Strategy Card Skeleton */}
        <Card className="animate-pulse">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="h-20 sm:h-24 lg:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-2 sm:p-3 lg:p-4">
                <div className="h-12 sm:h-16 lg:h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Strategy Info Card */}
      <StrategyInfoCard 
        botSettings={botSettings} 
        strategyType={realStats?.strategyType || 'basic_dca'} 
      />

      {/* Performance Stats */}
      <PerformanceStatsGrid realStats={realStats} />
    </div>
  );
};

export default DashboardStats;
