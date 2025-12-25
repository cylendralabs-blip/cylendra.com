/**
 * useUserApiKeys Hook
 * 
 * Phase X.17 - Multi-Exchange Portfolio Insights & Scope Selector
 * Fetches user's active API keys for scope selector
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ApiKey {
  id: string;
  platform: string;
  is_active: boolean;
  testnet: boolean;
  created_at: string;
}

/**
 * Fetch user's active API keys
 */
export function useUserApiKeys() {
  const { user } = useAuth();

  return useQuery<ApiKey[], Error>({
    queryKey: ['user-api-keys', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, platform, is_active, testnet, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ApiKey[];
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string, testnet: boolean): string {
  const platformNames: {[key: string]: string} = {
    'binance': 'Binance',
    'binance-demo': 'Binance Demo Trading',
    'binance-spot-testnet': 'Binance Spot Testnet',
    'binance-futures-testnet': 'Binance Futures Testnet (Old)',
    'okx': 'OKX',
    'okx-demo': 'OKX Demo',
    'bybit': 'Bybit',
    'bybit-testnet': 'Bybit Testnet',
    'kucoin': 'KuCoin'
  };
  
  const name = platformNames[platform] || platform.toUpperCase();
  return testnet ? `${name} (Testnet)` : name;
}

