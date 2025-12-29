/**
 * Business Analytics Service
 * 
 * Phase Admin C: Business metrics and KPIs
 */

import { supabase } from '@/integrations/supabase/client';

export interface BusinessKPIs {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  userGrowthRate: number; // Month-over-Month %
  usersByPlan: Record<string, number>;
  retentionRate7d: number;
  retentionRate30d: number;
  churnRate: number;
  conversionRateFreeToPaid: number;
}

export interface DailyUserMetrics {
  date: string;
  total_users: number;
  active_users_24h: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users: number;
  users_by_plan: Record<string, number>;
  retention_rate_7d: number | null;
  retention_rate_30d: number | null;
  churn_rate: number | null;
  conversion_rate_free_to_paid: number | null;
}

/**
 * Get current business KPIs
 */
export async function getBusinessKPIs(): Promise<{ kpis: BusinessKPIs | null; error?: string }> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get total users
    const { count: totalUsers } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (24h, 7d, 30d) - based on last_sign_in_at from auth.users
    // Note: This is an approximation. For accurate data, we'd need to track activity separately
    const { count: activeUsers24h } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', yesterday.toISOString());

    const { count: activeUsers7d } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', last7Days.toISOString());

    const { count: activeUsers30d } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', last30Days.toISOString());

    // Get new users today
    const { count: newUsersToday } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get new users this month
    const { count: newUsersThisMonth } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    // Get users from last month for growth rate calculation
    const { count: usersLastMonth } = await (supabase as any)
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfLastMonth.toISOString())
      .lt('created_at', firstDayOfMonth.toISOString());

    // Calculate growth rate
    const userGrowthRate = usersLastMonth && usersLastMonth > 0
      ? ((newUsersThisMonth || 0) - usersLastMonth) / usersLastMonth * 100
      : newUsersThisMonth ? 100 : 0;

    // Get users by plan (assuming we have a plan field or can infer from usage)
    // For now, we'll use a placeholder structure
    const usersByPlan: Record<string, number> = {
      free: totalUsers || 0, // Default all to free for now
      pro: 0,
      vip: 0,
      institutional: 0,
    };

    // Get latest daily metrics for retention and churn
    const { data: latestMetrics } = await (supabase as any)
      .from('daily_user_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const kpis: BusinessKPIs = {
      totalUsers: totalUsers || 0,
      activeUsers24h: activeUsers24h || 0,
      activeUsers7d: activeUsers7d || 0,
      activeUsers30d: activeUsers30d || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      userGrowthRate,
      usersByPlan,
      retentionRate7d: latestMetrics?.retention_rate_7d || 0,
      retentionRate30d: latestMetrics?.retention_rate_30d || 0,
      churnRate: latestMetrics?.churn_rate || 0,
      conversionRateFreeToPaid: latestMetrics?.conversion_rate_free_to_paid || 0,
    };

    return { kpis };
  } catch (error) {
    console.error('Error in getBusinessKPIs:', error);
    return {
      kpis: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get daily user metrics for a date range
 */
export async function getDailyUserMetrics(
  fromDate: Date,
  toDate: Date
): Promise<{ metrics: DailyUserMetrics[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('daily_user_metrics')
      .select('*')
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily user metrics:', error);
      return { metrics: [], error: error.message };
    }

    return { metrics: (data || []) as DailyUserMetrics[] };
  } catch (error) {
    console.error('Error in getDailyUserMetrics:', error);
    return {
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

