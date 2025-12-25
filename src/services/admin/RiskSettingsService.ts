/**
 * Risk Settings Service
 * 
 * Phase Admin B: System-wide risk threshold management
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './AdminActivityService';
import { setSetting } from './SystemSettingsService';

export interface RiskSettings {
  globalDailyLossLimit: number; // Percentage (e.g., -10 for -10%)
  globalMaxDrawdown: number; // Percentage (e.g., -25 for -25%)
  maxLeverageAllowed: number;
  maxBotsPerUser: number;
  defaultBotSafetySettings: {
    maxActiveTrades: number;
    riskPercentage: number;
    stopLossPercentage: number;
  };
}

const DEFAULT_RISK_SETTINGS: RiskSettings = {
  globalDailyLossLimit: -10,
  globalMaxDrawdown: -25,
  maxLeverageAllowed: 10,
  maxBotsPerUser: 5,
  defaultBotSafetySettings: {
    maxActiveTrades: 5,
    riskPercentage: 2.0,
    stopLossPercentage: 5.0,
  },
};

/**
 * Get current risk settings
 */
export async function getRiskSettings(): Promise<{ settings: RiskSettings; error?: string }> {
  try {
    const settings: RiskSettings = { ...DEFAULT_RISK_SETTINGS };

    // Get from system_settings
    const keys = [
      'global_daily_loss_limit',
      'global_max_drawdown',
      'max_leverage_allowed',
      'max_bots_per_user',
      'default_bot_safety_settings',
    ];

    for (const key of keys) {
      try {
        const { data } = await (supabase as any)
          .from('system_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (data) {
          const value = data.value;
          switch (key) {
            case 'global_daily_loss_limit':
              settings.globalDailyLossLimit = Number(value) || DEFAULT_RISK_SETTINGS.globalDailyLossLimit;
              break;
            case 'global_max_drawdown':
              settings.globalMaxDrawdown = Number(value) || DEFAULT_RISK_SETTINGS.globalMaxDrawdown;
              break;
            case 'max_leverage_allowed':
              settings.maxLeverageAllowed = Number(value) || DEFAULT_RISK_SETTINGS.maxLeverageAllowed;
              break;
            case 'max_bots_per_user':
              settings.maxBotsPerUser = Number(value) || DEFAULT_RISK_SETTINGS.maxBotsPerUser;
              break;
            case 'default_bot_safety_settings':
              if (typeof value === 'object') {
                settings.defaultBotSafetySettings = { ...DEFAULT_RISK_SETTINGS.defaultBotSafetySettings, ...value };
              }
              break;
          }
        }
      } catch (e) {
        // Ignore errors for individual keys
      }
    }

    return { settings };
  } catch (error) {
    console.error('Error in getRiskSettings:', error);
    return {
      settings: DEFAULT_RISK_SETTINGS,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update risk settings
 */
export async function updateRiskSettings(
  updates: Partial<RiskSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update each setting
    const updatePromises: Promise<{ success: boolean; error?: string }>[] = [];

    if (updates.globalDailyLossLimit !== undefined) {
      updatePromises.push(
        setSetting('global_daily_loss_limit', updates.globalDailyLossLimit, 'Global daily loss limit percentage')
      );
    }

    if (updates.globalMaxDrawdown !== undefined) {
      updatePromises.push(
        setSetting('global_max_drawdown', updates.globalMaxDrawdown, 'Global max drawdown percentage')
      );
    }

    if (updates.maxLeverageAllowed !== undefined) {
      updatePromises.push(
        setSetting('max_leverage_allowed', updates.maxLeverageAllowed, 'Maximum leverage allowed')
      );
    }

    if (updates.maxBotsPerUser !== undefined) {
      updatePromises.push(
        setSetting('max_bots_per_user', updates.maxBotsPerUser, 'Maximum bots per user')
      );
    }

    if (updates.defaultBotSafetySettings !== undefined) {
      updatePromises.push(
        setSetting('default_bot_safety_settings', updates.defaultBotSafetySettings, 'Default bot safety settings')
      );
    }

    const results = await Promise.all(updatePromises);
    const hasError = results.some(r => !r.success);

    if (hasError) {
      return { success: false, error: 'Some settings failed to update' };
    }

    // Log admin action
    await logAdminAction('RISK_SETTINGS_UPDATED', {
      targetType: 'system',
      targetId: 'global',
      metadata: { updates },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in updateRiskSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

