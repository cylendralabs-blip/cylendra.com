
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
}

interface PortfolioBalance {
  total_balance: number;
  symbol: string;
  api_key_id: string;
}

export const usePlatformCapital = (selectedPlatformId: string) => {
  const { user } = useAuth();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [selectedPlatformInfo, setSelectedPlatformInfo] = useState<ApiKey | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  console.log('usePlatformCapital called with platform ID:', selectedPlatformId);

  // جلب مفاتيح API النشطة
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching API keys for user:', user.id);
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
      }
      
      console.log('API keys fetched:', data);
      return data as ApiKey[];
    },
    enabled: !!user,
  });

  // جلب أرصدة المحفظة للمنصة المختارة
  const { data: portfolioBalances = [], refetch: refetchBalances, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolio-balances', selectedPlatformId],
    queryFn: async () => {
      if (!user || !selectedPlatformId) {
        console.log('No user or platform selected for portfolio fetch');
        return [];
      }
      
      console.log('Fetching portfolio balances for platform ID:', selectedPlatformId);
      
      const { data, error } = await supabase
        .from('portfolio_balances')
        .select('total_balance, symbol, api_key_id')
        .eq('user_id', user.id)
        .eq('api_key_id', selectedPlatformId);

      if (error) {
        console.error('Error fetching portfolio balances:', error);
        throw error;
      }
      
      console.log('Portfolio balances fetched for platform', selectedPlatformId, ':', data);
      return data as PortfolioBalance[];
    },
    enabled: !!user && !!selectedPlatformId,
  });

  // تحديث معلومات المنصة عند تغيير المنصة المختارة
  useEffect(() => {
    console.log('Platform changed effect - selectedPlatformId:', selectedPlatformId);
    console.log('Available API keys:', apiKeys);
    
    if (selectedPlatformId && apiKeys.length > 0) {
      const platform = apiKeys.find(key => key.id === selectedPlatformId);
      console.log('Found platform info:', platform);
      setSelectedPlatformInfo(platform || null);
    } else {
      console.log('Clearing platform info');
      setSelectedPlatformInfo(null);
    }
  }, [selectedPlatformId, apiKeys]);

  // تحديث الرصيد المتاح عند تغيير أرصدة المحفظة
  useEffect(() => {
    console.log('Portfolio balances effect - balances:', portfolioBalances);
    
    if (portfolioBalances && portfolioBalances.length > 0) {
      // البحث عن USDT أولاً، ثم USDC، ثم أي عملة مستقرة أخرى
      const usdtBalance = portfolioBalances.find(balance => balance.symbol === 'USDT');
      const usdcBalance = portfolioBalances.find(balance => balance.symbol === 'USDC');
      const busdBalance = portfolioBalances.find(balance => balance.symbol === 'BUSD');
      
      const selectedBalance = usdtBalance || usdcBalance || busdBalance || portfolioBalances[0];
      const balance = selectedBalance ? selectedBalance.total_balance : 0;
      
      console.log('Setting available balance to:', balance);
      setAvailableBalance(balance);
    } else {
      console.log('No portfolio balances found, setting balance to 0');
      setAvailableBalance(0);
    }
  }, [portfolioBalances]);

  // دالة لإعادة جلب البيانات يدوياً
  const refreshBalance = async () => {
    console.log('Manual refresh triggered for platform:', selectedPlatformId);
    if (selectedPlatformId) {
      setIsLoadingBalance(true);
      try {
        await refetchBalances();
      } finally {
        setIsLoadingBalance(false);
      }
    }
  };

  return {
    availableBalance,
    selectedPlatformInfo,
    refetchBalances: refreshBalance,
    isLoading: isLoadingPortfolio || isLoadingBalance,
  };
};
