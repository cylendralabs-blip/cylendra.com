/**
 * Affiliate System Integration
 * 
 * Integrates affiliate system with existing bot/portfolio systems
 * Awards LP, updates weight, tracks activities
 * 
 * Phase 11A: Influence Economy - Task 8
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateLPEarned, applyTierMultiplier } from './lpService';
import { calculateInfluenceWeight } from './weightCalculator';
import { calculateCPAReward, calculateRevenueShare } from './referralService';
import { awardTokenReward } from './tokenService';
import { AffiliateTier } from './types';

const TOKEN_REWARD_RATES = {
  botActivation: 25,
  volumePerUsd: 0.02,
  cpaPerUsd: 0.2,
  revenueSharePerUsd: 0.1,
};

const TOKEN_TIER_MULTIPLIERS: Record<AffiliateTier, number> = {
  bronze: 1,
  silver: 1.1,
  gold: 1.25,
  platinum: 1.5,
  diamond: 2,
};

function applyTokenTierMultiplier(amount: number, tier: AffiliateTier): number {
  const multiplier = TOKEN_TIER_MULTIPLIERS[tier] ?? 1;
  return Math.round(amount * multiplier * 100) / 100;
}

const db = supabase as any;

/**
 * Award LP for bot activation
 */
export async function awardLPForBotActivation(
  userId: string,
  affiliateId?: string
): Promise<void> {
  if (!affiliateId) return;

  try {
    // Get affiliate tier
    const { data: affiliate } = await db
      .from('affiliates')
      .select('tier')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) return;

    // Calculate LP
    const baseLP = calculateLPEarned('bot_activity');
    const lpAmount = applyTierMultiplier(baseLP, affiliate.tier as any);

    // Record LP transaction
    await db.from('lp_transactions').insert({
      user_id: userId,
      affiliate_id: affiliateId,
      transaction_type: 'earn',
      lp_amount: lpAmount,
      source: 'bot_activity',
      balance_after: 0, // Would calculate from current balance
    });

    const tokenAmount = applyTokenTierMultiplier(
      TOKEN_REWARD_RATES.botActivation,
      affiliate.tier as AffiliateTier
    );

    await awardTokenReward({
      affiliateId,
      tokenAmount,
      rewardType: 'mission',
      metadata: {
        reason: 'bot_activation',
        userId,
      },
    });
  } catch (error) {
    console.error('Error awarding LP for bot activation:', error);
  }
}

/**
 * Award LP for trading volume
 */
export async function awardLPForVolume(
  userId: string,
  volumeUsd: number,
  affiliateId?: string
): Promise<void> {
  if (!affiliateId || volumeUsd <= 0) return;

  try {
    const { data: affiliate } = await db
      .from('affiliates')
      .select('tier')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) return;

    const baseLP = calculateLPEarned('volume', volumeUsd);
    const lpAmount = applyTierMultiplier(baseLP, affiliate.tier as any);

    await db.from('lp_transactions').insert({
      user_id: userId,
      affiliate_id: affiliateId,
      transaction_type: 'earn',
      lp_amount: lpAmount,
      source: 'volume',
      balance_after: 0,
    });

    const tokenAmount = applyTokenTierMultiplier(
      volumeUsd * TOKEN_REWARD_RATES.volumePerUsd,
      affiliate.tier as AffiliateTier
    );

    if (tokenAmount > 0) {
      await awardTokenReward({
        affiliateId,
        tokenAmount,
        rewardType: 'farming',
        metadata: {
          reason: 'trading_volume',
          volumeUsd,
          userId,
        },
      });
    }
  } catch (error) {
    console.error('Error awarding LP for volume:', error);
  }
}

/**
 * Process CPA reward when user becomes active
 */
