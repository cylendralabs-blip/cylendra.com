/**
 * System Settings Service
 * 
 * Admin-Controlled Beta Mode Configuration
 */

import { supabase } from '@/integrations/supabase/client';

export interface BetaModeConfig {
  enabled: boolean;
  durationDays: number;
  endDate: string | null;
}

export interface SystemSetting {
  key: string;
  value: any;
  updated_at: string;
  updated_by?: string;
  description?: string;
}

/**
 * Get a system setting by key
 */
export async function getSetting(key: string): Promise<{
  setting: SystemSetting | null;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { setting: null, error: 'Not authenticated' };
    }

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      return { setting: null, error: error.message };
    }

    return { setting: data };
  } catch (error) {
    console.error('Error getting setting:', error);
    return {
      setting: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Set a system setting
 */
export async function setSetting(
  key: string,
  value: any,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('system_settings')
      .upsert({
        key,
        value: typeof value === 'string' ? JSON.parse(value) : value,
        updated_by: session.user.id,
        description,
      }, {
        onConflict: 'key'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting setting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Beta Mode configuration
 */
export async function getBetaModeConfig(): Promise<{
  config: BetaModeConfig | null;
  error?: string;
}> {
  try {
    const [enabledResult, durationResult, endDateResult] = await Promise.all([
      getSetting('beta_mode_enabled'),
      getSetting('beta_duration_days'),
      getSetting('beta_end_date'),
    ]);

    const enabled = enabledResult.setting?.value === true || enabledResult.setting?.value === 'true';
    const durationDays = durationResult.setting?.value?.days || 60;
    const endDate = endDateResult.setting?.value || null;

    return {
      config: {
        enabled,
        durationDays: typeof durationDays === 'number' ? durationDays : parseInt(durationDays, 10),
        endDate: typeof endDate === 'string' ? endDate : null,
      },
    };
  } catch (error) {
    console.error('Error getting beta mode config:', error);
    return {
      config: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update Beta Mode configuration
 */
export async function updateBetaModeConfig(
  enabled: boolean,
  durationDays: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate duration
    if (durationDays < 1 || durationDays > 365) {
      return { success: false, error: 'Duration must be between 1 and 365 days' };
    }

    // Calculate end date if enabled
    let endDate: string | null = null;
    if (enabled) {
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + durationDays);
      endDate = endDateObj.toISOString();
    }

    // Update all settings
    const [enabledResult, durationResult, endDateResult] = await Promise.all([
      setSetting('beta_mode_enabled', enabled),
      setSetting('beta_duration_days', { days: durationDays }),
      setSetting('beta_end_date', endDate),
    ]);

    if (!enabledResult.success || !durationResult.success || !endDateResult.success) {
      return {
        success: false,
        error: enabledResult.error || durationResult.error || endDateResult.error,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating beta mode config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all system settings (admin only)
 */
export async function getAllSettings(): Promise<{
  settings: SystemSetting[];
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { settings: [], error: 'Not authenticated' };
    }

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) {
      return { settings: [], error: error.message };
    }

    return { settings: data || [] };
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {
      settings: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get global kill switch status
 */
export async function getGlobalKillSwitch(): Promise<boolean> {
  try {
    const result = await getSetting('global_kill_switch');
    if (result.setting?.value === true || result.setting?.value === 'true') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error getting global kill switch:', error);
    return false;
  }
}

/**
 * Set global kill switch status
 */
export async function setGlobalKillSwitch(enabled: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    return await setSetting('global_kill_switch', enabled, 'Global kill switch to stop all trading operations');
  } catch (error) {
    console.error('Error setting global kill switch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
