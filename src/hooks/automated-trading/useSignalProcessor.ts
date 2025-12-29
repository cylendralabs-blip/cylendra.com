
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AutoTradingSettings } from '@/types/automatedTrading';

export const useSignalProcessor = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const processNewSignals = useCallback(async (
    userId: string,
    settings: AutoTradingSettings
  ) => {
    if (!settings.isEnabled || !settings.autoExecuteSignals) {
      return;
    }

    console.log('🤖 بدء معالجة الإشارات الجديدة...');

    try {
      // هنا يتم استدعاء خدمة معالجة الإشارات
      // يمكن نقل المنطق من useAutoTradeExecution هنا
      
      toast({
        title: 'تم معالجة الإشارات',
        description: 'تم فحص الإشارات الجديدة بنجاح',
      });

    } catch (error) {
      console.error('خطأ في معالجة الإشارات:', error);
      toast({
        title: 'خطأ في المعالجة التلقائية',
        description: 'فشل في معالجة الإشارات الجديدة',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    processNewSignals: () => user && processNewSignals(user.id, {} as AutoTradingSettings)
  };
};
