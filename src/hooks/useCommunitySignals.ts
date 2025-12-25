/**
 * useCommunitySignals Hook
 * 
 * Phase X.12 - Community Signals System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CommunitySignal, SignalFilters } from '@/core/community/types';

/**
 * Fetch community signals
 */
async function fetchCommunitySignals(filters: SignalFilters = {}): Promise<CommunitySignal[]> {
  let query = supabase
    .from('community_signals' as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.symbol) {
    query = query.eq('symbol', filters.symbol);
  }

  if (filters.timeframe) {
    query = query.eq('timeframe', filters.timeframe);
  }

  if (filters.side) {
    query = query.eq('side', filters.side);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.verified_only) {
    // Get verified influencer IDs first
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

  if (filters.ai_verified) {
    query = query.eq('ai_assisted', true);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  // Sort
  if (filters.sort_by === 'votes') {
    query = query.order('total_votes', { ascending: false });
  } else if (filters.sort_by === 'reputation') {
    // Would need join with stats
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as CommunitySignal[];
}

/**
 * Hook to fetch community signals
 */
export function useCommunitySignals(filters: SignalFilters = {}) {
  const { user } = useAuth();

  return useQuery<CommunitySignal[], Error>({
    queryKey: ['community-signals', filters, user?.id],
    queryFn: () => fetchCommunitySignals(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to publish a new signal
 */
export function usePublishSignal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (signalData: {
      symbol: string;
      timeframe: string;
      side: 'BUY' | 'SELL';
      entry_price?: number;
      stop_loss?: number;
      take_profit?: number;
      confidence?: number;
      analysis_text?: string;
      source?: string;
      ai_assisted?: boolean;
      attachments?: any;
    }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('publish-community-signal', {
        body: signalData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-signals'] });
      queryClient.invalidateQueries({ queryKey: ['community-trader-stats'] });
    },
  });
}

/**
 * Hook to vote on a signal
 */
export function useVoteOnSignal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ signalId, vote }: { signalId: string; vote: 1 | -1 }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('vote-on-signal', {
        body: { signal_id: signalId, vote },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-signals'] });
      queryClient.invalidateQueries({ queryKey: ['community-trader-stats'] });
    },
  });
}

/**
 * Hook to close a signal
 */
export function useCloseSignal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      signalId,
      result,
      pnlPercentage,
    }: {
      signalId: string;
      result: 'WIN' | 'LOSS' | 'BREAKEVEN';
      pnlPercentage: number;
    }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('close-community-signal', {
        body: {
          signal_id: signalId,
          result,
          pnl_percentage: pnlPercentage,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-signals'] });
      queryClient.invalidateQueries({ queryKey: ['community-trader-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-signals'] });
    },
  });
}

