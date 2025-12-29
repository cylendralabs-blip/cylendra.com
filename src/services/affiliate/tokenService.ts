/**
 * Token Service
 *
 * Handles token rewards (Phase 11A)
 */

import { supabase } from '@/integrations/supabase/client';
import {
  TokenReward,
  TokenRewardStatus,
  TokenRewardType,
} from './types';

export interface TokenTotals {
  total: number;
  pending: number;
  allocated: number;
  vested: number;
  claimed: number;
  forfeited: number;
}

export interface TokenRewardOptions {
  affiliateId: string;
  tokenAmount: number;
  rewardType: TokenRewardType;
  status?: TokenRewardStatus;
  sourceId?: string;
  metadata?: Record<string, any>;
}

export function calculateTokenTotals(rewards: TokenReward[] = []): TokenTotals {
  return rewards.reduce(
    (totals, reward) => {
      totals.total += reward.token_amount;
      totals[reward.status as keyof TokenTotals] =
        (totals[reward.status as keyof TokenTotals] || 0) + reward.token_amount;
      return totals;
    },
    {
      total: 0,
      pending: 0,
      allocated: 0,
      vested: 0,
      claimed: 0,
      forfeited: 0,
    } satisfies TokenTotals
  );
}

export async function fetchTokenRewards(
  affiliateId: string,
  limit: number = 50
): Promise<TokenReward[]> {
  if (!affiliateId) return [];

  const { data, error } = await (supabase
    .from('token_rewards' as any)
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(limit) as unknown as {
    data: TokenReward[] | null;
    error: any;
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTokenBalanceSnapshot(affiliateId: string) {
  const rewards = await fetchTokenRewards(affiliateId, 200);
  const totals = calculateTokenTotals(rewards);

  return {
    totals,
    rewards,
  };
}

export async function awardTokenReward({
  affiliateId,
  tokenAmount,
  rewardType,
  status = 'allocated',
  sourceId,
  metadata = {},
}: TokenRewardOptions) {
  if (!affiliateId || tokenAmount <= 0) return;

  try {
    await supabase.from('token_rewards' as any).insert({
      affiliate_id: affiliateId,
      token_amount: tokenAmount,
      reward_type: rewardType,
      status,
      source_id: sourceId,
      metadata,
    });
  } catch (error) {
    console.error('Error awarding token reward:', error);
  }
}

export async function claimTokenReward(
  rewardId: string,
  affiliateId: string
): Promise<void> {
  if (!rewardId || !affiliateId) return;

  try {
    await supabase
      .from('token_rewards' as any)
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
      .eq('affiliate_id', affiliateId);
  } catch (error) {
    console.error('Error claiming token reward:', error);
  }
}

