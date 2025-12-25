
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface PlatformBalance {
  platform: string;
  api_key_id: string;
  total_balance: number;
  symbol: string;
  testnet: boolean;
  is_active: boolean;
  market_type: string;
  balances?: Array<{
    symbol: string;
    total_balance: number;
    free_balance?: number;
    locked_balance?: number;
  }>;
}

const PlatformDistribution = () => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: platformBalances = [], refetch, isLoading } = useQuery({
    queryKey: ['platform-balances', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // جلب مفاتيح API النشطة
      const { data: apiKeys, error: apiError } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (apiError) throw apiError;

      // جلب أرصدة المحفظة لجميع المفاتيح
      const { data: balances, error: balanceError } = await supabase
        .from('portfolio_balances')
        .select('api_key_id, platform, symbol, total_balance, free_balance, locked_balance, market_type')
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // دمج البيانات وحساب الرصيد الإجمالي لكل منصة
      const platformTotals = new Map();

      apiKeys?.forEach(apiKey => {
        const platformBalances = balances?.filter(b => b.api_key_id === apiKey.id) || [];
        
        // حساب إجمالي USDT فقط (لا نحسب باقي العملات بدون أسعار حقيقية)
        // TODO: في المستقبل يمكن إضافة جلب أسعار حقيقية وتحويل جميع العملات إلى USDT
        const usdtBalance = platformBalances.find(b => b.symbol === 'USDT')?.total_balance || 0;
        
        // نعرض فقط رصيد USDT الفعلي (لا قيم وهمية)
        const totalValue = usdtBalance;
        
        const key = `${apiKey.platform}-${apiKey.id}`;
        platformTotals.set(key, {
          platform: apiKey.platform,
          api_key_id: apiKey.id,
          total_balance: totalValue,
          symbol: 'USDT',
          testnet: apiKey.testnet,
          is_active: apiKey.is_active,
          market_type: platformBalances[0]?.market_type || 'mixed', // يمكن أن تكون spot أو futures أو مختلطة
          balances: platformBalances.map(b => ({
            symbol: b.symbol,
            total_balance: b.total_balance,
            free_balance: b.free_balance,
            locked_balance: b.locked_balance
          }))
        });
      });

      return Array.from(platformTotals.values()) as PlatformBalance[];
    },
    enabled: !!user,
  });

  const getPlatformDisplayName = (platform: string) => {
    const platformNames: {[key: string]: string} = {
      'binance': 'Binance (Live)',
      'binance-demo': 'Binance Demo Trading',
      'binance-spot-testnet': 'Binance Spot Testnet',
      'binance-futures-testnet': 'Binance Futures Testnet (Old)',
      'okx': 'OKX (Live)',
      'okx-demo': 'OKX Demo',
      'bybit': 'Bybit (Live)',
      'bybit-testnet': 'Bybit Testnet',
      'kucoin': 'KuCoin'
    };
    return platformNames[platform] || platform.toUpperCase();
  };

  // حساب إجمالي الرصيد من جميع المنصات (USDT فقط)
  const totalBalance = platformBalances.reduce((sum, platform) => {
    console.log(`[PlatformDistribution] Adding platform ${platform.platform} balance:`, platform.total_balance);
    return sum + platform.total_balance;
  }, 0);
  
  console.log(`[PlatformDistribution] Total balance calculated:`, totalBalance, 'from', platformBalances.length, 'platforms');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // يمكن إضافة استدعاء edge function لتحديث الأرصدة
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>توزيع الرصيد على المنصات</CardTitle>
          <CardDescription>جاري تحميل أرصدة المنصات...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>توزيع الرصيد على المنصات</CardTitle>
            <CardDescription>توزيع رصيدك الإجمالي على المنصات المختلفة</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {platformBalances.length === 0 ? (
          <div className="text-center py-6">
            <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد منصات مربوطة
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              قم بربط منصات التداول لعرض توزيع الرصيد
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ملخص الرصيد الإجمالي */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    إجمالي الرصيد على جميع المنصات
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    (USDT فقط - لا يشمل باقي العملات)
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalBalance.toLocaleString()} USDT
                </span>
              </div>
            </div>

            {/* قائمة المنصات */}
            <div className="space-y-3">
              {platformBalances.map((platform, index) => {
                const percentage = totalBalance > 0 ? (platform.total_balance / totalBalance) * 100 : 0;
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-green-500" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {getPlatformDisplayName(platform.platform)}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {platform.testnet && (
                              <Badge variant="secondary" className="text-xs">
                                تجريبي
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {platform.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {platform.total_balance.toLocaleString()} USDT
                        </div>
                        <div className="text-sm text-gray-500">
                          {percentage.toFixed(1)}% من الإجمالي
                        </div>
                      </div>
                    </div>
                    
                    {/* شريط التقدم */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>نسبة التوزيع</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                    
                    {/* عرض جميع العملات */}
                    {platform.balances && platform.balances.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          العملات والرصيد:
                        </h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {platform.balances
                            .filter(b => b.total_balance > 0)
                            // إزالة التكرار - جمع الأرصدة لنفس العملة
                            .reduce((acc: any[], balance: any) => {
                              const existing = acc.find((b: any) => b.symbol === balance.symbol);
                              if (existing) {
                                existing.total_balance += balance.total_balance;
                                existing.free_balance = (existing.free_balance || 0) + (balance.free_balance || 0);
                                existing.locked_balance = (existing.locked_balance || 0) + (balance.locked_balance || 0);
                              } else {
                                acc.push({ ...balance });
                              }
                              return acc;
                            }, [])
                            .sort((a, b) => b.total_balance - a.total_balance)
                            .map((balance, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {balance.symbol}
                              </span>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {balance.total_balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 8
                                  })}
                                </div>
                                {balance.free_balance !== undefined && balance.locked_balance !== undefined && (
                                  <div className="text-xs text-gray-500">
                                    متاح: {balance.free_balance.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 8
                                    })} | محجوز: {balance.locked_balance.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 8
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformDistribution;
