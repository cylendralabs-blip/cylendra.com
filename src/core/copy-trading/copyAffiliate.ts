/**
 * Copy Trading Affiliate Integration
 * 
 * Phase X.17 - Affiliate Integration
 * 
 * Affiliate system for copy trading strategies
 */

import { supabase } from '@/integrations/supabase/client';

export interface AffiliateReward {
  strategyId: string;
  referrerId: string;
  referredId: string;
  rewardType: 'FOLLOW' | 'DEPOSIT' | 'TRADE';
  rewardAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

/**
 * Track affiliate referral
 */
export async function trackAffiliateReferral(
  strategyId: string,
  referrerId: string,
  referredId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if referral already exists
    const { data: existing } = await (supabase as any)
      .from('affiliate_referrals')
      .select('id')
      .eq('strategy_id', strategyId)
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .maybeSingle();

    if (existing) {
      return { success: true };
    }

    // Create referral record
    const { error } = await (supabase as any).from('affiliate_referrals').insert({
      strategy_id: strategyId,
      referrer_id: referrerId,
      referred_id: referredId,
      status: 'ACTIVE',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate affiliate rewards
 */
export async function calculateAffiliateRewards(
  strategyId: string,
  referrerId: string
): Promise<{ totalRewards: number; pendingRewards: number }> {
  try {
    const { data: referrals } = await (supabase as any)
      .from('affiliate_referrals')
      .select('*, copy_followers(status)')
      .eq('strategy_id', strategyId)
      .eq('referrer_id', referrerId);

    if (!referrals || referrals.length === 0) {
      return { totalRewards: 0, pendingRewards: 0 };
    }

    // Get strategy affiliate settings
    const { data: strategy } = await (supabase as any)
      .from('copy_strategies')
      .select('affiliate_follow_reward, affiliate_deposit_reward, affiliate_trade_reward')
      .eq('id', strategyId)
      .maybeSingle();

    if (!strategy) {
      return { totalRewards: 0, pendingRewards: 0 };
    }

    let totalRewards = 0;
    let pendingRewards = 0;

    for (const referral of referrals as any[]) {
      const referralData = referral as { referred_id?: string; copy_followers?: { status?: string } | null };
      
      // Follow reward
      if (referralData.copy_followers && (referralData.copy_followers as any).status === 'ACTIVE') {
        const followReward = parseFloat((strategy as any)?.affiliate_follow_reward || '0');
        totalRewards += followReward;
        pendingRewards += followReward;
      }

      // Deposit reward - calculate based on follower's total deposits
      const depositRewardPercent = parseFloat((strategy as any)?.affiliate_deposit_reward || '0');
      if (depositRewardPercent > 0 && referralData.referred_id) {
        // Get follower's total equity/deposits (simplified - in production, track actual deposits)
        const { data: balances } = await (supabase as any)
          .from('portfolio_balances')
          .select('total_balance')
          .eq('user_id', referralData.referred_id)
          .single();
        
        if (balances?.total_balance) {
          const depositAmount = parseFloat(balances.total_balance.toString());
          const depositReward = (depositAmount * depositRewardPercent) / 100;
          totalRewards += depositReward;
          pendingRewards += depositReward;
        }
      }

      // Trade reward - calculate based on follower's trading volume
      const tradeRewardPercent = parseFloat((strategy as any)?.affiliate_trade_reward || '0');
      if (tradeRewardPercent > 0 && referralData.referred_id) {
        // Get follower's total trading volume from copy trades
        const { data: trades } = await (supabase as any)
          .from('copy_trades_log')
          .select('follower_position_size')
          .eq('follower_user_id', referralData.referred_id)
          .eq('strategy_id', strategyId)
          .eq('status', 'EXECUTED');
        
        if (trades && trades.length > 0) {
          const totalVolume = trades.reduce((sum: number, trade: any) => {
            return sum + parseFloat(trade.follower_position_size?.toString() || '0');
          }, 0);
          
          const tradeReward = (totalVolume * tradeRewardPercent) / 100;
          totalRewards += tradeReward;
          pendingRewards += tradeReward;
        }
      }
    }

    return { totalRewards, pendingRewards };
  } catch (error) {
    console.error('Error calculating affiliate rewards:', error);
    return { totalRewards: 0, pendingRewards: 0 };
  }
}

/**
 * Get affiliate link
 */
export async function getAffiliateLink(
  strategyId: string
): Promise<{ link: string; code: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Generate or get existing affiliate code
    const code = `COPY-${strategyId.substring(0, 8).toUpperCase()}-${user.id.substring(0, 8).toUpperCase()}`;
    const link = `${window.location.origin}/dashboard/copy-strategy/${strategyId}?ref=${code}`;

    return { link, code };
  } catch (error) {
    throw error;
  }
}

