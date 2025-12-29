import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeTradeUpdates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    console.log('🔌 Setting up realtime subscriptions for trades...');

    // Subscribe to trades table changes
    const tradesChannel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🆕 New trade inserted:', payload.new);
          
          // Invalidate all related queries
          queryClient.invalidateQueries({ queryKey: ['trading-history'] });
          queryClient.invalidateQueries({ queryKey: ['active-trades'] });
          queryClient.invalidateQueries({ queryKey: ['trading-performance'] });
          
          toast({
            title: '✅ صفقة جديدة',
            description: `تم فتح صفقة ${payload.new.symbol}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Trade updated:', payload.new);
          
          // Invalidate all related queries
          queryClient.invalidateQueries({ queryKey: ['trading-history'] });
          queryClient.invalidateQueries({ queryKey: ['active-trades'] });
          queryClient.invalidateQueries({ queryKey: ['trading-performance'] });
          
          // Show notification if trade was closed
          if (payload.old.status === 'ACTIVE' && payload.new.status === 'CLOSED') {
            const pnl = payload.new.realized_pnl || 0;
            toast({
              title: pnl >= 0 ? '🎉 ربح!' : '📉 خسارة',
              description: `تم إغلاق صفقة ${payload.new.symbol} - ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
              variant: pnl >= 0 ? 'default' : 'destructive',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🗑️ Trade deleted:', payload.old);
          
          queryClient.invalidateQueries({ queryKey: ['trading-history'] });
          queryClient.invalidateQueries({ queryKey: ['active-trades'] });
          
          toast({
            title: '🗑️ تم الحذف',
            description: `تم حذف صفقة ${payload.old.symbol}`,
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Trades subscription status:', status);
      });

    // Subscribe to bot_settings changes
    const botSettingsChannel = supabase
      .channel('bot-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bot_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('⚙️ Bot settings updated:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['bot-settings'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Bot settings subscription status:', status);
      });

    // Subscribe to portfolio_balances changes
    const portfolioChannel = supabase
      .channel('portfolio-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 Portfolio balance changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
          queryClient.invalidateQueries({ queryKey: ['platform-capital'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Portfolio subscription status:', status);
      });

    // Subscribe to DCA orders changes
    const dcaOrdersChannel = supabase
      .channel('dca-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dca_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📊 DCA order changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['dca-orders'] });
          queryClient.invalidateQueries({ queryKey: ['trading-history'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 DCA orders subscription status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔌 Cleaning up realtime subscriptions...');
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(botSettingsChannel);
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(dcaOrdersChannel);
    };
  }, [user, queryClient, toast]);
};
