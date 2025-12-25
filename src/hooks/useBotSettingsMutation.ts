
/**
 * useBotSettingsMutation Hook
 * 
 * Hook لحفظ إعدادات البوت
 * 
 * Phase 1: توحيد الإعدادات - يستخدم @/core/config
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BotSettingsForm } from '@/core/config';
import { awardLPForBotActivation, updateAffiliateWeight } from '@/services/affiliate/integration';
import { logFeatureUsage } from '@/services/admin/FeatureUsageService';
import { updateUserFunnelStage } from '@/services/admin/UserFunnelService';

/**
 * Filter bot settings data to only include columns that exist in the database
 * Based on actual bot_settings table schema from types.ts
 * 
 * IMPORTANT: Only include columns that are confirmed to exist in the database.
 * If a column doesn't exist, it will cause a PGRST204 error.
 */
function filterBotSettingsData(data: BotSettingsForm): Record<string, any> {
  // ONLY columns that actually exist in bot_settings table (from types.ts Row type)
  // These are the confirmed columns from the database schema
  // DO NOT add columns here unless they exist in the actual database
  const validColumns = [
    'allow_long_trades',
    'allow_short_trades',
    'auto_leverage',
    'bot_name',
    'dca_levels',
    'default_platform',
    'default_trade_direction',
    'initial_order_percentage',
    'is_active',
    'leverage',
    'leverage_strategy',
    'market_type',
    'max_active_trades',
    'max_leverage_increase',
    'order_type',
    'profit_taking_strategy',
    'risk_percentage',
    'risk_reward_ratio',
    'signal_source',
    'stop_loss_percentage',
    'strategy_type',
    'take_profit_percentage',
    'total_capital',
    // Phase 2: Strategy System Integration
    'strategy_instance_id', // Link to strategy_instances table
    // Phase X: Auto Trading from Signals
    'auto_trading_enabled',
    'auto_trading_mode',
    'allowed_signal_sources',
    'min_signal_confidence',
    'allowed_directions',
    'max_auto_trades_per_day',
    'max_concurrent_auto_positions',
    'auto_trading_notes',
    // Note: stop_loss_calculation_method might not exist in remote DB
    // Only include if migration was applied
  ];

  // Filter data to only include valid columns
  const filtered: Record<string, any> = {};
  const removed: string[] = [];
  
  for (const key of validColumns) {
    if (key in data && data[key as keyof BotSettingsForm] !== undefined) {
      const value = data[key as keyof BotSettingsForm];
      // Special handling for default_platform: preserve empty string as null for database
      // This ensures the value is properly saved and retrieved
      if (key === 'default_platform') {
        filtered[key] = value === '' ? null : value;
      } else {
        filtered[key] = value;
      }
    }
  }
  
  // Track removed columns for debugging
  for (const key in data) {
    if (!validColumns.includes(key) && data[key as keyof BotSettingsForm] !== undefined) {
      removed.push(key);
    }
  }

  // Log filtered data for debugging
  if (removed.length > 0) {
    console.log('Filtered bot settings (removed non-existent columns):', {
      original: Object.keys(data).length,
      filtered: Object.keys(filtered).length,
      removed: removed,
    });
  }

  return filtered;
}

export const useBotSettingsMutation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BotSettingsForm>) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Saving bot settings to database:', data);
      
      // Get current settings first, then merge with new data
      const { data: currentSettings } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Merge current settings with new data
      const mergedData: BotSettingsForm = {
        ...(currentSettings as any || {}),
        ...data,
      } as BotSettingsForm;
      
      // Ensure default_platform is preserved if it exists (even if empty string)
      // Only set to null/undefined if explicitly cleared
      if (data.default_platform !== undefined) {
        mergedData.default_platform = data.default_platform;
      } else if (currentSettings?.default_platform !== undefined) {
        // Preserve existing default_platform if not being changed
        mergedData.default_platform = currentSettings.default_platform;
      }
      
      // Filter data to only include valid database columns
      const filteredData = filterBotSettingsData(mergedData);
      
      // Normalize signal_source to match database constraint
      // TODO: After migration 20250213000009 is applied, remove this mapping
      // Database currently allows: 'ai', 'tradingview', 'legacy'
      // After migration: 'ai', 'realtime_ai', 'tradingview', 'legacy'
      if (filteredData.signal_source === 'realtime_ai') {
        // Temporarily map to 'ai' until migration is applied
        filteredData.signal_source = 'ai';
        console.log('Mapped realtime_ai to ai for database compatibility');
      }
      
      // Log default_platform for debugging
      console.log('Saving default_platform:', {
        original: data.default_platform,
        merged: mergedData.default_platform,
        filtered: filteredData.default_platform,
        current: currentSettings?.default_platform
      });
      
      // Ensure default_platform is included even if empty
      const finalData = {
        ...filteredData,
        default_platform: filteredData.default_platform || null, // Convert empty string to null
      };
      
      console.log('Final data being saved:', finalData);
      
      const { error, data: savedData } = await supabase
        .from('bot_settings')
        .upsert({
          user_id: user.id,
          ...finalData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();
      
      console.log('Saved data from database:', savedData);
      
      if (error) {
        console.error('Error saving bot settings:', error);
        throw error;
      }
      
      console.log('Bot settings saved successfully to database');
      
      // Award LP if bot was activated
      const wasActivated = mergedData.is_active === true;
      const previousSettings = currentSettings as any;
      const wasPreviouslyActive = previousSettings?.is_active === true;
      
      if (wasActivated && !wasPreviouslyActive) {
        // Bot was just activated - award LP
        try {
          // Get user's affiliate ID if exists
          const { data: affiliateUser } = await supabase
            .from('affiliate_users' as any)
            .select('affiliate_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single() as { data: { affiliate_id: string } | null; error: any };
          
          const affiliateData = affiliateUser as { affiliate_id: string } | null;
          
          if (affiliateData?.affiliate_id) {
            await awardLPForBotActivation(user.id, affiliateData.affiliate_id);
            
            // Update affiliate weight
            await updateAffiliateWeight(affiliateData.affiliate_id);
          }
        } catch (lpError) {
          console.warn('Error awarding LP for bot activation:', lpError);
          // Don't fail the mutation if LP award fails
        }
        
        // Phase Admin C: Log feature usage and update funnel
        try {
          await Promise.all([
            logFeatureUsage(user.id, 'auto_trading'),
            updateUserFunnelStage(user.id, 'first_feature_used'),
          ]);
        } catch (e) {
          console.error('Error logging feature usage:', e);
        }
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bot-settings'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
      
      toast({
        title: 'نجح الحفظ',
        description: 'تم حفظ إعدادات البوت بنجاح',
      });
      
      // Reset mutation state to ensure it's ready for next save
      // This prevents the mutation from getting stuck in a pending state
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'حدث خطأ أثناء حفظ الإعدادات';
      
      toast({
        title: 'خطأ في الحفظ',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error saving bot settings:', error);
      
      // Log detailed error for debugging
      if (error?.code) {
        console.error('Error code:', error.code);
      }
      if (error?.details) {
        console.error('Error details:', error.details);
      }
      if (error?.hint) {
        console.error('Error hint:', error.hint);
      }
    },
  });
};
