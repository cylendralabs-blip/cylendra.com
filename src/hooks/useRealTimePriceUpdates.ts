
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade } from '@/types/trade';

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

export const useRealTimePriceUpdates = (trades: Trade[]) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // جلب الأسعار الحية للرموز النشطة
  const { data: livePrices, refetch: refetchPrices } = useQuery({
    queryKey: ['live-prices', trades?.map(t => t.symbol).join(',')],
    queryFn: async () => {
      if (!trades || trades.length === 0) return {};
      
      const activeSymbols = [...new Set(trades
        .filter(trade => trade.status === 'ACTIVE')
        .map(trade => trade.symbol)
      )];

      if (activeSymbols.length === 0) return {};

      console.log('🔄 Fetching live prices for symbols:', activeSymbols);

      try {
        const { data, error } = await supabase.functions.invoke('get-live-prices', {
          body: { symbols: activeSymbols }
        });

        if (error) {
          console.error('❌ Error fetching live prices:', error);
          return {};
        }

        console.log('📈 Live prices received:', data);
        setLastUpdateTime(new Date());
        return data.prices || {};
      } catch (error) {
        console.error('💥 Failed to fetch live prices:', error);
        return {};
      }
    },
    enabled: !!trades && trades.length > 0,
    refetchInterval: 30000, // تحديث كل 30 ثانية لتقليل التشويش
    staleTime: 15000, // 15 ثانية stale time
    retry: 2,
    retryDelay: 5000,
  });

  // تحديث أسعار الصفقات في قاعدة البيانات
  const updateTradesWithLivePrices = async () => {
    if (!livePrices || !trades || !user || Object.keys(livePrices).length === 0) return;

    setIsUpdating(true);
    console.log('💰 Updating trades with live prices...');

    try {
      const updates = [];
      
      for (const trade of trades.filter(t => t.status === 'ACTIVE')) {
        const livePrice = livePrices[trade.symbol];
        if (livePrice && Math.abs(livePrice - (trade.current_price || 0)) > 0.001) {
          // حساب الربح/الخسارة غير المحققة
          const priceDiff = livePrice - trade.entry_price;
          const unrealizedPnl = trade.side === 'buy' 
            ? (priceDiff * trade.quantity)
            : ((-priceDiff) * trade.quantity);

          updates.push({
            id: trade.id,
            current_price: livePrice,
            unrealized_pnl: unrealizedPnl,
            last_sync_at: new Date().toISOString()
          });
        }
      }

      if (updates.length > 0) {
        console.log('📊 Updating', updates.length, 'trades with new prices');
        
        for (const update of updates) {
          const { error } = await supabase
            .from('trades')
            .update({
              current_price: update.current_price,
              unrealized_pnl: update.unrealized_pnl,
              last_sync_at: update.last_sync_at
            })
            .eq('id', update.id);

          if (error) {
            console.error('❌ Error updating trade', update.id, ':', error);
          }
        }

        // تحديث الكاش بدون refetch فوري لتجنب التشويش
        queryClient.invalidateQueries({ queryKey: ['trading-history'] });
        console.log('✅ Trades updated successfully');
      }
    } catch (error) {
      console.error('💥 Error updating trades:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // تحديث الصفقات عند تغيير الأسعار (مع debounce)
  useEffect(() => {
    if (livePrices && Object.keys(livePrices).length > 0) {
      const timer = setTimeout(() => {
        updateTradesWithLivePrices();
      }, 2000); // تأخير لتجنب التحديثات المتكررة

      return () => clearTimeout(timer);
    }
  }, [livePrices]);

  // تحديث تلقائي كل دقيقتين
  useEffect(() => {
    const interval = setInterval(() => {
      if (trades && trades.length > 0) {
        refetchPrices();
      }
    }, 120000); // كل دقيقتين

    return () => clearInterval(interval);
  }, [trades, refetchPrices]);

  return {
    livePrices: livePrices || {},
    isUpdating,
    refetchPrices,
    lastUpdateTime,
    priceCount: Object.keys(livePrices || {}).length
  };
};
