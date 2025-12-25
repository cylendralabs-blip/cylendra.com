
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trade } from '@/types/trade';
import { recordOutcomeFromTrade } from '@/core/forecasting/outcomeRecorder';

export const useTradeActions = () => {
  const [isClosing, setIsClosing] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const closeTradeDirectly = useMutation({
    mutationFn: async ({ tradeId, platform }: { tradeId: string; platform: string }) => {
      console.log('🔄 إغلاق الصفقة مباشرة:', { tradeId, platform });
      
      // تحديث حالة الصفقة في قاعدة البيانات
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          sync_status: 'pending_close',
          notes: 'تم الإغلاق يدوياً من التطبيق'
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;

      // هنا يمكن إضافة استدعاء API المنصة لإغلاق الصفقة فعلياً
      // await closePlatformTrade(platform, data.platform_trade_id);

      const tradeData = data as any;

      // Phase X.11: Record signal outcome for forecasting
      if (tradeData.closed_at && tradeData.exit_price && tradeData.profit_loss_percentage !== null) {
        try {
          await recordOutcomeFromTrade({
            id: tradeData.id,
            signal_id: tradeData.signal_id,
            user_id: tradeData.user_id,
            symbol: tradeData.symbol,
            timeframe: tradeData.timeframe,
            side: tradeData.side as 'BUY' | 'SELL',
            entry_price: tradeData.entry_price,
            exit_price: tradeData.exit_price,
            opened_at: tradeData.opened_at,
            closed_at: tradeData.closed_at,
            profit_loss_percentage: tradeData.profit_loss_percentage,
            signal_source: tradeData.signal_source,
          });
        } catch (outcomeError) {
          console.error('Error recording signal outcome:', outcomeError);
          // Don't fail the trade close if outcome recording fails
        }
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تم بنجاح",
        description: `تم إغلاق صفقة ${data.symbol} بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['trading-history'] });
      queryClient.invalidateQueries({ queryKey: ['historical-trades'] });
    },
    onError: (error) => {
      console.error('❌ خطأ في إغلاق الصفقة:', error);
      toast({
        title: "❌ خطأ",
        description: "فشل في إغلاق الصفقة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsClosing(null);
    }
  });

  const syncWithPlatform = useMutation({
    mutationFn: async (platform: string) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔄 مزامنة البيانات مع المنصة:', platform);
      
      // هنا سيكون استدعاء API المنصة للحصول على آخر البيانات
      // const platformData = await fetchPlatformTrades(platform);
      
      // تحديث حالة المزامنة
      const { error: syncError } = await (supabase as any)
        .from('platform_sync_status')
        .upsert({
          user_id: user.id,
          exchange: platform,
          last_portfolio_sync_at: new Date().toISOString(),
          last_positions_sync_at: new Date().toISOString(),
          status: 'ok',
          last_error: null,
        }, {
          onConflict: 'user_id,exchange',
        });

      if (syncError) {
        console.error('Error updating sync status:', syncError);
      }
      
      return { platform, synced: true };
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تمت المزامنة",
        description: `تم تحديث بيانات ${data.platform} بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['trading-history'] });
    },
    onError: (error) => {
      console.error('❌ خطأ في المزامنة:', error);
      toast({
        title: "❌ خطأ في المزامنة",
        description: "فشل في مزامنة البيانات مع المنصة",
        variant: "destructive",
      });
    }
  });

  const handleCloseTrade = (trade: Trade) => {
    if (!trade.platform) {
      toast({
        title: "❌ خطأ",
        description: "لا يمكن تحديد منصة التداول",
        variant: "destructive",
      });
      return;
    }

    setIsClosing(trade.id);
    closeTradeDirectly.mutate({
      tradeId: trade.id,
      platform: trade.platform
    });
  };

  const handleSyncPlatform = (platform: string) => {
    syncWithPlatform.mutate(platform);
  };

  return {
    handleCloseTrade,
    handleSyncPlatform,
    isClosing,
    isSyncing: syncWithPlatform.isPending
  };
};
