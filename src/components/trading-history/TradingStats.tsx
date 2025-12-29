
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Trade } from '@/types/trade';
import { useIsMobile } from '@/hooks/use-mobile';

interface TradingStatsProps {
  trades: Trade[];
  selectedPlatform: string;
}

const TradingStats = ({ trades, selectedPlatform }: TradingStatsProps) => {
  const isMobile = useIsMobile();

  // حساب الإحصائيات
  const activeTrades = trades.filter(trade => trade.status === 'ACTIVE').length;
  const closedTrades = trades.filter(trade => trade.status === 'CLOSED').length;
  const totalInvested = trades.reduce((sum, trade) => sum + trade.total_invested, 0);
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.realized_pnl || 0) + (trade.unrealized_pnl || 0), 0);
  const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0) + (trade.commission || 0), 0);
  
  const winningTrades = trades.filter(trade => 
    (trade.realized_pnl || 0) + (trade.unrealized_pnl || 0) > 0
  ).length;
  
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  // إحصائيات المنصات
  const platformStats = trades.reduce((acc, trade) => {
    const platform = trade.platform || 'غير محدد';
    if (!acc[platform]) {
      acc[platform] = { count: 0, invested: 0, pnl: 0 };
    }
    acc[platform].count++;
    acc[platform].invested += trade.total_invested;
    acc[platform].pnl += (trade.realized_pnl || 0) + (trade.unrealized_pnl || 0);
    return acc;
  }, {} as Record<string, { count: number; invested: number; pnl: number }>);

  const statsCards = [
    {
      title: 'الصفقات النشطة',
      value: activeTrades,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'إجمالي الاستثمار',
      value: `$${totalInvested.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'الربح/الخسارة',
      value: `$${totalPnL.toFixed(2)}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'معدل الفوز',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* الإحصائيات الرئيسية */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        {statsCards.map((stat, index) => (
          <Card key={index} className={`${stat.bgColor} border-0`}>
            <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isMobile ? 'mb-1' : 'mb-2'} font-medium text-gray-600`}>
                    {stat.title}
                  </p>
                  <p className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'} ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إحصائيات إضافية */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {/* معلومات عامة */}
        <Card>
          <CardHeader className={isMobile ? 'p-3' : 'p-4'}>
            <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>معلومات عامة</CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-0' : 'p-4 pt-0'} space-y-2`}>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">إجمالي الصفقات:</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{trades.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">صفقات مغلقة:</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{closedTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">إجمالي الرسوم:</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">${totalFees.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات المنصات */}
        {selectedPlatform === 'all' && Object.keys(platformStats).length > 0 && (
          <Card className={isMobile ? 'col-span-1' : 'col-span-2'}>
            <CardHeader className={isMobile ? 'p-3' : 'p-4'}>
              <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>توزيع المنصات</CardTitle>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-3 pt-0' : 'p-4 pt-0'}`}>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {Object.entries(platformStats).map(([platform, stats]) => (
                  <div key={platform} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{platform}</span>
                      <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                        {stats.count} صفقة
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">الاستثمار:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">${stats.invested.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">الربح/الخسارة:</span>
                        <span className={`font-medium ${stats.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          ${stats.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradingStats;
