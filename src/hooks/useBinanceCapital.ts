import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
  api_key: string;
  secret_key: string;
}

interface PortfolioBalance {
  total_balance: number;
  symbol: string;
  api_key_id: string;
  platform: string;
  market_type: string;
}

export const useBinanceCapital = (selectedPlatformId: string, marketType?: string) => {
  const { user } = useAuth();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [selectedPlatformInfo, setSelectedPlatformInfo] = useState<ApiKey | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('🔍 useBinanceCapital called with platform ID:', selectedPlatformId, 'market type:', marketType);

  // جلب مفاتيح API النشطة
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('📡 Fetching API keys for user:', user.id);
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet, api_key, secret_key')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching API keys:', error);
        throw error;
      }
      
      console.log('✅ API keys fetched:', data?.map(key => ({ id: key.id, platform: key.platform, testnet: key.testnet })));
      return data as ApiKey[];
    },
    enabled: !!user,
  });

  // جلب أرصدة المحفظة للمنصة المختارة
  const { data: portfolioBalances = [], refetch: refetchBalances, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolio-balances', selectedPlatformId, marketType],
    queryFn: async () => {
      if (!user || !selectedPlatformId) {
        console.log('⚠️ No user or platform selected for portfolio fetch');
        return [];
      }
      
      console.log('📊 Fetching portfolio balances for platform ID:', selectedPlatformId, 'market type:', marketType);
      
      const { data, error } = await supabase
        .from('portfolio_balances')
        .select('total_balance, symbol, api_key_id, platform, market_type')
        .eq('user_id', user.id)
        .eq('api_key_id', selectedPlatformId);

      if (error) {
        console.error('❌ Error fetching portfolio balances:', error);
        throw error;
      }
      
      console.log('💰 Portfolio balances fetched for platform', selectedPlatformId, ':', data?.map(b => ({ 
        symbol: b.symbol, 
        balance: b.total_balance, 
        platform: b.platform, 
        market_type: b.market_type 
      })));
      return data as PortfolioBalance[];
    },
    enabled: !!user && !!selectedPlatformId,
  });

  // دالة جلب رصيد المنصة مباشرة (تدعم جميع المنصات: Binance, OKX, Bybit, etc.) - يجب تعريفها قبل useEffect
  const fetchBinanceBalance = useCallback(async (apiKey: ApiKey, formMarketType?: string) => {
    try {
      console.log('🔍 Fetching balance directly from', apiKey.platform, 'for API key:', apiKey.id, 'with market type:', formMarketType);
      setIsRefreshing(true);
      
      // استخدام نوع السوق من النموذج أو القيمة الافتراضية
      let marketTypeToUse = formMarketType || 'spot';
      console.log('📊 Initial market type:', marketTypeToUse, 'for platform:', apiKey.platform);
      
      // تحديد المنصة والـ API الصحيح للطلب
      let platformForRequest = apiKey.platform;
      let apiKeyToUse = apiKey;
      
      // معالجة خاصة لـ Binance Futures
      if (marketTypeToUse === 'futures' && apiKey.platform === 'binance' && !apiKey.testnet) {
        console.log('🎯 Using Binance LIVE futures API for platform:', apiKey.platform);
        platformForRequest = 'binance';
      } 
      else if (apiKey.platform === 'binance-demo' || apiKey.platform === 'binance-futures-testnet') {
        // Binance Demo Trading (demo.binance.com) يدعم Spot و Futures
        console.log('🧪 Using Binance Demo Trading API for platform:', apiKey.platform);
        console.log('📊 Binance Demo Trading supports both Spot and Futures, using market_type:', marketTypeToUse);
        // استخدام binance-demo للمنصتين (Demo Trading يدعم الاثنين)
        platformForRequest = 'binance-demo';
        // لا نغير marketTypeToUse - نستخدم القيمة المحددة من النموذج
      }
      else if (apiKey.platform === 'binance-spot-testnet') {
        // Binance Spot Testnet (testnet.binance.vision) - Spot only
        console.log('🧪 Using Binance Spot Testnet API for platform:', apiKey.platform);
        platformForRequest = 'binance-spot-testnet';
        // Force spot market type for Spot Testnet
        marketTypeToUse = 'spot';
      }
      // لـ OKX و Bybit، نستخدم platform كما هو (okx, okx-demo, bybit, bybit-testnet)
      else {
        console.log('🌐 Using platform directly:', apiKey.platform, 'for market type:', marketTypeToUse);
        platformForRequest = apiKey.platform;
      }
      
      console.log('🔧 Final request details:', {
        apiKeyId: apiKeyToUse.id,
        platform: platformForRequest,
        marketType: marketTypeToUse,
        isTestnet: apiKey.testnet
      });
      
      const { data, error } = await supabase.functions.invoke('exchange-portfolio', {
        body: { 
          action: 'get_balance',
          api_key_id: apiKeyToUse.id,
          platform: platformForRequest,
          market_type: marketTypeToUse
        }
      });

      if (error) {
        console.error('❌ Error calling exchange-portfolio function:', error);
        throw error;
      }

      console.log('📋 API response for', platformForRequest, 'with market type', marketTypeToUse, ':', {
        success: data?.success,
        balances_count: data?.balances?.length,
        market_type: marketTypeToUse,
        balances: data?.balances?.map((b: any) => ({ symbol: b.symbol, balance: b.total_balance }))
      });
      
      if (data && data.success) {
        console.log('📊 API response details:', {
          success: data.success,
          balancesCount: data.balances?.length || 0,
          balances: data.balances,
          message: data.message,
          platform: platformForRequest,
          marketType: marketTypeToUse
        });
        
        if (data.balances && data.balances.length > 0) {
          // دعم التنسيق الجديد (asset, total, available, inOrder) والقديم (symbol, total_balance)
          const usdtBalance = data.balances.find((b: any) => 
            (b.symbol === 'USDT' || b.asset === 'USDT')
          );
          
          if (usdtBalance) {
            // دعم كلا التنسيقين
            const balance = usdtBalance.total || usdtBalance.total_balance || 0;
            if (balance > 0) {
              console.log('💰 Found USDT balance from API:', balance, 'for platform:', platformForRequest, 'market:', marketTypeToUse);
              setAvailableBalance(balance);
            } else {
              console.log('⚠️ USDT balance is 0 for platform:', platformForRequest, 'market:', marketTypeToUse);
              setAvailableBalance(0);
            }
          } else {
            console.log('⚠️ No USDT balance found in API response for platform:', platformForRequest, 'market:', marketTypeToUse);
            console.log('📋 Available balances:', data.balances.map((b: any) => ({
              symbol: b.symbol || b.asset,
              total: b.total || b.total_balance,
              available: b.available || b.free_balance
            })));
            
            // إذا كانت هناك عملات أخرى، نستخدم أول عملة
            if (data.balances.length > 0) {
              const firstBalance = data.balances[0];
              const balance = firstBalance.total || firstBalance.total_balance || 0;
              console.log('💡 Using first available balance:', firstBalance.symbol || firstBalance.asset, '=', balance);
              setAvailableBalance(balance);
            } else {
              setAvailableBalance(0);
            }
          }
        } else {
          // لا توجد بيانات رصيد - قد يكون الحساب فارغاً
          console.log('⚠️ API returned success but no balances for platform:', platformForRequest);
          console.log('💡 This may indicate:');
          console.log('   1. Empty account (no funds)');
          console.log('   2. OKX Demo account with no simulated balance');
          console.log('   3. API permissions issue (read-only key may not have balance access)');
          console.log('   4. API response format issue');
          
          if (data.message) {
            console.log('📝 API message:', data.message);
          }
          
          setAvailableBalance(0);
        }
        
        console.log('🔄 Refetching balances from database...');
        await refetchBalances();
      } else {
        console.error('❌ Failed to fetch balance from', platformForRequest, ':', data);
        setAvailableBalance(0);
      }
    } catch (error) {
      console.error('💥 Error fetching balance from', apiKey.platform, ':', error);
      setAvailableBalance(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchBalances]);

  // تحديث معلومات المنصة عند تغيير المنصة المختارة
  useEffect(() => {
    console.log('🔄 Platform changed effect - selectedPlatformId:', selectedPlatformId, 'marketType:', marketType);
    console.log('🔑 Available API keys:', apiKeys?.map(key => ({ id: key.id, platform: key.platform, testnet: key.testnet })));
    
    if (selectedPlatformId && apiKeys.length > 0) {
      const platform = apiKeys.find(key => key.id === selectedPlatformId);
      console.log('🎯 Found platform info:', platform ? { 
        id: platform.id, 
        platform: platform.platform, 
        testnet: platform.testnet 
      } : 'Platform not found');
      setSelectedPlatformInfo(platform || null);
      
      // جلب البيانات مباشرة لجميع المنصات (Binance, OKX, Bybit, etc.)
      if (platform) {
        console.log('🚀 Triggering direct balance fetch for platform:', platform.platform, 'with market type:', marketType);
        fetchBinanceBalance(platform, marketType);
      }
    } else {
      console.log('🔄 Clearing platform info');
      setSelectedPlatformInfo(null);
      setAvailableBalance(0);
    }
  }, [selectedPlatformId, apiKeys, marketType, fetchBinanceBalance]);

  // تحديث الرصيد المتاح عند تغيير أرصدة المحفظة
  useEffect(() => {
    console.log('💵 Portfolio balances effect - balances:', portfolioBalances?.map(b => ({ 
      symbol: b.symbol, 
      balance: b.total_balance,
      platform: b.platform,
      market_type: b.market_type,
      api_key_id: b.api_key_id
    })));
    
    if (portfolioBalances && portfolioBalances.length > 0) {
      // تصفية الأرصدة بناءً على نوع السوق المطلوب
      const currentMarketType = marketType || 'spot';
      const filteredBalances = portfolioBalances.filter(balance => 
        balance.market_type === currentMarketType
      );
      
      console.log('🔍 Filtered balances for market type', currentMarketType, ':', filteredBalances);
      
      if (filteredBalances.length > 0) {
        // البحث عن USDT أولاً، ثم USDC، ثم أي عملة مستقرة أخرى
        const usdtBalance = filteredBalances.find(balance => balance.symbol === 'USDT');
        const usdcBalance = filteredBalances.find(balance => balance.symbol === 'USDC');
        const busdBalance = filteredBalances.find(balance => balance.symbol === 'BUSD');
        
        const selectedBalance = usdtBalance || usdcBalance || busdBalance || filteredBalances[0];
        const balance = selectedBalance ? selectedBalance.total_balance : 0;
        
        console.log('💎 Selected balance details for', currentMarketType, ':', selectedBalance ? {
          symbol: selectedBalance.symbol,
          balance: selectedBalance.total_balance,
          platform: selectedBalance.platform,
          market_type: selectedBalance.market_type,
          api_key_id: selectedBalance.api_key_id
        } : 'No balance found');
        
        console.log('📈 Setting available balance to:', balance, 'for market type:', currentMarketType);
        setAvailableBalance(balance);
      } else {
        console.log('⚠️ No balances found for market type:', currentMarketType, '- setting balance to 0');
        setAvailableBalance(0);
      }
    } else {
      console.log('📉 No portfolio balances found, setting balance to 0');
      setAvailableBalance(0);
    }
  }, [portfolioBalances, marketType]);

  // دالة لإعادة جلب البيانات يدوياً لجميع المنصات
  const refreshBalance = async () => {
    console.log('🔄 Manual refresh triggered for platform:', selectedPlatformId, 'market type:', marketType);
    if (selectedPlatformInfo) {
      console.log('🎯 Refreshing balance for', selectedPlatformInfo.platform, 'with market type:', marketType);
      await fetchBinanceBalance(selectedPlatformInfo, marketType);
    } else {
      setIsRefreshing(true);
      try {
        console.log('📊 Refetching portfolio balances from database...');
        await refetchBalances();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return {
    availableBalance,
    selectedPlatformInfo,
    refetchBalances: refreshBalance,
    isLoading: isLoadingPortfolio || isRefreshing,
  };
};