export async function processCPAReward(
  affiliateUserId: string,
  userId: string
): Promise<void> {
  try {
    // Get affiliate user record
    const { data: affiliateUser, error: fetchError } = await db
      .from('affiliate_users')
      .select('*, affiliates(*)')
      .eq('id', affiliateUserId)
      .single();

    if (fetchError || !affiliateUser) return;

    const affiliate = affiliateUser.affiliates;
    if (!affiliate) return;

    // Calculate CPA
    const cpaAmount = calculateCPAReward(
      parseFloat(affiliate.cpa_rate_usd?.toString() || '0'),
      1.0, // User quality (would calculate from metrics)
      1.0  // Country multiplier (would get from user profile)
    );

    // Create reward
    await db.from('affiliate_rewards').insert({
      affiliate_id: affiliate.id,
      affiliate_user_id: affiliateUser.id,
      reward_type: 'cpa',
      amount_usd: cpaAmount,
      status: 'pending',
      description: 'CPA reward for active user',
    });

    // Update affiliate user
    await db
      .from('affiliate_users')
      .update({
        cpa_earned_usd: parseFloat(affiliateUser.cpa_earned_usd?.toString() || '0') + cpaAmount,
        status: 'active',
        is_active: true,
      })
      .eq('id', affiliateUserId);

    // Award LP
    const lpAmount = calculateLPEarned('referral');
    await db.from('lp_transactions').insert({
      user_id: userId,
      affiliate_id: affiliate.id,
      transaction_type: 'earn',
      lp_amount: lpAmount,
      source: 'referral',
      balance_after: 0,
    });

    const tokenAmount = applyTokenTierMultiplier(
      cpaAmount * TOKEN_REWARD_RATES.cpaPerUsd,
      affiliate.tier as AffiliateTier
    );

    if (tokenAmount > 0) {
      await awardTokenReward({
        affiliateId: affiliate.id,
        tokenAmount,
        rewardType: 'airdrop',
        metadata: {
          reason: 'cpa_reward',
          userId,
          affiliateUserId,
          cpaAmount,
        },
      });
    }
  } catch (error) {
    console.error('Error processing CPA reward:', error);
  }
}

/**
 * Process Revenue Share for subscription
 */
export async function processRevenueShare(
  affiliateUserId: string,
  subscriptionAmount: number,
  period: 'monthly' | 'yearly'
): Promise<void> {
  try {
    const { data: affiliateUser, error: fetchError } = await db
      .from('affiliate_users')
      .select('*, affiliates(*)')
      .eq('id', affiliateUserId)
      .single();

    if (fetchError || !affiliateUser) return;

    const affiliate = affiliateUser.affiliates;
    if (!affiliate) return;

    const revenueShare = calculateRevenueShare(
      subscriptionAmount,
      parseFloat(affiliate.revenue_share_pct?.toString() || '0')
    );

    // Create reward
    await db.from('affiliate_rewards').insert({
      affiliate_id: affiliate.id,
      affiliate_user_id: affiliateUser.id,
      reward_type: 'revenue_share',
      amount_usd: revenueShare,
      status: 'pending',
      description: `Revenue share for ${period} subscription`,
    });

    // Update affiliate user
    await db
      .from('affiliate_users')
      .update({
        revenue_share_earned_usd:
          parseFloat(affiliateUser.revenue_share_earned_usd?.toString() || '0') + revenueShare,
      })
      .eq('id', affiliateUserId);

    const tokenAmount = applyTokenTierMultiplier(
      revenueShare * TOKEN_REWARD_RATES.revenueSharePerUsd,
      affiliate.tier as AffiliateTier
    );

    if (tokenAmount > 0) {
      await awardTokenReward({
        affiliateId: affiliate.id,
        tokenAmount,
        rewardType: 'staking',
        metadata: {
          reason: 'revenue_share',
          affiliateUserId,
          subscriptionAmount,
          period,
        },
      });
    }
  } catch (error) {
    console.error('Error processing revenue share:', error);
  }
}

/**
 * Update affiliate weight
 */
export async function updateAffiliateWeight(affiliateId: string): Promise<void> {
  try {
    // Get affiliate stats
    const { data: referrals } = await db
      .from('affiliate_users')
      .select('*')
      .eq('affiliate_id', affiliateId);

    const activeUsers = referrals?.filter(r => r.is_active).length || 0;
    const registeredUsers = referrals?.length || 0;
    const botActiveUsers = referrals?.filter(r => r.bot_activated).length || 0;
    const totalVolume = referrals?.reduce(
      (sum, r) => sum + parseFloat(r.total_volume_usd?.toString() || '0'),
      0
    ) || 0;
    const backtestUsers = referrals?.filter(r => (r.backtest_count || 0) > 0).length || 0;

    // Calculate new weight
    const newWeight = calculateInfluenceWeight({
      activeUsers,
      registeredUsers,
      botActiveUsers,
      totalVolumeUsd: totalVolume,
      backtestUsers,
    });

    // Get current weight
    const { data: affiliate } = await db
      .from('affiliates')
      .select('influence_weight')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) return;

    const oldWeight = parseFloat(affiliate.influence_weight?.toString() || '0');

    // Update weight
    await db
      .from('affiliates')
      .update({
        influence_weight: newWeight,
        total_referrals: registeredUsers,
        active_referrals: activeUsers,
      })
      .eq('id', affiliateId);

    // Record weight change
    if (oldWeight !== newWeight) {
      await db.from('weight_history').insert({
        affiliate_id: affiliateId,
        weight_before: oldWeight,
        weight_after: newWeight,
        weight_change: newWeight - oldWeight,
        change_reason: 'Automatic update from activity',
        change_source: 'activity',
      });
    }
  } catch (error) {
    console.error('Error updating affiliate weight:', error);
  }
}

