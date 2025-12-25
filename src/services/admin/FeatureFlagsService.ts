/**
 * Feature Flags Service
 * 
 * Phase Admin A: Manage feature flags from admin panel
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './AdminActivityService';

export interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  is_enabled: boolean;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<{ flags: FeatureFlag[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('feature_flags')
      .select('*')
      .order('feature_name');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return { flags: [], error: error.message };
    }

    return { flags: ((data || []) as unknown) as FeatureFlag[] };
  } catch (error) {
    console.error('Error in getAllFeatureFlags:', error);
    return {
      flags: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a specific feature flag
 */
export async function getFeatureFlag(
  featureKey: string
): Promise<{ flag: FeatureFlag | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('feature_flags')
      .select('*')
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (error) {
      console.error('Error fetching feature flag:', error);
      return { flag: null, error: error.message };
    }

    return { flag: (data as unknown) as FeatureFlag | null };
  } catch (error) {
    console.error('Error in getFeatureFlag:', error);
    return {
      flag: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  try {
    const { flag } = await getFeatureFlag(featureKey);
    return flag?.is_enabled ?? true; // Default to enabled if not found
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Toggle a feature flag
 */
export async function toggleFeatureFlag(
  featureKey: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('feature_flags')
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('feature_key', featureKey);

    if (error) {
      console.error('Error updating feature flag:', error);
      return { success: false, error: error.message };
    }

    // Log admin action
    await logAdminAction(`FEATURE_FLAG_${enabled ? 'ENABLED' : 'DISABLED'}`, {
      targetType: 'feature',
      targetId: featureKey,
      metadata: { enabled, feature_key: featureKey },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in toggleFeatureFlag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

