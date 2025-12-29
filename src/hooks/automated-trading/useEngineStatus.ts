
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAutoTradingSettings } from '@/hooks/useAutoTradingSettings';

export const useEngineStatus = () => {
  const { toast } = useToast();
  const { saveSettings } = useAutoTradingSettings();
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  const toggleTradingEngine = useCallback(async (enabled: boolean) => {
    setIsEngineRunning(enabled);
    await saveSettings({ isEnabled: enabled });

    if (enabled) {
      toast({
        title: 'تم تفعيل التداول الآلي',
        description: 'سيتم مراقبة الإشارات وتنفيذ الصفقات تلقائياً',
      });
    } else {
      toast({
        title: 'تم إيقاف التداول الآلي',
        description: 'تم إيقاف التنفيذ التلقائي للصفقات',
        variant: 'destructive',
      });
    }
  }, [saveSettings, toast]);

  return {
    isEngineRunning,
    toggleTradingEngine
  };
};
