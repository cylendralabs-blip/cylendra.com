/**
 * Unified Symbol Signals Hook
 * 
 * Phase 2.1: Aggregate signals from multiple sources for a specific symbol
 * Combines AI signals, TradingView signals, and indicator-based signals
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Unified Signal Format
 */
export interface UnifiedSignal {
  id: string;
  source: 'ai' | 'tradingview' | 'indicator' | 'enhanced';
  symbol: string;
  timeframe: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  entryPrice: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  confidence: number;
  strength?: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' | 'EXCEPTIONAL';
  createdAt: string;
  metadata?: {
    strategyName?: string;
    riskLevel?: string;
    rrRatio?: number;
    technicalAnalysis?: any;
    [key: string]: any;
  };
}

/**
 * Normalize AI signal from ai_signals_history
 */
function normalizeAISignal(row: any): UnifiedSignal | null {
  if (!row || !row.side || row.side === 'WAIT') return null;

  return {
    id: row.id,
    source: 'ai',
    symbol: row.symbol,
    timeframe: row.timeframe,
    direction: row.side === 'BUY' ? 'BUY' : 'SELL',
    entryPrice: Number(row.entry_price || 0),
    stopLossPrice: row.stop_loss ? Number(row.stop_loss) : undefined,
    takeProfitPrice: row.take_profit ? Number(row.take_profit) : undefined,
    confidence: Number(row.final_confidence || 0),
    strength: mapConfidenceToStrength(Number(row.final_confidence || 0)),
    createdAt: row.created_at,
    metadata: {
      riskLevel: row.risk_level,
      rrRatio: row.rr_ratio ? Number(row.rr_ratio) : undefined,
      aiScore: row.ai_score ? Number(row.ai_score) : undefined,
      technicalScore: row.technical_score ? Number(row.technical_score) : undefined,
    }
  };
}

/**
 * Normalize TradingView signal
 */
function normalizeTradingViewSignal(row: any): UnifiedSignal | null {
  if (!row || !row.signal_type || row.status !== 'ACTIVE') return null;

  const direction = row.signal_type.includes('BUY') ? 'BUY' : 'SELL';

  return {
    id: row.id,
    source: 'tradingview',
    symbol: row.symbol,
    timeframe: row.timeframe,
    direction,
    entryPrice: Number(row.entry_price || 0),
    stopLossPrice: row.stop_loss_price ? Number(row.stop_loss_price) : undefined,
    takeProfitPrice: row.take_profit_price ? Number(row.take_profit_price) : undefined,
    confidence: Number(row.confidence_score || 0),
    strength: row.signal_strength,
    createdAt: row.created_at,
    metadata: {
      strategyName: row.strategy_name,
      riskRewardRatio: row.risk_reward_ratio ? Number(row.risk_reward_ratio) : undefined,
      technicalIndicators: row.technical_indicators,
      marketConditions: row.market_conditions,
    }
  };
}

/**
 * Normalize Enhanced Trading Signal
 */
function normalizeEnhancedSignal(row: any): UnifiedSignal | null {
  if (!row || !row.signal_type || row.status !== 'ACTIVE') return null;

  return {
    id: row.id,
    source: 'enhanced',
    symbol: row.symbol,
    timeframe: row.timeframe,
    direction: row.signal_type === 'BUY' ? 'BUY' : 'SELL',
    entryPrice: Number(row.entry_price || 0),
    stopLossPrice: row.stop_loss_price ? Number(row.stop_loss_price) : undefined,
    takeProfitPrice: row.take_profit_price ? Number(row.take_profit_price) : undefined,
    confidence: Number(row.confidence_score || 0),
    strength: row.signal_strength,
    createdAt: row.created_at,
    metadata: {
      riskRewardRatio: row.risk_reward_ratio ? Number(row.risk_reward_ratio) : undefined,
      technicalAnalysis: row.technical_analysis,
      volumeAnalysis: row.volume_analysis,
      patternAnalysis: row.pattern_analysis,
      aiAnalysis: row.ai_analysis,
      confirmations: row.confirmations || [],
    }
  };
}

/**
 * Map confidence score to strength
 */
