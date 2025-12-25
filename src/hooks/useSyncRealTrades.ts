
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useSyncRealTrades = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const syncTradesFromPlatform = useMutation({
    mutationFn: async (platform: string) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔄 Syncing real trades from platform:', platform);
      
      // الحصول على API keys للمنصة
      const { data: apiKeys, error: apiError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('is_active', true)
        .limit(1);

      if (apiError) throw apiError;
      if (!apiKeys || apiKeys.length === 0) {
        throw new Error(`No active API key found for platform: ${platform}`);
      }

      const apiKey = apiKeys[0];
      console.log('🔑 Using API key for', platform, ':', apiKey.id);

      // استدعاء Edge Function لجلب الصفقات الحقيقية
      const { data, error } = await supabase.functions.invoke('sync-platform-trades', {
        body: { 
          platform,
          api_key_id: apiKey.id
        }
      });

      if (error) throw error;

      console.log('📊 Synced trades:', data);
      return data;
    },
    onSuccess: (data, platform) => {
      toast({
        title: "✅ تمت المزامنة بنجاح",
        description: `تم جلب ${data.trades_count || 0} صفقة من ${platform}`,
      });
      
      // تحديث الكاش
      queryClient.invalidateQueries({ queryKey: ['trading-history'] });
      queryClient.invalidateQueries({ queryKey: ['active-trades'] });
      queryClient.invalidateQueries({ queryKey: ['live-prices'] });
    },
    onError: (error: any, platform) => {
      console.error('❌ Error syncing trades from', platform, ':', error);
      toast({
        title: "❌ خطأ في المزامنة",
        description: `فشل في جلب الصفقات من ${platform}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const clearAllTrades = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🗑️ Clearing all existing trades...');
      
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return { message: 'All trades cleared successfully' };
    },
    onSuccess: () => {
      toast({
        title: "✅ تم حذف جميع الصفقات",
        description: "تم حذف جميع الصفقات بنجاح",
      });
      
      queryClient.invalidateQueries({ queryKey: ['trading-history'] });
    },
    onError: (error: any) => {
      console.error('❌ Error clearing trades:', error);
      toast({
        title: "❌ خطأ في الحذف",
        description: `فشل في حذف الصفقات: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const generateSampleTrades = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🎲 Generating realistic trades with live prices...');
      
      // التحقق من وجود صفقات وحذفها لتجنب التراكم
      const { count } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count > 0) {
        await supabase
          .from('trades')
          .delete()
          .eq('user_id', user.id);
      }
      
      // جلب الأسعار الحية
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('get-live-prices', {
        body: { symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'XLM/USDT'] }
      });

      if (pricesError) {
        console.error('❌ Error fetching live prices for sample trades:', pricesError);
        throw pricesError;
      }

      const livePrices = pricesData?.prices || {};
      console.log('📈 Using live prices for sample trades:', livePrices);
      
      // إنشاء صفقات ثابتة وواقعية
      const baseTime = Date.now();
      const realisticTrades = [
        // صفقات BTC/USDT - ربحية
        {
          symbol: 'BTC/USDT',
          side: 'buy',
          entry_price: livePrices['BTC/USDT'] ? Number(livePrices['BTC/USDT']) * 0.97 : 110000,
          current_price: livePrices['BTC/USDT'] || 113400,
          quantity: 0.00885,
          total_invested: (livePrices['BTC/USDT'] ? Number(livePrices['BTC/USDT']) * 0.97 : 110000) * 0.00885,
          status: 'ACTIVE',
          trade_type: 'spot',
          platform: 'binance',
          leverage: 1,
          unrealized_pnl: livePrices['BTC/USDT'] ? (Number(livePrices['BTC/USDT']) - Number(livePrices['BTC/USDT']) * 0.97) * 0.00885 : 30.09,
          fees: 0.97,
          commission: 0.48,
          opened_at: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'BTC_SPOT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        },
        // صفقات ETH/USDT - ربحية
        {
          symbol: 'ETH/USDT',
          side: 'buy',
          entry_price: livePrices['ETH/USDT'] ? Number(livePrices['ETH/USDT']) * 0.985 : 3400,
          current_price: livePrices['ETH/USDT'] || 3532,
          quantity: 0.7,
          total_invested: (livePrices['ETH/USDT'] ? Number(livePrices['ETH/USDT']) * 0.985 : 3400) * 0.7,
          status: 'ACTIVE',
          trade_type: 'spot',
          platform: 'binance',
          leverage: 1,
          unrealized_pnl: livePrices['ETH/USDT'] ? (Number(livePrices['ETH/USDT']) - Number(livePrices['ETH/USDT']) * 0.985) * 0.7 : 36.54,
          fees: 2.38,
          commission: 1.19,
          opened_at: new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'ETH_SPOT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        },
        // صفقات SOL/USDT - فيوتشرز ربحية
        {
          symbol: 'SOL/USDT',
          side: 'buy',
          entry_price: livePrices['SOL/USDT'] ? Number(livePrices['SOL/USDT']) * 0.92 : 153,
          current_price: livePrices['SOL/USDT'] || 166.50,
          quantity: 6,
          total_invested: (livePrices['SOL/USDT'] ? Number(livePrices['SOL/USDT']) * 0.92 : 153) * 6,
          status: 'ACTIVE',
          trade_type: 'futures',
          platform: 'binance-futures-testnet',
          leverage: 5,
          unrealized_pnl: livePrices['SOL/USDT'] ? (Number(livePrices['SOL/USDT']) - Number(livePrices['SOL/USDT']) * 0.92) * 6 * 5 : 405,
          fees: 3.82,
          commission: 1.91,
          opened_at: new Date(baseTime - 12 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'SOL_FUT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        },
        // صفقات XRP/USDT - خاسرة
        {
          symbol: 'XRP/USDT',
          side: 'buy',
          entry_price: livePrices['XRP/USDT'] ? Number(livePrices['XRP/USDT']) * 1.05 : 3.16,
          current_price: livePrices['XRP/USDT'] || 3.013,
          quantity: 950,
          total_invested: (livePrices['XRP/USDT'] ? Number(livePrices['XRP/USDT']) * 1.05 : 3.16) * 950,
          status: 'ACTIVE',
          trade_type: 'spot',
          platform: 'binance',
          leverage: 1,
          unrealized_pnl: livePrices['XRP/USDT'] ? (Number(livePrices['XRP/USDT']) - Number(livePrices['XRP/USDT']) * 1.05) * 950 : -139.65,
          fees: 3.02,
          commission: 1.51,
          opened_at: new Date(baseTime - 8 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'XRP_SPOT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        },
        // صفقات ADA/USDT - ربحية قليلة
        {
          symbol: 'ADA/USDT',
          side: 'buy',
          entry_price: livePrices['ADA/USDT'] ? Number(livePrices['ADA/USDT']) * 0.99 : 0.722,
          current_price: livePrices['ADA/USDT'] || 0.7297,
          quantity: 4100,
          total_invested: (livePrices['ADA/USDT'] ? Number(livePrices['ADA/USDT']) * 0.99 : 0.722) * 4100,
          status: 'ACTIVE',
          trade_type: 'spot',
          platform: 'binance',
          leverage: 1,
          unrealized_pnl: livePrices['ADA/USDT'] ? (Number(livePrices['ADA/USDT']) - Number(livePrices['ADA/USDT']) * 0.99) * 4100 : 29.87,
          fees: 2.96,
          commission: 1.48,
          opened_at: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'ADA_SPOT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        },
        // صفقات XLM/USDT - فيوتشرز ربحية عالية
        {
          symbol: 'XLM/USDT',
          side: 'buy',
          entry_price: livePrices['XLM/USDT'] ? Number(livePrices['XLM/USDT']) * 0.85 : 0.335,
          current_price: livePrices['XLM/USDT'] || 0.394,
          quantity: 8000,
          total_invested: (livePrices['XLM/USDT'] ? Number(livePrices['XLM/USDT']) * 0.85 : 0.335) * 8000,
          status: 'ACTIVE',
          trade_type: 'futures',
          platform: 'binance-futures-testnet',
          leverage: 10,
          unrealized_pnl: livePrices['XLM/USDT'] ? (Number(livePrices['XLM/USDT']) - Number(livePrices['XLM/USDT']) * 0.85) * 8000 * 10 : 4720,
          fees: 26.8,
          commission: 13.4,
          opened_at: new Date(baseTime - 6 * 60 * 60 * 1000).toISOString(),
          platform_trade_id: 'XLM_FUT_001',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        }
      ];

      const trades = realisticTrades.map(trade => ({
        ...trade,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('trades')
        .insert(trades)
        .select();

      if (error) throw error;

      return { trades_count: data.length, trades: data };
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تم إنشاء صفقات تجريبية",
        description: `تم إضافة ${data.trades_count} صفقة تجريبية بأسعار حقيقية`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['trading-history'] });
      queryClient.invalidateQueries({ queryKey: ['live-prices'] });
    },
    onError: (error: any) => {
      console.error('❌ Error generating sample trades:', error);
      toast({
        title: "❌ خطأ",
        description: `فشل في إنشاء الصفقات التجريبية: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return {
    syncTradesFromPlatform,
    generateSampleTrades,
    clearAllTrades,
    isSyncing: syncTradesFromPlatform.isPending || generateSampleTrades.isPending || clearAllTrades.isPending
  };
};
