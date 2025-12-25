/**
 * Cohort Analysis Service
 * 
 * Phase Admin C: Monthly cohort retention and revenue analysis
 */

import { supabase } from '@/integrations/supabase/client';

export interface CohortData {
  cohortMonth: string; // YYYY-MM format
  totalUsers: number;
  retentionByMonth: Record<string, number>; // { "month_1": 0.85, "month_2": 0.72, ... }
  arpu: number;
  conversionRate: number;
  churnRate: number;
}

/**
 * Get cohort analysis data
 */
export async function getCohortAnalysis(): Promise<{ cohorts: CohortData[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_cohorts')
      .select('*')
      .order('cohort_month', { ascending: false })
      .limit(12); // Last 12 months

    if (error) {
      console.error('Error fetching cohort data:', error);
      return { cohorts: [], error: error.message };
    }

    const cohorts: CohortData[] = (data || []).map((row: any) => ({
      cohortMonth: row.cohort_month,
      totalUsers: row.total_users || 0,
      retentionByMonth: row.retention_by_month || {},
      arpu: Number(row.arpu) || 0,
      conversionRate: Number(row.conversion_rate) || 0,
      churnRate: Number(row.churn_rate) || 0,
    }));

    return { cohorts };
  } catch (error) {
    console.error('Error in getCohortAnalysis:', error);
    return {
      cohorts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate cohort data for a specific month
 * This is typically called by a cron job
 */
export async function calculateCohortData(
  cohortMonth: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all users who signed up in this month
    const firstDay = new Date(cohortMonth + '-01');
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

    const { data: users, error: usersError } = await (supabase as any)
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    const totalUsers = users?.length || 0;

    // Calculate retention by month
    const retentionByMonth: Record<string, number> = {};
    const now = new Date();
    
    for (let monthOffset = 1; monthOffset <= 12; monthOffset++) {
      const targetDate = new Date(firstDay);
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      
      if (targetDate > now) break;

      // Count users who were active in this month
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const { count: activeUsers } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', users?.map((u: any) => u.id) || [])
        .gte('updated_at', monthStart.toISOString())
        .lte('updated_at', monthEnd.toISOString());

      retentionByMonth[`month_${monthOffset}`] = totalUsers > 0
        ? (activeUsers || 0) / totalUsers
        : 0;
    }

    // Calculate ARPU (would need revenue data)
    const arpu = 0; // TODO: Calculate from revenue data

    // Calculate conversion rate (would need subscription data)
    const conversionRate = 0; // TODO: Calculate from subscription data

    // Calculate churn rate
    const churnRate = retentionByMonth.month_1
      ? (1 - retentionByMonth.month_1) * 100
      : 0;

    // Upsert cohort data
    const { error: upsertError } = await (supabase as any)
      .from('user_cohorts')
      .upsert({
        cohort_month: cohortMonth,
        total_users: totalUsers,
        retention_by_month: retentionByMonth,
        arpu,
        conversion_rate: conversionRate,
        churn_rate: churnRate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'cohort_month',
      });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in calculateCohortData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

