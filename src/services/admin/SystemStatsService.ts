/**
 * System Stats Service
 * 
 * Phase 18: Aggregate daily/real-time system statistics
 */

import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  id: string;
  date: string;
  active_users: number;
  total_trades: number;
  total_volume_usd: number;
  avg_latency_ms?: number;
  failed_jobs: number;
  created_at: string;
}

/**
 * Record daily system stats
 */
export async function recordDailyStats(
  stats: {
    activeUsers: number;
    totalTrades: number;
    totalVolumeUsd: number;
    avgLatencyMs?: number;
    failedJobs: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { error } = await (supabase as any)
      .from('system_stats')
      .upsert({
        date: today,
        active_users: stats.activeUsers,
        total_trades: stats.totalTrades,
        total_volume_usd: stats.totalVolumeUsd,
        avg_latency_ms: stats.avgLatencyMs,
        failed_jobs: stats.failedJobs,
      }, {
        onConflict: 'date',
      });

    if (error) {
      console.error('Error recording daily stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in recordDailyStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get system stats for a date range
 */
export async function getStatsForRange(
  startDate: string,
  endDate: string
): Promise<{ stats: SystemStats[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('system_stats')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching system stats:', error);
      return { stats: [], error: error.message };
    }

    return { stats: ((data || []) as unknown) as SystemStats[] };
  } catch (error) {
    console.error('Error in getStatsForRange:', error);
    return {
      stats: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get latest system stats
 */
export async function getLatestStats(): Promise<{ stats: SystemStats | null; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('system_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest stats:', error);
      return { stats: null, error: error.message };
    }

    return { stats: data as SystemStats | null };
  } catch (error) {
    console.error('Error in getLatestStats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get stats for last N days
 */
export async function getStatsForLastDays(
  days: number = 7
): Promise<{ stats: SystemStats[]; error?: string }> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return getStatsForRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  } catch (error) {
    console.error('Error in getStatsForLastDays:', error);
    return {
      stats: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get today's stats
 */
export async function getTodayStats(): Promise<{ stats: SystemStats | null; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await (supabase as any)
      .from('system_stats')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today stats:', error);
      return { stats: null, error: error.message };
    }

    return { stats: (data as unknown) as SystemStats | null };
  } catch (error) {
    console.error('Error in getTodayStats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get system overview (summary stats)
 */
export async function getSystemOverview(): Promise<{
  todayStats: SystemStats | null;
  last7Days: SystemStats[];
  last30Days: SystemStats[];
  error?: string;
}> {
  try {
    const [todayResult, last7Result, last30Result] = await Promise.all([
      getTodayStats(),
      getStatsForLastDays(7),
      getStatsForLastDays(30),
    ]);

    return {
      todayStats: todayResult.stats,
      last7Days: last7Result.stats,
      last30Days: last30Result.stats,
      error: todayResult.error || last7Result.error || last30Result.error,
    };
  } catch (error) {
    console.error('Error in getSystemOverview:', error);
    return {
      todayStats: null,
      last7Days: [],
      last30Days: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
