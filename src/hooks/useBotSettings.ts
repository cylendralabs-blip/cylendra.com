
/**
 * useBotSettings Hook
 * 
 * Hook موحد للحصول على إعدادات البوت
 * 
 * Phase 1: توحيد مصدر الإعدادات - يستخدم @/core/config
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BotSettingsForm, botSettingsSchema, defaultBotSettings, mapSettingsToFormData } from '@/core/config';
import { useBotSettingsData } from './useBotSettingsData';
import { useBotSettingsMutation } from './useBotSettingsMutation';

export { useBotSettingsData };

export const useBotSettings = () => {
  const { data: settings, isLoading: loadingData } = useBotSettingsData();
  const mutation = useBotSettingsMutation();
  const [isInitialized, setIsInitialized] = React.useState(false);

  const form = useForm<BotSettingsForm>({
    resolver: zodResolver(botSettingsSchema),
    defaultValues: defaultBotSettings,
  });

  // Update form when settings data is loaded (ONLY ONCE on initial load)
  React.useEffect(() => {
    // Only reset form on initial load, not on subsequent refetches
    if (isInitialized) {
      return; // Don't reset form if already initialized
    }

    if (settings) {
      console.log('Loading bot settings from database:', settings);
      console.log('Raw default_platform from DB:', settings.default_platform, 'Type:', typeof settings.default_platform);
      
      const formData = mapSettingsToFormData(settings);
      
      console.log('Mapped form data with default_platform:', formData.default_platform, 'Type:', typeof formData.default_platform);
      
      // Reset form with mapped data - use keepDefaultValues: false to ensure clean reset
      // لكن نحتفظ بـ isDirty = false بعد reset (لأن البيانات محملة من DB)
      form.reset(formData, { 
        keepDefaultValues: false,
        keepValues: false,
        keepDirty: false, // مهم: نعيد isDirty إلى false بعد الحفظ
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false
      });
      
      setIsInitialized(true);
      
      // Double-check that default_platform was set correctly after a short delay
      setTimeout(() => {
        const currentValue = form.getValues('default_platform');
        console.log('Form value after reset (delayed check):', currentValue, 'Type:', typeof currentValue);
        
        if (settings.default_platform && settings.default_platform !== '' && !currentValue) {
          console.warn('default_platform was not set correctly, attempting to fix...');
          form.setValue('default_platform', String(settings.default_platform), { 
            shouldValidate: false, 
            shouldDirty: false,
            shouldTouch: false
          });
        }
      }, 150);
    } else if (!loadingData) {
      // If no settings found, reset to defaults
      console.log('No settings found, resetting to defaults');
      form.reset(defaultBotSettings, {
        keepDefaultValues: false,
        keepValues: false
      });
      setIsInitialized(true);
    }
  }, [settings, loadingData, form, isInitialized]);

  const onSubmit = (data: BotSettingsForm) => {
    console.log('Submitting bot settings form:', data);
    mutation.mutate(data);
  };

  // Map the database settings to BotSettingsForm format
  const botSettings: BotSettingsForm | null = settings ? mapSettingsToFormData(settings) : null;

  return {
    form,
    loading: mutation.isPending,
    loadingData,
    onSubmit,
    botSettings, // Add the actual bot settings data
  };
};
