
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AutoTradingSettings } from '@/types/automatedTrading';
import { AutoTradingSettingsService } from '@/services/automatedTrading/settingsService';
import { getDefaultAutoTradingSettings } from '@/utils/autoTradingDefaults';

export const useAutoTradingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [autoTradingSettings, setAutoTradingSettings] = useState<AutoTradingSettings>(getDefaultAutoTradingSettings());
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const settings = await AutoTradingSettingsService.loadSettings(user.id);
      setAutoTradingSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: Partial<AutoTradingSettings>) => {
    if (!user) return false;

    const updatedSettings = { ...autoTradingSettings, ...newSettings };
    setAutoTradingSettings(updatedSettings);

    const success = await AutoTradingSettingsService.saveSettings(user.id, updatedSettings);
    
    if (success) {
      toast({
        title: 'تم حفظ الإعدادات',
        description: 'تم حفظ إعدادات التداول الآلي بنجاح',
      });
    } else {
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ إعدادات التداول الآلي',
        variant: 'destructive',
      });
    }
    
    return success;
  }, [user, autoTradingSettings, toast]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  return {
    autoTradingSettings,
    loading,
    saveSettings,
    loadSettings
  };
};
