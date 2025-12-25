/**
 * useTradingViewSignals Hook
 * 
 * Hook لإدارة إشارات TradingView من قاعدة البيانات
 * 
 * Phase 3: TradingView Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TradingViewSignal, TradingViewSettings, TradingViewPerformance } from '@/types/tradingview';

export const useTradingViewSignals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch signals
  const {
    data: signals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tradingview-signals', user?.id],
    queryFn: async (): Promise<TradingViewSignal[]> => {
      if (!user) return [];

      const { data, error: fetchError } = await supabase
        .from('tradingview_signals' as any)
        .select('*')
        .eq('user_id', user.id)
        // Filter only internal engine signals (not TradingView webhook signals)
        .eq('webhook_data->>source', 'internal_engine')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('Error fetching TradingView signals:', fetchError);
        // If table doesn't exist, return empty array instead of throwing
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
          console.warn('tradingview_signals table does not exist yet');
          return [];
        }
        throw fetchError;
      }

      return ((data || []) as unknown as TradingViewSignal[]);
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['tradingview-settings', user?.id],
    queryFn: async (): Promise<TradingViewSettings | null> => {
      if (!user) return null;

      const { data, error: fetchError } = await supabase
        .from('tradingview_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching TradingView settings:', fetchError);
        return null;
      }

      return (data ? (data as unknown as TradingViewSettings) : null);
    },
    enabled: !!user,
    retry: false,
  });

  // Calculate performance
  const performance: TradingViewPerformance | null = signals.length > 0 ? {
    total_signals: signals.length,
    successful_signals: signals.filter(s => s.result === 'PROFIT').length,
    failed_signals: signals.filter(s => s.result === 'LOSS').length,
    pending_signals: signals.filter(s => s.status === 'ACTIVE').length,
    win_rate: signals.filter(s => s.result === 'PROFIT').length / 
              (signals.filter(s => s.result === 'PROFIT' || s.result === 'LOSS').length || 1) * 100,
    average_profit: signals
      .filter(s => s.result === 'PROFIT' && s.profit_loss_percentage)
      .reduce((sum, s) => sum + (s.profit_loss_percentage || 0), 0) / 
      (signals.filter(s => s.result === 'PROFIT').length || 1),
    average_loss: signals
      .filter(s => s.result === 'LOSS' && s.profit_loss_percentage)
      .reduce((sum, s) => sum + Math.abs(s.profit_loss_percentage || 0), 0) / 
      (signals.filter(s => s.result === 'LOSS').length || 1),
    total_pnl: signals.reduce((sum, s) => sum + (s.profit_loss_percentage || 0), 0),
    by_timeframe: signals.reduce((acc, s) => {
      acc[s.timeframe] = (acc[s.timeframe] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    by_strategy: signals.reduce((acc, s) => {
      const strategy = s.strategy_name || 'Unknown';
      acc[strategy] = (acc[strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  // Save settings mutation
  const { mutate: saveSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (newSettings: Partial<TradingViewSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { error: upsertError } = await supabase
        .from('tradingview_settings' as any)
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Error saving TradingView settings:', upsertError);
        throw upsertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingview-settings', user?.id] });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات TradingView بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الحفظ',
        description: error.message || 'حدث خطأ أثناء حفظ الإعدادات',
        variant: 'destructive',
      });
    },
  });

  // Update signal mutation
  const { mutate: updateSignal } = useMutation({
    mutationFn: async ({ signalId, updates }: { signalId: string; updates: Partial<TradingViewSignal> }) => {
      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('tradingview_signals' as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signalId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating signal:', updateError);
        throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingview-signals', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'حدث خطأ أثناء تحديث الإشارة',
        variant: 'destructive',
      });
    },
  });

  // Delete signal mutation
  const { mutate: deleteSignal } = useMutation({
    mutationFn: async (signalId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('tradingview_signals' as any)
        .delete()
        .eq('id', signalId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting signal:', deleteError);
        throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingview-signals', user?.id] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإشارة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء حذف الإشارة',
        variant: 'destructive',
      });
    },
  });

  // Cleanup signals mutation
  const { mutate: cleanupSignals, isPending: isCleaningUp } = useMutation({
    mutationFn: async ({ days, timeframe }: { days: number; timeframe?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let query = supabase
        .from('tradingview_signals' as any)
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString())
        .in('status', ['EXPIRED', 'CANCELLED']);

      if (timeframe) {
        query = query.eq('timeframe', timeframe);
      }

      const { error: cleanupError } = await query;

      if (cleanupError) {
        console.error('Error cleaning up signals:', cleanupError);
        throw cleanupError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingview-signals', user?.id] });
      toast({
        title: 'تم التنظيف',
        description: 'تم تنظيف الإشارات القديمة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التنظيف',
        description: error.message || 'حدث خطأ أثناء تنظيف الإشارات',
        variant: 'destructive',
      });
    },
  });

  return {
    signals,
    settings,
    performance,
    isLoading,
    error,
    refetch,
    saveSettings,
    updateSignal: (signalId: string, updates: Partial<TradingViewSignal>) => 
      updateSignal({ signalId, updates }),
    cleanupSignals,
    deleteSignal,
    isSavingSettings,
    isCleaningUp,
  };
};