function mapConfidenceToStrength(confidence: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' | 'EXCEPTIONAL' {
  if (confidence >= 90) return 'EXCEPTIONAL';
  if (confidence >= 80) return 'VERY_STRONG';
  if (confidence >= 70) return 'STRONG';
  if (confidence >= 60) return 'MODERATE';
  return 'WEAK';
}

/**
 * Convert symbol format (BTC/USDT -> BTCUSDT)
 */
function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase();
}

/**
 * Convert symbol format back (BTCUSDT -> BTC/USDT)
 */
function denormalizeSymbol(symbol: string): string {
  // Try to insert / before USDT, BUSD, etc.
  if (symbol.endsWith('USDT')) {
    return symbol.slice(0, -4) + '/USDT';
  }
  if (symbol.endsWith('BUSD')) {
    return symbol.slice(0, -4) + '/BUSD';
  }
  return symbol;
}

/**
 * Hook to fetch signals for a specific symbol
 */
export function useSymbolSignals(
  symbol: string,
  platform?: string,
  timeframe?: string,
  options?: {
    enabled?: boolean;
    maxSignals?: number;
    minConfidence?: number;
  }
) {
  const { user } = useAuth();
  const { enabled = true, maxSignals = 10, minConfidence = 50 } = options || {};

  return useQuery<{
    latestSignal: UnifiedSignal | null;
    recentSignals: UnifiedSignal[];
    isLoading: boolean;
    error: Error | null;
  }, Error>({
    queryKey: ['symbol-signals', symbol, platform, timeframe, user?.id],
    queryFn: async () => {
      if (!symbol) {
        return {
          latestSignal: null,
          recentSignals: [],
          isLoading: false,
          error: null
        };
      }

      const normalizedSymbol = normalizeSymbol(symbol);
      const allSignals: UnifiedSignal[] = [];

      try {
        // 1. Fetch AI signals from ai_signals_history
        const { data: aiSignals, error: aiError } = await supabase
          .from('ai_signals_history' as any)
          .select('*')
          .eq('symbol', normalizedSymbol)
          .gte('final_confidence', minConfidence)
          .order('created_at', { ascending: false })
          .limit(maxSignals);

        if (!aiError && aiSignals) {
          aiSignals.forEach(signal => {
            const normalized = normalizeAISignal(signal);
            if (normalized) allSignals.push(normalized);
          });
        }

        // 2. Fetch TradingView signals (only internal engine signals)
        const { data: tvSignals, error: tvError } = await supabase
          .from('tradingview_signals' as any)
          .select('*')
          .eq('symbol', normalizedSymbol)
          .eq('status', 'ACTIVE')
          .gte('confidence_score', minConfidence)
          // Filter only internal engine signals (not TradingView webhook signals)
          .eq('webhook_data->>source', 'internal_engine')
          .order('created_at', { ascending: false })
          .limit(maxSignals);

        if (!tvError && tvSignals) {
          tvSignals.forEach(signal => {
            const normalized = normalizeTradingViewSignal(signal);
            if (normalized) allSignals.push(normalized);
          });
        }

        // 3. Fetch Enhanced Trading Signals
        const { data: enhancedSignals, error: enhancedError } = await supabase
          .from('trading_signals' as any)
          .select('*')
          .eq('symbol', normalizedSymbol)
          .eq('status', 'ACTIVE')
          .gte('confidence_score', minConfidence)
          .order('created_at', { ascending: false })
          .limit(maxSignals);

        if (!enhancedError && enhancedSignals) {
          enhancedSignals.forEach(signal => {
            const normalized = normalizeEnhancedSignal(signal);
            if (normalized) allSignals.push(normalized);
          });
        }

        // Filter by timeframe if provided
        let filteredSignals = allSignals;
        if (timeframe) {
          filteredSignals = allSignals.filter(s => s.timeframe === timeframe);
        }

        // Sort by creation date (newest first)
        filteredSignals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Get latest signal (most recent)
        const latestSignal = filteredSignals.length > 0 ? filteredSignals[0] : null;

        // Get recent signals (limit to maxSignals)
        const recentSignals = filteredSignals.slice(0, maxSignals);

        return {
          latestSignal,
          recentSignals,
          isLoading: false,
          error: null
        };
      } catch (error) {
        console.error('Error fetching signals:', error);
        return {
          latestSignal: null,
          recentSignals: [],
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch signals')
        };
      }
    },
    enabled: enabled && !!symbol,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}

