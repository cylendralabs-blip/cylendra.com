/**
 * Hook for Advanced Indicator Analytics
 * 
 * Phase X.7 - Advanced Indicator Analytics Tab
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IndicatorAnalyticsFilters {
  symbol?: string;
  timeframe?: string;
  period?: '24h' | '7d' | '30d' | '90d';
  limit?: number;
}

export interface IndicatorSummary {
  avg_ai_score: number;
  avg_technical_score: number;
  avg_volume_score: number;
  avg_pattern_score: number;
  avg_wave_score: number;
  avg_sentiment_score: number;
  avg_confidence: number;
  count_signals: number;
  count_strong: number;
  count_medium: number;
  count_weak: number;
}

export interface SignalAnalyticsRow {
  id: string;
  symbol: string;
  timeframe: string;
  side: string;
  final_confidence: number;
  ai_score: number;
  technical_score: number;
  volume_score: number;
  pattern_score: number;
  wave_score: number;
  sentiment_score: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  profit_loss_percentage: number | null;
  result: string | null;
  created_at: string;
  metadata: any;
}

export interface IndicatorAnalyticsData {
  summary: IndicatorSummary;
  signals: SignalAnalyticsRow[];
}

/**
 * Fetch indicator analytics data from Edge Function
 */
async function fetchIndicatorAnalytics(
  filters: IndicatorAnalyticsFilters
): Promise<IndicatorAnalyticsData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const params = new URLSearchParams();
  if (filters.symbol) params.append('symbol', filters.symbol);
  if (filters.timeframe) params.append('timeframe', filters.timeframe);
  if (filters.period) params.append('period', filters.period);
  if (filters.limit) params.append('limit', filters.limit.toString());

  const url = `${supabaseUrl}/functions/v1/ai-indicator-analytics?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch indicator analytics: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  return result.data;
}

/**
 * Hook for advanced indicator analytics
 */
export function useAdvancedIndicatorAnalytics(filters: IndicatorAnalyticsFilters) {
  return useQuery<IndicatorAnalyticsData, Error>({
    queryKey: ['indicator-analytics', filters],
    queryFn: () => fetchIndicatorAnalytics(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false
  });
}

