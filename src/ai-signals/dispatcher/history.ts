/**
 * Signal History Storage
 * 
 * Saves long-term signals to database
 * 
 * Phase X.3: Real-Time Engine + Telegram + TTL
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltraSignal } from '../fusion/types';

/**
 * Save signal to history database
 */
export async function saveSignalToHistory(
  signal: UltraSignal,
  client: SupabaseClient = supabase
): Promise<boolean> {
  try {
    // Check if table exists (will be created via migration)
    // For now, we'll use a generic approach
    
    const signalData = {
      id: signal.id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      side: signal.side,
      final_confidence: signal.finalConfidence,
      risk_level: signal.riskLevel,
      entry_price: signal.entryPrice,
      stop_loss: signal.stopLoss,
      take_profit: signal.takeProfit,
      rr_ratio: signal.rrRatio,
      ai_score: signal.aiScore,
      technical_score: signal.technicalScore,
      volume_score: signal.volumeScore,
      pattern_score: signal.patternScore,
      wave_score: signal.waveScore,
      sentiment_score: signal.sentimentScore,
      sources_used: signal.sourcesUsed,
      created_at: signal.createdAt,
      // Additional fields for future tracking
      result: null, // Will be updated when trade closes
      profit_loss_percentage: null,
      closed_at: null
    };

    // Try to insert into ai_signals_history table
    // If table doesn't exist, we'll log a warning but not fail
    const { error } = await client
      .from('ai_signals_history' as any)
      .insert(signalData);

    if (error) {
      // Check if it's a "table doesn't exist" error
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('⚠️ ai_signals_history table does not exist. Please run migration to create it.');
        // In production, you might want to create the table automatically
        // For now, we'll just log and return false
        return false;
      }
      
      console.error('Error saving signal to history:', error);
      return false;
    }

    console.log(`💾 Signal saved to history: ${signal.symbol} ${signal.timeframe}`);
    return true;
  } catch (error) {
    console.error('Error in saveSignalToHistory:', error);
    return false;
  }
}

/**
 * Get signals from history
 */
export async function getSignalsFromHistory(filters: {
  symbol?: string;
  timeframe?: string;
  side?: 'BUY' | 'SELL' | 'WAIT';
  minConfidence?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {},
  client: SupabaseClient = supabase
): Promise<UltraSignal[]> {
  try {
    let query = client
      .from('ai_signals_history' as any)
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

    if (filters.minConfidence !== undefined) {
      query = query.gte('final_confidence', filters.minConfidence);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('⚠️ ai_signals_history table does not exist.');
        return [];
      }
      
      console.error('Error fetching signals from history:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Phase X.11: Fetch forecasts for signals
    const signalIds = data.map((row: any) => row.id);
    let forecastsMap: Record<string, any> = {};
    
    if (signalIds.length > 0) {
      try {
        const { data: forecasts } = await client
          .from('signal_forecasts' as any)
          .select('*')
          .in('signal_id', signalIds)
          .order('created_at', { ascending: false });
        
        if (forecasts) {
          // Group by signal_id, take the latest forecast for each signal
          forecastsMap = forecasts.reduce((acc: Record<string, any>, forecast: any) => {
            if (!acc[forecast.signal_id]) {
              acc[forecast.signal_id] = forecast;
            }
            return acc;
          }, {});
        }
      } catch (forecastError) {
        console.warn('Error fetching forecasts:', forecastError);
        // Continue without forecasts
      }
    }

    // Map database rows to UltraSignal format
    return data.map((row: any) => {
      const forecast = forecastsMap[row.id];
      
      return {
        id: row.id,
        symbol: row.symbol,
        timeframe: row.timeframe,
        side: row.side,
        finalConfidence: row.final_confidence,
        riskLevel: row.risk_level,
        entryPrice: row.entry_price,
        stopLoss: row.stop_loss,
        takeProfit: row.take_profit,
        rrRatio: row.rr_ratio,
        sourcesUsed: row.sources_used || [],
        aiScore: row.ai_score,
        technicalScore: row.technical_score,
        volumeScore: row.volume_score,
        patternScore: row.pattern_score,
        waveScore: row.wave_score,
        sentimentScore: row.sentiment_score,
        createdAt: row.created_at,
        // Phase X.11: Add forecast if available
        forecast: forecast ? {
          success_probability: forecast.success_probability,
          expected_return_pct: forecast.expected_return_pct,
          expected_holding_seconds: forecast.expected_holding_seconds,
          risk_adjusted_score: forecast.risk_adjusted_score,
          forecast_label: forecast.forecast_label,
          sample_size: forecast.metadata?.sample_size,
          confidence: forecast.metadata?.confidence,
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error in getSignalsFromHistory:', error);
    return [];
  }
}

/**
 * Get history statistics
 */
export async function getHistoryStats(filters: {
  symbol?: string;
  timeframe?: string;
  startDate?: string;
  endDate?: string;
} = {},
  client: SupabaseClient = supabase
): Promise<{
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  averageConfidence: number;
  averageRR: number;
  byTimeframe: Record<string, number>;
}> {
  try {
    const signals = await getSignalsFromHistory(filters, client);

    const buySignals = signals.filter(s => s.side === 'BUY').length;
    const sellSignals = signals.filter(s => s.side === 'SELL').length;
    
    const totalConfidence = signals.reduce((sum, s) => sum + s.finalConfidence, 0);
    const averageConfidence = signals.length > 0 ? totalConfidence / signals.length : 0;

    const signalsWithRR = signals.filter(s => s.rrRatio !== undefined && s.rrRatio !== null);
    const totalRR = signalsWithRR.reduce((sum, s) => sum + (s.rrRatio || 0), 0);
    const averageRR = signalsWithRR.length > 0 ? totalRR / signalsWithRR.length : 0;

    const byTimeframe: Record<string, number> = {};
    signals.forEach(signal => {
      byTimeframe[signal.timeframe] = (byTimeframe[signal.timeframe] || 0) + 1;
    });

    return {
      totalSignals: signals.length,
      buySignals,
      sellSignals,
      averageConfidence,
      averageRR,
      byTimeframe
    };
  } catch (error) {
    console.error('Error in getHistoryStats:', error);
    return {
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      averageConfidence: 0,
      averageRR: 0,
      byTimeframe: {}
    };
  }
}

