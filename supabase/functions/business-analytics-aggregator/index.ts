/**
 * Business Analytics Aggregator
 * 
 * Phase Admin C: Daily cron job to aggregate business metrics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('business-analytics-aggregator');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    logger.info('Starting business analytics aggregation', { date: todayStr });

    // ============================================
    // 1. AGGREGATE DAILY USER METRICS
    // ============================================
    logger.info('Aggregating daily user metrics...');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users
    const { count: activeUsers24h } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', yesterday.toISOString());

    const { count: activeUsers7d } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', last7Days.toISOString());

    const { count: activeUsers30d } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', last30Days.toISOString());

    // Get new users today
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().split('T')[0] + 'T00:00:00Z')
      .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z');

    // Get users by plan (placeholder - would need subscription data)
    const usersByPlan: Record<string, number> = {
      free: totalUsers || 0,
      pro: 0,
      vip: 0,
      institutional: 0,
    };

    // ============================================
    // CALCULATE RETENTION RATES
    // ============================================
    logger.info('Calculating retention rates...');
    
    // Get all users with their signup dates
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, created_at, updated_at');
    
    // Calculate 7-day retention
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const usersSignedUp7DaysAgo = (allUsers || []).filter((u: any) => {
      const signupDate = new Date(u.created_at);
      return signupDate <= sevenDaysAgo && signupDate > new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    });
    const activeUsers7DaysAgo = usersSignedUp7DaysAgo.filter((u: any) => {
      const lastActivity = new Date(u.updated_at || u.created_at);
      return lastActivity >= sevenDaysAgo;
    });
    const retentionRate7d = usersSignedUp7DaysAgo.length > 0
      ? (activeUsers7DaysAgo.length / usersSignedUp7DaysAgo.length) * 100
      : 0;
    
    // Calculate 30-day retention
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersSignedUp30DaysAgo = (allUsers || []).filter((u: any) => {
      const signupDate = new Date(u.created_at);
      return signupDate <= thirtyDaysAgo && signupDate > new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
    });
    const activeUsers30DaysAgo = usersSignedUp30DaysAgo.filter((u: any) => {
      const lastActivity = new Date(u.updated_at || u.created_at);
      return lastActivity >= thirtyDaysAgo;
    });
    const retentionRate30d = usersSignedUp30DaysAgo.length > 0
      ? (activeUsers30DaysAgo.length / usersSignedUp30DaysAgo.length) * 100
      : 0;
    
    // Calculate churn rate (users who haven't been active in last 30 days)
    const churnedUsers = (allUsers || []).filter((u: any) => {
      const lastActivity = new Date(u.updated_at || u.created_at);
      const daysSinceActivity = (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity > 30 && daysSinceActivity <= 60; // Churned in last 30 days
    });
    const churnRate = totalUsers > 0
      ? (churnedUsers.length / totalUsers) * 100
      : 0;
    
    // Calculate conversion rate (placeholder - would need subscription data)
    const conversionRateFreeToPaid = 0; // TODO: Calculate from subscription data

    // Upsert daily user metrics
    const { error: userMetricsError } = await supabase
      .from('daily_user_metrics')
      .upsert({
        date: todayStr,
        total_users: totalUsers || 0,
        active_users_24h: activeUsers24h || 0,
        active_users_7d: activeUsers7d || 0,
        active_users_30d: activeUsers30d || 0,
        new_users: newUsers || 0,
        users_by_plan: usersByPlan,
        retention_rate_7d: retentionRate7d,
        retention_rate_30d: retentionRate30d,
        churn_rate: churnRate,
        conversion_rate_free_to_paid: conversionRateFreeToPaid,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date',
      });

    if (userMetricsError) {
      logger.error('Error upserting daily user metrics', userMetricsError);
    } else {
      logger.info('Daily user metrics aggregated successfully');
    }

    // ============================================
    // 2. AGGREGATE DAILY REVENUE METRICS
    // ============================================
    logger.info('Aggregating daily revenue metrics...');

    // TODO: Calculate from Stripe or subscription system
    const mrr = 0;
    const arr = mrr * 12;
    const arpu = 0; // Would need revenue and user count
    const ltv = 0; // Would need historical data
    const revenueByPlan: Record<string, number> = {};
    const churnedRevenue = 0;
    const newRevenue = 0;

    // Upsert daily revenue metrics
    const { error: revenueMetricsError } = await supabase
      .from('daily_revenue_metrics')
      .upsert({
        date: todayStr,
        mrr,
        arr,
        arpu,
        ltv,
        revenue_by_plan: revenueByPlan,
        churned_revenue: churnedRevenue,
        new_revenue: newRevenue,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date',
      });

    if (revenueMetricsError) {
      logger.error('Error upserting daily revenue metrics', revenueMetricsError);
    } else {
      logger.info('Daily revenue metrics aggregated successfully');
    }

    // ============================================
    // 3. AGGREGATE FEATURE USAGE DAILY
    // ============================================
    logger.info('Aggregating feature usage...');

    // Get all feature usage logs from today
    const { data: featureLogs } = await supabase
      .from('feature_usage_logs')
      .select('*')
      .gte('last_used_at', today.toISOString().split('T')[0] + 'T00:00:00Z')
      .lt('last_used_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z');

    // Group by feature
    const featureMap = new Map<string, { total: number; users: Set<string> }>();

    (featureLogs || []).forEach((log: any) => {
      const existing = featureMap.get(log.feature_key);
      if (existing) {
        existing.total += log.usage_count || 1;
        existing.users.add(log.user_id);
      } else {
        featureMap.set(log.feature_key, {
          total: log.usage_count || 1,
          users: new Set([log.user_id]),
        });
      }
    });

    // Upsert daily feature usage
    for (const [featureKey, data] of featureMap.entries()) {
      const { error: featureError } = await supabase
        .from('feature_usage_daily')
        .upsert({
          date: todayStr,
          feature_key: featureKey,
          total_usage_count: data.total,
          unique_users_count: data.users.size,
          usage_by_plan: {}, // TODO: Calculate from user plans
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'date,feature_key',
        });

      if (featureError) {
        logger.error(`Error upserting feature usage for ${featureKey}`, featureError);
      }
    }

    logger.info('Feature usage aggregated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business analytics aggregated successfully',
        date: todayStr,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    logger.error('Error in business analytics aggregator', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

