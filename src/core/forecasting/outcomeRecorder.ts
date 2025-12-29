/**
 * Outcome Recorder
 * 
 * Phase X.11 - AI Trade Forecasting Engine
 * 
 * Records signal outcomes when trades are closed
 */

import { supabase } from '@/integrations/supabase/client';
import type { SignalOutcome } from './types';

/**
 * Record signal outcome when trade is closed
 */
export async function recordSignalOutcome(params: {
  tradeId: string;
  signalId?: string;
  userId?: string;
  symbol: string;
  timeframe: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  enteredAt: string;
  exitedAt: string;
  profitLossPercentage: number;
  signalSource?: string;
  maxFavorableExcursion?: number;
  maxAdverseExcursion?: number;
}): Promise<boolean> {
  try {
    // Fetch original signal data if signalId is provided
    let signalData: any = null;
    
    if (params.signalId) {
      // Try ai_signals_history first
      const { data: aiSignal } = await supabase
        .from('ai_signals_history' as any)
        .select('*')
        .eq('id', params.signalId)
        .maybeSingle();

      if (aiSignal) {
        signalData = aiSignal;
      } else {
        // Try trading_signals as fallback
        const { data: tradingSignal } = await supabase
          .from('trading_signals' as any)
          .select('*')
          .eq('id', params.signalId)
          .maybeSingle();

        if (tradingSignal) {
          signalData = tradingSignal;
        }
      }
    }

    // Calculate holding duration
    const enteredAt = new Date(params.enteredAt);
    const exitedAt = new Date(params.exitedAt);
    const holdingDurationSeconds = Math.round((exitedAt.getTime() - enteredAt.getTime()) / 1000);

    // Determine result label
    let resultLabel: 'WIN' | 'LOSS' | 'BREAKEVEN';
    if (Math.abs(params.profitLossPercentage) < 0.1) {
      resultLabel = 'BREAKEVEN';
    } else if (params.profitLossPercentage > 0) {
      resultLabel = 'WIN';
    } else {
      resultLabel = 'LOSS';
    }

    // Prepare outcome data
    const outcomeData: Partial<SignalOutcome> = {
      signal_id: params.signalId || null,
      user_id: params.userId || null,
      symbol: params.symbol,
      timeframe: params.timeframe,
      side: params.side,
      entered_at: params.enteredAt,
      exited_at: params.exitedAt,
      holding_duration_seconds: holdingDurationSeconds,
      entry_price: params.entryPrice,
      exit_price: params.exitPrice,
      profit_loss_percentage: params.profitLossPercentage,
      result_label: resultLabel,
      signal_source: params.signalSource || 'unknown',
      max_favorable_excursion: params.maxFavorableExcursion || null,
      max_adverse_excursion: params.maxAdverseExcursion || null,
    };

    // Add signal scores if available
    if (signalData) {
      outcomeData.ai_score = signalData.ai_score || signalData.final_confidence || null;
      outcomeData.technical_score = signalData.technical_score || null;
      outcomeData.volume_score = signalData.volume_score || null;
      outcomeData.pattern_score = signalData.pattern_score || null;
      outcomeData.wave_score = signalData.wave_score || null;
      outcomeData.sentiment_score = signalData.sentiment_score || null;
      outcomeData.risk_level = signalData.risk_level || signalData.riskLevel || null;
    }

    // Insert into signal_outcomes
    const { error } = await supabase
      .from('signal_outcomes' as any)
      .insert(outcomeData);

    if (error) {
      console.error('Error recording signal outcome:', error);
      return false;
    }

    console.log('✅ Signal outcome recorded:', {
      symbol: params.symbol,
      side: params.side,
      result: resultLabel,
      pnl: params.profitLossPercentage,
    });

    return true;
  } catch (error) {
    console.error('Error in recordSignalOutcome:', error);
    return false;
  }
}

/**
 * Record outcome from trade data
 */
export async function recordOutcomeFromTrade(trade: {
  id: string;
  signal_id?: string;
  user_id?: string;
  symbol: string;
  timeframe?: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  exit_price?: number;
  opened_at: string;
  closed_at?: string;
  profit_loss_percentage?: number;
  signal_source?: string;
}): Promise<boolean> {
  if (!trade.closed_at || !trade.exit_price || trade.profit_loss_percentage === undefined) {
    console.warn('Trade not closed yet, skipping outcome recording');
    return false;
  }

  return recordSignalOutcome({
    tradeId: trade.id,
    signalId: trade.signal_id,
    userId: trade.user_id,
    symbol: trade.symbol,
    timeframe: trade.timeframe || '1h',
    side: trade.side,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price,
    enteredAt: trade.opened_at,
    exitedAt: trade.closed_at,
    profitLossPercentage: trade.profit_loss_percentage,
    signalSource: trade.signal_source,
  });
}

