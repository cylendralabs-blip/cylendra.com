import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Target, AlertCircle } from 'lucide-react';
import PlatformDistribution from '@/components/portfolio/PlatformDistribution';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioSnapshot, usePortfolioHistory } from '@/hooks/usePortfolio';
import { useTranslation } from 'react-i18next';

const Portfolio = () => {
  const { t } = useTranslation('portfolio');
  const { user } = useAuth();

  // جلب الرصيد الإجمالي من portfolio_balances
  const { data: totalBalanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['portfolio-total-balance', user?.id],
    queryFn: async () => {
      if (!user) return { totalUSDT: 0, balances: [] };

      const { data, error } = await supabase
        .from('portfolio_balances')
        .select('symbol, total_balance')
        .eq('user_id', user.id);

      if (error) throw error;

      const balancesData = (data as any[]) || [];

      // حساب إجمالي USDT من جميع المنصات (جمع جميع أرصدة USDT فقط)
      // ملاحظة: لا نحسب باقي العملات (BTC, ETH, etc.) بدون أسعار حقيقية
      const usdtBalances = balancesData.filter((b: any) => b.symbol === 'USDT');
      const usdtBalance = usdtBalances.reduce((sum: number, b: any) => {
        const balance = parseFloat(b.total_balance) || 0;
        return sum + balance;
      }, 0);

      return {
        totalUSDT: usdtBalance,
        balances: balancesData
      };
    },
    enabled: !!user,
  });

  // جلب آخر snapshot للمقارنة
  const { data: currentSnapshot } = usePortfolioSnapshot();
  const { data: historySnapshots = [] } = usePortfolioHistory(30);

  // حساب الربح/الخسارة اليوم
  const todayChange = useQuery({
    queryKey: ['portfolio-today-change', user?.id, totalBalanceData?.totalUSDT],
    queryFn: async () => {
      if (!user) return { change: 0, changePercent: 0 };

      // سنستخدم الرصيد الحالي فقط
      return { change: 0, changePercent: 0 };
    },
    enabled: !!user && totalBalanceData !== undefined,
  });

  // حساب عدد المراكز النشطة
  const { data: activePositions = [] } = useQuery({
    queryKey: ['active-positions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('auto_trades' as any)
        .select('id, pair, status')
        .eq('user_id', user.id)
        .in('status', ['ACTIVE', 'PENDING']);

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  // حساب الأداء الشهري
  const monthlyPerformance = useQuery({
    queryKey: ['portfolio-monthly-performance', user?.id, totalBalanceData?.totalUSDT],
    queryFn: async () => {
      if (!user) return 0;

      // لا نستخدم snapshots حالياً (الجدول قد لا يكون موجوداً)
      // سنعيد 0 حتى يتم إصلاح الجدول
      return 0;
    },
    enabled: !!user && totalBalanceData !== undefined,
  });

  const totalValue = totalBalanceData?.totalUSDT || 0;
  const todayChangeValue = todayChange.data?.change || 0;
  const todayChangePercent = todayChange.data?.changePercent || 0;
  const positionsCount = activePositions.length;
  const monthlyPerformanceValue = monthlyPerformance.data || 0;

  const hasData = totalValue > 0 || positionsCount > 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Portfolio Overview */}
      {!hasData && !isLoadingBalance ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('no_data')}</h3>
            <p className="text-muted-foreground">
              {t('no_data_desc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{t('overview.total_value')}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{t('overview.usdt_only')}</p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingBalance ? (
                <div className="text-2xl font-bold animate-pulse">---</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                  {todayChangePercent !== 0 && (
                    <div className={`flex items-center text-xs ${todayChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {todayChangePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}% {t('overview.today')}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('overview.today_pnl')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {todayChange.isLoading ? (
                <div className="text-2xl font-bold animate-pulse">---</div>
              ) : todayChangeValue === 0 ? (
                <div className="text-2xl font-bold text-muted-foreground">$0.00</div>
              ) : (
                <>
                  <div className={`text-2xl font-bold ${todayChangeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {todayChangeValue >= 0 ? '+' : ''}${todayChangeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs ${todayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('overview.positions_count')}</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positionsCount}</div>
              <div className="text-xs text-muted-foreground">
                {t('overview.active_positions')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('overview.monthly_performance')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {monthlyPerformance.isLoading ? (
                <div className="text-2xl font-bold animate-pulse">---</div>
              ) : monthlyPerformanceValue === 0 ? (
                <div className="text-2xl font-bold text-muted-foreground">0%</div>
              ) : (
                <>
                  <div className={`text-2xl font-bold ${monthlyPerformanceValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyPerformanceValue >= 0 ? '+' : ''}{monthlyPerformanceValue.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('overview.last_30_days')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="platforms">{t('tabs.platforms')}</TabsTrigger>
          <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('positions.no_active')}</h3>
                <p className="text-muted-foreground">
                  {t('positions.no_active_desc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Positions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('positions.title')}</CardTitle>
                    <CardDescription>{t('positions.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activePositions.length === 0 ? (
                      <div className="text-center py-8">
                        <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('positions.no_active')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activePositions.map((position: any) => (
                          <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{position.pair}</h3>
                                <Badge variant={position.status === 'ACTIVE' ? "default" : "secondary"}>
                                  {position.status === 'ACTIVE' ? t('positions.active') : t('positions.pending')}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t('positions.status')} {position.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Distribution */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('distribution.title')}</CardTitle>
                    <CardDescription>{t('distribution.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {totalBalanceData?.balances && totalBalanceData.balances.length > 0 && totalValue > 0 ? (
                      <div className="space-y-3">
                        {totalBalanceData.balances
                          .filter((b: any) => b.total_balance > 0 && b.symbol !== 'USDT')
                          .sort((a: any, b: any) => b.total_balance - a.total_balance)
                          .slice(0, 10)
                          .map((balance: any) => {
                            const totalAllBalances = totalBalanceData.balances.reduce((sum: number, b: any) => sum + (b.total_balance || 0), 0);
                            const percentage = totalAllBalances > 0 ? (balance.total_balance / totalAllBalances) * 100 : 0;
                            const safePercentage = Math.min(percentage, 100);

                            return (
                              <div key={balance.symbol}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{balance.symbol}</span>
                                  <span>{safePercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={safePercentage} className="h-2" />
                              </div>
                            );
                          })}
                        {totalBalanceData.balances.filter((b: any) => b.total_balance > 0 && b.symbol !== 'USDT').length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">{t('distribution.usdt_only_desc')}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('distribution.no_data')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <PlatformDistribution />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('performance_summary.title')}</CardTitle>
              <CardDescription>{t('performance_summary.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historySnapshots.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('performance_summary.no_data')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('performance_summary.no_data_desc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance_summary.daily')}</span>
                    <span className={`font-semibold ${todayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={Math.abs(todayChangePercent)} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance_summary.monthly')}</span>
                    <span className={`font-semibold ${monthlyPerformanceValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyPerformanceValue >= 0 ? '+' : ''}{monthlyPerformanceValue.toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={Math.abs(monthlyPerformanceValue)} className="h-2" />

                  <div className="text-xs text-muted-foreground mt-4">
                    {t('performance_summary.note')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
