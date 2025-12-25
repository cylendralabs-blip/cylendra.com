/**
 * Revenue Analytics Service
 * 
 * Phase Admin C: Revenue metrics (MRR, ARR, LTV, ARPU)
 */

import { supabase } from '@/integrations/supabase/client';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  arpu: number; // Average Revenue Per User
  ltv: number; // Customer Lifetime Value
  revenueByPlan: Record<string, number>;
  churnedRevenue: number;
  newRevenue: number;
  projectedRevenueGrowth: number; // %
}

export interface DailyRevenueMetrics {
  date: string;
  mrr: number;
  arr: number;
  arpu: number;
  ltv: number;
  revenue_by_plan: Record<string, number>;
  churned_revenue: number;
  new_revenue: number;
}

/**
 * Get current revenue metrics
 */
export async function getRevenueMetrics(): Promise<{ metrics: RevenueMetrics | null; error?: string }> {
  try {
    // Get latest daily revenue metrics
    const { data: latestMetrics } = await (supabase as any)
      .from('daily_revenue_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestMetrics) {
      const metrics: RevenueMetrics = {
        mrr: Number(latestMetrics.mrr) || 0,
        arr: Number(latestMetrics.arr) || 0,
        arpu: Number(latestMetrics.arpu) || 0,
        ltv: Number(latestMetrics.ltv) || 0,
        revenueByPlan: latestMetrics.revenue_by_plan || {},
        churnedRevenue: Number(latestMetrics.churned_revenue) || 0,
        newRevenue: Number(latestMetrics.new_revenue) || 0,
        projectedRevenueGrowth: 0, // Calculate from historical data
      };

      // Calculate projected growth from last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: historicalMetrics } = await (supabase as any)
        .from('daily_revenue_metrics')
        .select('mrr')
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (historicalMetrics && historicalMetrics.mrr > 0) {
        const oldMrr = Number(historicalMetrics.mrr);
        const newMrr = metrics.mrr;
        metrics.projectedRevenueGrowth = oldMrr > 0 ? ((newMrr - oldMrr) / oldMrr) * 100 : 0;
      }

      return { metrics };
    }

    // If no metrics exist, return zeros
    return {
      metrics: {
        mrr: 0,
        arr: 0,
        arpu: 0,
        ltv: 0,
        revenueByPlan: {},
        churnedRevenue: 0,
        newRevenue: 0,
        projectedRevenueGrowth: 0,
      },
    };
  } catch (error) {
    console.error('Error in getRevenueMetrics:', error);
    return {
      metrics: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get daily revenue metrics for a date range
 */
export async function getDailyRevenueMetrics(
  fromDate: Date,
  toDate: Date
): Promise<{ metrics: DailyRevenueMetrics[]; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('daily_revenue_metrics')
      .select('*')
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily revenue metrics:', error);
      return { metrics: [], error: error.message };
    }

    return { metrics: (data || []) as DailyRevenueMetrics[] };
  } catch (error) {
    console.error('Error in getDailyRevenueMetrics:', error);
    return {
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate revenue metrics from user data
 * Note: This is a placeholder. In production, this should integrate with Stripe or your payment provider
 */
export async function calculateRevenueMetrics(): Promise<RevenueMetrics> {
  // TODO: Integrate with Stripe API or subscription system
  // For now, return placeholder values
  return {
    mrr: 0,
    arr: 0,
    arpu: 0,
    ltv: 0,
    revenueByPlan: {},
    churnedRevenue: 0,
    newRevenue: 0,
    projectedRevenueGrowth: 0,
  };
}

