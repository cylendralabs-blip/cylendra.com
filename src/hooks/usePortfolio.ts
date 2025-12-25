/**
 * usePortfolio Hook
 * 
 * Phase X.13 - Portfolio Insights System
 * Phase X.17 - Multi-Exchange Portfolio Insights & Scope Selector
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PortfolioSnapshot, PortfolioRiskScore, PortfolioRecommendation, PortfolioForecast } from '@/core/portfolio/types';

/**
 * Portfolio Scope Type
 * Phase X.17 - Support for Global and Exchange-specific portfolio insights
 */
export type PortfolioScope =
  | { type: 'GLOBAL' }
  | { type: 'EXCHANGE'; apiKeyId: string };

/**
 * Helper function to build query key from scope
 */
function scopeKey(scope?: PortfolioScope): string {
  if (!scope || scope.type === 'GLOBAL') return 'GLOBAL';
  return `EXCHANGE:${scope.apiKeyId}`;
}

/**
 * Fetch latest portfolio snapshot
 * Phase X.17 - Support for scope (GLOBAL or EXCHANGE)
 */
export function usePortfolioSnapshot(scope?: PortfolioScope) {
  const { user } = useAuth();

  return useQuery<PortfolioSnapshot | null, Error>({
    queryKey: ['portfolio-snapshot', user?.id, scopeKey(scope)],
    queryFn: async () => {
      if (!user) return null;

      const query = supabase
        .from('portfolio_snapshots' as any)
        .select('*')
        .eq('user_id', user.id);

      // Apply scope filter
      if (!scope || scope.type === 'GLOBAL') {
        query.eq('scope_type', 'GLOBAL');
      } else {
        query
          .eq('scope_type', 'EXCHANGE')
          .eq('api_key_id', scope.apiKeyId);
      }

      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[usePortfolioSnapshot] Error fetching snapshot:', error);
        throw error;
      }
      
      if (!data) {
        console.log('[usePortfolioSnapshot] No snapshot found for scope:', scopeKey(scope));
        return null;
      }

      const row: any = data;
      console.log('[usePortfolioSnapshot] Snapshot found:', {
        id: row.id,
        scope_type: row.scope_type,
        api_key_id: row.api_key_id,
        platform: row.platform,
        total_equity: row.total_equity
      });

      // Map legacy schema to PortfolioSnapshot shape
      const metrics = row.metrics || {};

      const snapshot: PortfolioSnapshot = {
        id: row.id,
        user_id: row.user_id,
        total_balance: Number(metrics.total_balance ?? row.total_equity ?? 0),
        spot_balance: undefined,
        futures_positions: undefined,
        exposure: row.exposure || row.allocation || {},
        total_exposure: Number(metrics.total_exposure ?? 0),
        leverage_used: Number(metrics.leverage_used ?? 0),
        unrealized_pnl: Number(row.unrealized_pnl ?? 0),
        realized_pnl: Number(row.realized_pnl ?? 0),
        spot_value: Number(metrics.spot_value ?? row.spot_equity ?? 0),
        futures_value: Number(metrics.futures_value ?? row.futures_equity ?? 0),
        metadata: row.metadata || {},
        created_at: row.created_at || row.timestamp,
      };

      return snapshot;
    },
    enabled: !!user,
    staleTime: 0, // Always refetch when invalidated
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch portfolio history
 */
export function usePortfolioHistory(days: number = 30) {
  const { user } = useAuth();

  return useQuery<PortfolioSnapshot[], Error>({
    queryKey: ['portfolio-history', user?.id, days],
    queryFn: async () => {
      if (!user) return [];

      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('portfolio_snapshots' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return ((data || []) as any[]) as PortfolioSnapshot[];
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Fetch latest risk score
 * Phase X.17 - Support for scope and snapshot_id
 */
export function usePortfolioRiskScore(scope?: PortfolioScope, snapshotId?: string) {
  const { user } = useAuth();

  return useQuery<PortfolioRiskScore | null, Error>({
    queryKey: ['portfolio-risk-score', user?.id, scopeKey(scope), snapshotId],
    queryFn: async () => {
      if (!user) return null;

      const query = supabase
        .from('portfolio_risk_scores' as any)
        .select('*')
        .eq('user_id', user.id);

      // Filter by snapshot_id if provided
      if (snapshotId) {
        query.eq('snapshot_id', snapshotId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as any) as PortfolioRiskScore | null;
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

/**
 * Fetch recommendations
 * Phase X.17 - Support for scope and snapshot_id
 */
export function usePortfolioRecommendations(scope?: PortfolioScope, snapshotId?: string) {
  const { user } = useAuth();

  return useQuery<PortfolioRecommendation[], Error>({
    queryKey: ['portfolio-recommendations', user?.id, scopeKey(scope), snapshotId],
    queryFn: async () => {
      if (!user) return [];

      const query = supabase
        .from('portfolio_recommendations' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_applied', false);

      // Filter by snapshot_id if provided
      if (snapshotId) {
        query.eq('snapshot_id', snapshotId);
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return ((data || []) as any[]) as PortfolioRecommendation[];
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

/**
 * Fetch forecasts
 * Phase X.17 - Support for scope
 */
export function usePortfolioForecasts(scope?: PortfolioScope, period: '7d' | '30d' | '90d' = '7d') {
  const { user } = useAuth();

  return useQuery<PortfolioForecast | null, Error>({
    queryKey: ['portfolio-forecast', user?.id, scopeKey(scope), period],
    queryFn: async () => {
      if (!user) return null;

      const query = supabase
        .from('portfolio_forecasts' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('forecast_period', period);

      // Optionally filter by snapshot scope if needed
      // For now, we'll get the latest forecast for the period
      // The snapshot_id in forecasts links to the snapshot

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as any) as PortfolioForecast | null;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Sync portfolio
 */
export function useSyncPortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ exchange, apiKeyId }: { exchange: string; apiKeyId?: string }) => {
      if (!user) throw new Error('Authentication required');

      // Phase X.17: If apiKeyId provided, use it; otherwise find by platform
      let apiKeyRow: any;
      
      if (apiKeyId) {
        const { data, error: apiKeyError } = await supabase
          .from('api_keys' as any)
          .select('id, api_key, secret_key, platform')
          .eq('id', apiKeyId)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (apiKeyError) throw apiKeyError;
        if (!data) {
          throw new Error('لا يوجد مفتاح API مفعّل لهذه المنصة. يرجى إضافة/تفعيل المفتاح أولاً.');
        }
        apiKeyRow = data;
      } else {
        // Fallback: find by platform
        const { data, error: apiKeyError } = await supabase
          .from('api_keys' as any)
          .select('id, api_key, secret_key, platform')
          .eq('user_id', user.id)
          .eq('platform', exchange)
          .eq('is_active', true)
          .maybeSingle();

        if (apiKeyError) throw apiKeyError;
        if (!data) {
          throw new Error('لا يوجد مفتاح API مفعّل لهذه المنصة. يرجى إضافة/تفعيل المفتاح أولاً.');
        }
        apiKeyRow = data;
      }

      const { data: result, error } = await supabase.functions.invoke('portfolio-sync', {
        body: {
          exchange: apiKeyRow.platform || exchange,
          api_key: apiKeyRow.api_key,
          api_secret: apiKeyRow.secret_key,
          api_key_id: apiKeyRow.id, // Phase X.17: Pass api_key_id for scope
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch all portfolio-related queries
      queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['portfolio-history'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-risk-score'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-forecast'] });
      
      console.log('[useSyncPortfolio] Queries invalidated, refetching...');
    },
  });
}

/**
 * Analyze risk
 */
export function useAnalyzeRisk() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (snapshotId?: string) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('portfolio-risk-analyzer', {
        body: { snapshot_id: snapshotId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-risk-score'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-recommendations'] });
    },
  });
}

/**
 * Generate forecast
 */
export function useGenerateForecast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ snapshotId, period }: { snapshotId?: string; period?: '7d' | '30d' | '90d' }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('portfolio-forecast-engine', {
        body: { snapshot_id: snapshotId, period: period || '7d' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-forecast'] });
    },
  });
}

