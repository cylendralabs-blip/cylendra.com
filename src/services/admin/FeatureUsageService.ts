/**
 * Feature Usage Service
 * 
 * Phase Admin C: Track and analyze feature usage
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeatureUsageStats {
  featureKey: string;
  totalUsage: number;
  uniqueUsers: number;
  usageByPlan: Record<string, number>;
  lastUsedAt: string | null;
}

export interface DailyFeatureUsage {
  date: string;
  feature_key: string;
  total_usage_count: number;
  unique_users_count: number;
  usage_by_plan: Record<string, number>;
}

/**
 * Log feature usage
 */
export async function logFeatureUsage(
  userId: string,
  featureKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if usage log exists for this user and feature
    const { data: existing } = await (supabase as any)
      .from('feature_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (existing) {
      // Update existing log
      const { error } = await (supabase as any)
        .from('feature_usage_logs')
        .update({
          usage_count: (existing.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating feature usage:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new log
      const { error } = await (supabase as any)
        .from('feature_usage_logs')
        .insert({
          user_id: userId,
          feature_key: featureKey,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating feature usage log:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logFeatureUsage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats(
  days: number = 30
): Promise<{ stats: FeatureUsageStats[]; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get aggregated daily usage
    const { data: dailyUsage, error } = await (supabase as any)
      .from('feature_usage_daily')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching feature usage:', error);
      return { stats: [], error: error.message };
    }

    // Aggregate by feature
    const featureMap = new Map<string, FeatureUsageStats>();

    (dailyUsage || []).forEach((day: DailyFeatureUsage) => {
      const existing = featureMap.get(day.feature_key);
      if (existing) {
        existing.totalUsage += day.total_usage_count;
        existing.uniqueUsers = Math.max(existing.uniqueUsers, day.unique_users_count);
        // Merge usage by plan
        Object.entries(day.usage_by_plan || {}).forEach(([plan, count]) => {
          existing.usageByPlan[plan] = (existing.usageByPlan[plan] || 0) + count;
        });
      } else {
        featureMap.set(day.feature_key, {
          featureKey: day.feature_key,
          totalUsage: day.total_usage_count,
          uniqueUsers: day.unique_users_count,
          usageByPlan: day.usage_by_plan || {},
          lastUsedAt: day.date,
        });
      }
    });

    // If no daily data, get from raw logs
    if (featureMap.size === 0) {
      const { data: rawLogs } = await (supabase as any)
        .from('feature_usage_logs')
        .select('*')
        .gte('last_used_at', startDate.toISOString());

      if (rawLogs) {
        rawLogs.forEach((log: any) => {
          const existing = featureMap.get(log.feature_key);
          if (existing) {
            existing.totalUsage += log.usage_count;
            existing.uniqueUsers += 1;
          } else {
            featureMap.set(log.feature_key, {
              featureKey: log.feature_key,
              totalUsage: log.usage_count,
              uniqueUsers: 1,
              usageByPlan: {},
              lastUsedAt: log.last_used_at,
            });
          }
        });
      }
    }

    const stats = Array.from(featureMap.values()).sort(
      (a, b) => b.totalUsage - a.totalUsage
    );

    return { stats };
  } catch (error) {
    console.error('Error in getFeatureUsageStats:', error);
    return {
      stats: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get daily feature usage for a date range
 */
export async function getDailyFeatureUsage(
  featureKey: string,
  fromDate: Date,
  toDate: Date
): Promise<{ usage: DailyFeatureUsage[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('feature_usage_daily')
      .select('*')
      .eq('feature_key', featureKey)
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily feature usage:', error);
      return { usage: [], error: error.message };
    }

    return { usage: (data || []) as DailyFeatureUsage[] };
  } catch (error) {
    console.error('Error in getDailyFeatureUsage:', error);
    return {
      usage: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

