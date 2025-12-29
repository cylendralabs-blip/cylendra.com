/**
 * Copy Trading Advanced Fee System
 * 
 * Phase X.17 - Fee System
 * 
 * Advanced fee calculation and settlement system
 */

import { supabase } from '@/integrations/supabase/client';

export type FeeModel = 'NONE' | 'PROFIT_SHARE' | 'SUBSCRIPTION' | 'PERFORMANCE_FEE';

export interface FeeCalculation {
  baseFee: number;
  performanceFee?: number;
  subscriptionFee?: number;
  totalFee: number;
  currency: string;
}

/**
 * Calculate fees for a strategy
 */
export async function calculateStrategyFees(
  strategyId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<FeeCalculation> {
  try {
    const { data: strategy } = await supabase
      .from('copy_strategies')
      .select('fee_model, profit_share_percent, monthly_fee')
      .eq('id', strategyId)
      .maybeSingle();

    if (!strategy || strategy.fee_model === 'NONE') {
      return {
        baseFee: 0,
        totalFee: 0,
        currency: 'USDT',
      };
    }

    let baseFee = 0;
    let performanceFee = 0;
    let subscriptionFee = 0;

    // Subscription fee
    if (strategy.fee_model === 'SUBSCRIPTION' && strategy.monthly_fee) {
      subscriptionFee = parseFloat(strategy.monthly_fee);
      baseFee = subscriptionFee;
    }

    // Profit share
    if (strategy.fee_model === 'PROFIT_SHARE' || strategy.fee_model === 'PERFORMANCE_FEE') {
      const profitSharePercent = parseFloat(strategy.profit_share_percent || '0');
      
      // Get period profits
      const periodStart = getPeriodStart(period);
      const { data: trades } = await supabase
        .from('copy_trades_log')
        .select('pnl_amount')
        .eq('strategy_id', strategyId)
        .gte('closed_at', periodStart)
        .not('pnl_amount', 'is', null);

      const totalProfit = trades?.reduce((sum, t) => {
        const pnl = parseFloat(t.pnl_amount || '0');
        return sum + (pnl > 0 ? pnl : 0);
      }, 0) || 0;

      performanceFee = (totalProfit * profitSharePercent) / 100;
      baseFee = performanceFee;
    }

    return {
      baseFee,
      performanceFee: performanceFee > 0 ? performanceFee : undefined,
      subscriptionFee: subscriptionFee > 0 ? subscriptionFee : undefined,
      totalFee: baseFee,
      currency: 'USDT',
    };
  } catch (error) {
    console.error('Error calculating fees:', error);
    return {
      baseFee: 0,
      totalFee: 0,
      currency: 'USDT',
    };
  }
}

/**
 * Calculate follower fees
 */
export async function calculateFollowerFees(
  followerId: string,
  strategyId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<FeeCalculation> {
  try {
    const { data: strategy } = await supabase
      .from('copy_strategies')
      .select('fee_model, profit_share_percent, monthly_fee')
      .eq('id', strategyId)
      .maybeSingle();

    if (!strategy || strategy.fee_model === 'NONE') {
      return {
        baseFee: 0,
        totalFee: 0,
        currency: 'USDT',
      };
    }

    let baseFee = 0;
    let performanceFee = 0;
    let subscriptionFee = 0;

    // Subscription fee
    if (strategy.fee_model === 'SUBSCRIPTION' && strategy.monthly_fee) {
      subscriptionFee = parseFloat(strategy.monthly_fee);
      baseFee = subscriptionFee;
    }

    // Profit share (only on follower's profits)
    if (strategy.fee_model === 'PROFIT_SHARE' || strategy.fee_model === 'PERFORMANCE_FEE') {
      const profitSharePercent = parseFloat(strategy.profit_share_percent || '0');
      
      const periodStart = getPeriodStart(period);
      const { data: trades } = await supabase
        .from('copy_trades_log')
        .select('pnl_amount')
        .eq('strategy_id', strategyId)
        .eq('follower_user_id', followerId)
        .gte('closed_at', periodStart)
        .not('pnl_amount', 'is', null);

      const totalProfit = trades?.reduce((sum, t) => {
        const pnl = parseFloat(t.pnl_amount || '0');
        return sum + (pnl > 0 ? pnl : 0);
      }, 0) || 0;

      performanceFee = (totalProfit * profitSharePercent) / 100;
      baseFee = performanceFee;
    }

    return {
      baseFee,
      performanceFee: performanceFee > 0 ? performanceFee : undefined,
      subscriptionFee: subscriptionFee > 0 ? subscriptionFee : undefined,
      totalFee: baseFee,
      currency: 'USDT',
    };
  } catch (error) {
    console.error('Error calculating follower fees:', error);
    return {
      baseFee: 0,
      totalFee: 0,
      currency: 'USDT',
    };
  }
}

/**
 * Settle fees
 */
export async function settleFees(
  strategyId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: strategy } = await supabase
      .from('copy_strategies')
      .select('owner_user_id, fee_model')
      .eq('id', strategyId)
      .maybeSingle();

    if (!strategy) {
      return { success: false, error: 'Strategy not found' };
    }

    // Get all active followers
    const { data: followers } = await supabase
      .from('copy_followers')
      .select('follower_user_id')
      .eq('strategy_id', strategyId)
      .eq('status', 'ACTIVE');

    if (!followers || followers.length === 0) {
      return { success: true };
    }

    // Calculate and settle fees for each follower
    for (const follower of followers) {
      const fees = await calculateFollowerFees(follower.follower_user_id, strategyId, period);

      if (fees.totalFee > 0) {
        // Create fee settlement record
        await supabase.from('copy_fee_settlements').insert({
          master_user_id: strategy.owner_user_id,
          follower_user_id: follower.follower_user_id,
          strategy_id: strategyId,
          period,
          fee_amount: fees.totalFee,
          fee_type: strategy.fee_model,
          status: 'PENDING',
        });
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date();
  switch (period) {
    case 'daily':
      now.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() - 1);
      break;
  }
  return now.toISOString();
}

