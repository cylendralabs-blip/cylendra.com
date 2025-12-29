/**
 * useTraderRanking Hook
 * 
 * Phase X.12 - Community Signals System
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityTraderStats, RankingFilters } from '@/core/community/types';

/**
 * Fetch trader rankings
 */
async function fetchTraderRankings(filters: RankingFilters = {}): Promise<CommunityTraderStats[]> {
  let query = supabase
    .from('community_trader_stats' as any)
    .select('*')
    .order('reputation_score', { ascending: false });

  if (filters.rank) {
    query = query.eq('rank', filters.rank);
  }

  if (filters.min_reputation) {
    query = query.gte('reputation_score', filters.min_reputation);
  }

  if (filters.min_win_rate) {
    query = query.gte('win_rate', filters.min_win_rate);
  }

  if (filters.influencer_only) {
    // Join with verified_influencers
    const { data: influencers } = await supabase
      .from('verified_influencers' as any)
      .select('user_id')
      .eq('is_active', true);

    const influencerIds = influencers?.map((i: any) => i.user_id) || [];
    if (influencerIds.length > 0) {
      query = query.in('user_id', influencerIds);
    } else {
      // No influencers, return empty
      return [];
    }
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as CommunityTraderStats[];
}

/**
 * Hook to fetch trader rankings
 */
export function useTraderRanking(filters: RankingFilters = {}) {
  return useQuery<CommunityTraderStats[], Error>({
    queryKey: ['trader-rankings', filters],
    queryFn: () => fetchTraderRankings(filters),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch user's own stats
 */
export function useMyTraderStats(userId?: string) {
  return useQuery<CommunityTraderStats | null, Error>({
    queryKey: ['my-trader-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('community_trader_stats' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as CommunityTraderStats | null;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

