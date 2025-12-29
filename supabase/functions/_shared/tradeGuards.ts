/**
 * Trade Guards
 * 
 * Phase Admin B: Safety checks before trade execution
 * - Global Kill Switch
 * - User Trading Status
 * - Feature Flags
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Check if global kill switch is enabled
 */
export async function checkGlobalKillSwitch(
  supabaseClient: SupabaseClient
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data, error } = await (supabaseClient as any)
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'global_kill_switch')
      .maybeSingle();

    if (error) {
      console.error('Error checking global kill switch:', error);
      // On error, allow trading (fail open for safety)
      return { allowed: true };
    }

    const isEnabled = data?.setting_value === 'on' || data?.setting_value === true;

    if (isEnabled) {
      return {
        allowed: false,
        reason: 'Global kill switch is enabled. All trading operations are temporarily disabled.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error in checkGlobalKillSwitch:', error);
    // On error, allow trading (fail open for safety)
    return { allowed: true };
  }
}

/**
 * Check if user trading is enabled
 */
export async function checkUserTradingStatus(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data, error } = await (supabaseClient as any)
      .from('user_trading_status')
      .select('trading_enabled, reason')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user trading status:', error);
      // If no record exists, assume trading is enabled
      return { allowed: true };
    }

    if (!data) {
      // No record means trading is enabled by default
      return { allowed: true };
    }

    if (!data.trading_enabled) {
      return {
        allowed: false,
        reason: data.reason || 'Trading is disabled for this user by an administrator.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error in checkUserTradingStatus:', error);
    // On error, allow trading (fail open for safety)
    return { allowed: true };
  }
}

/**
 * Check if a feature is enabled
 */
export async function checkFeatureFlag(
  supabaseClient: SupabaseClient,
  featureKey: string
): Promise<{ enabled: boolean; error?: string }> {
  try {
    const { data, error } = await (supabaseClient as any)
      .from('feature_flags')
      .select('is_enabled')
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (error) {
      console.error('Error checking feature flag:', error);
      // On error, assume feature is enabled (fail open)
      return { enabled: true };
    }

    if (!data) {
      // No record means feature is enabled by default
      return { enabled: true };
    }

    return { enabled: data.is_enabled || false };
  } catch (error) {
    console.error('Error in checkFeatureFlag:', error);
    // On error, assume feature is enabled (fail open)
    return { enabled: true };
  }
}

/**
 * Perform all trade guards checks
 */
export async function performTradeGuards(
  supabaseClient: SupabaseClient,
  userId: string,
  featureKey?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Check global kill switch
  const killSwitchCheck = await checkGlobalKillSwitch(supabaseClient);
  if (!killSwitchCheck.allowed) {
    return killSwitchCheck;
  }

  // 2. Check user trading status
  const userStatusCheck = await checkUserTradingStatus(supabaseClient, userId);
  if (!userStatusCheck.allowed) {
    return userStatusCheck;
  }

  // 3. Check feature flag if provided
  if (featureKey) {
    const featureCheck = await checkFeatureFlag(supabaseClient, featureKey);
    if (!featureCheck.enabled) {
      return {
        allowed: false,
        reason: `Feature ${featureKey} is disabled. Trading operations are not available.`,
      };
    }
  }

  return { allowed: true };
}

