/**
 * Signal Generator
 * 
 * Generates signals from strategy execution
 * Phase 4: Strategy Engine
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// GeneratedSignal type definition (inlined for Edge Function)
export interface GeneratedSignal {
  user_id: string;
  source: string;
  symbol: string;
  side: 'buy' | 'sell';
  timeframe: string;
  price_at_signal: number;
  confidence: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  stop_loss_price?: number;
  take_profit_price?: number;
  reason?: string;
  meta?: any;
}

/**
 * Save signal to database
 */
export async function saveSignalToDatabase(
  supabaseClient: ReturnType<typeof createClient>,
  signal: GeneratedSignal,
  source: string = 'internal_engine'
): Promise<string | null> {
  try {
    // Map GeneratedSignal to database format
    const signalData = {
      user_id: signal.user_id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      signal_type: signal.side === 'buy' ? 'BUY' : 'SELL',
      signal_strength: getSignalStrength(signal.confidence),
      confidence_score: signal.confidence,
      entry_price: signal.price_at_signal,
      stop_loss_price: signal.stop_loss_price || null,
      take_profit_price: signal.take_profit_price || null,
      risk_reward_ratio: signal.stop_loss_price && signal.take_profit_price
        ? calculateRiskRewardRatio(
            signal.price_at_signal,
            signal.stop_loss_price,
            signal.take_profit_price,
            signal.side
          )
        : 2.0,
      strategy_name: signal.meta?.strategyName,
      alert_message: signal.reason || null,
      technical_indicators: signal.meta?.indicatorsSnapshot,
      market_conditions: {
        confidence: signal.confidence,
        riskLevel: signal.riskLevel,
        factors: signal.meta?.confidenceFactors,
        reasoning: signal.meta?.reasoning,
      },
      webhook_data: {
        source,
        strategyId: signal.meta?.strategyId,
        meta: signal.meta,
      },
      status: 'ACTIVE',
      execution_status: 'PENDING'
    };

    const { data, error } = await supabaseClient
      .from('tradingview_signals')
      .insert(signalData)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving signal to database:', error);
      // If table doesn't exist, log warning but don't fail completely
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('tradingview_signals table does not exist. Please run migration 20250626122717.');
      }
      return null;
    }

    // Try to mirror to trading_signals/enhanced tables (optional, don't fail if missing)
    try {
      await mirrorSignalToTradingSignals(supabaseClient, signal, signalData);
    } catch (mirrorError) {
      console.warn('Failed to mirror signal to trading_signals (non-critical):', mirrorError);
    }

    try {
      await mirrorSignalToEnhancedSignals(supabaseClient, signal, signalData);
    } catch (enhancedError) {
      console.warn('Failed to mirror signal to enhanced_trading_signals (non-critical):', enhancedError);
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in saveSignalToDatabase:', error);
    return null;
  }
}

/**
 * Get signal strength from confidence
 */
function getSignalStrength(confidence: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' | 'EXCEPTIONAL' {
  if (confidence >= 90) return 'EXCEPTIONAL';
  if (confidence >= 80) return 'VERY_STRONG';
  if (confidence >= 70) return 'STRONG';
  if (confidence >= 60) return 'MODERATE';
  return 'WEAK';
}

/**
 * Calculate risk/reward ratio
 */
function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    const risk = entryPrice - stopLoss;
    const reward = takeProfit - entryPrice;
    return risk > 0 ? reward / risk : 2.0;
  } else {
    const risk = stopLoss - entryPrice;
    const reward = entryPrice - takeProfit;
    return risk > 0 ? reward / risk : 2.0;
  }
}

/**
 * Check if signal already exists (prevent duplicates)
 */
export async function checkSignalExists(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  symbol: string,
  timeframe: string,
  side: 'buy' | 'sell',
  withinMinutes: number = 15
): Promise<boolean> {
  const since = new Date();
  since.setMinutes(since.getMinutes() - withinMinutes);

  const { data, error } = await supabaseClient
    .from('tradingview_signals')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .eq('signal_type', side === 'buy' ? 'BUY' : 'SELL')
    .eq('execution_status', 'PENDING')
    .gte('created_at', since.toISOString())
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking signal existence:', error);
    return false;
  }

  return !!data;
}

async function mirrorSignalToTradingSignals(
  supabaseClient: ReturnType<typeof createClient>,
  signal: GeneratedSignal,
  rawSignal: Record<string, unknown>
) {
  try {
    const confidenceFactors = signal.meta?.confidenceFactors || {};
    const confirmations = Object.keys(confidenceFactors || {}).filter(Boolean);

    const tradingSignalRecord = {
      user_id: signal.user_id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      signal_type: signal.side === 'buy' ? 'BUY' : 'SELL',
      signal_strength: getSignalStrength(signal.confidence),
      confidence_score: signal.confidence,
      entry_price: signal.price_at_signal,
      stop_loss_price: signal.stop_loss_price ?? null,
      take_profit_price: signal.take_profit_price ?? null,
      risk_reward_ratio: rawSignal.risk_reward_ratio ?? null,
      price_source: signal.meta?.priceSource ?? 'strategy_runner',
      live_price_timestamp: new Date().toISOString(),
      price_validation: {
        fetched_from: 'strategy-runner-worker',
        requested_exchange: signal.meta?.exchange ?? 'binance',
      },
      technical_analysis: signal.meta?.indicatorsSnapshot ?? {},
      volume_analysis: signal.meta?.volumeAnalysis ?? {},
      pattern_analysis: signal.meta?.patternAnalysis ?? {},
      ai_analysis: {
        prediction: signal.side === 'buy' ? 'BULLISH' : 'BEARISH',
        confidence: signal.confidence,
        reasoning: signal.reason,
      },
      sentiment_analysis: signal.meta?.sentimentAnalysis ?? {},
      confirmations,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      metadata: {
        strategy: rawSignal.strategy_name ?? 'Main Multi-Indicator Strategy',
        webhook: rawSignal.webhook_data,
      },
    };

    const { error } = await supabaseClient
      .from('trading_signals')
      .insert(tradingSignalRecord);

    if (error && error.code !== '42P01') {
      console.error('Failed to mirror signal into trading_signals:', error);
    } else if (error && error.code === '42P01') {
      console.warn(
        'trading_signals table is missing. Please run the corresponding migration script.'
      );
    }
  } catch (err) {
    console.error('Unexpected error while mirroring trading signal:', err);
  }
}

async function mirrorSignalToEnhancedSignals(
  supabaseClient: ReturnType<typeof createClient>,
  signal: GeneratedSignal,
  rawSignal: Record<string, unknown>
) {
  try {
    const confirmations = Object.keys(signal.meta?.confidenceFactors || {}).filter(Boolean);

    const enhancedRecord = {
      user_id: signal.user_id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      signal_type: signal.side === 'buy' ? 'BUY' : 'SELL',
      signal_strength: getSignalStrength(signal.confidence),
      confidence_score: signal.confidence,
      entry_price: signal.price_at_signal,
      stop_loss_price: signal.stop_loss_price ?? null,
      take_profit_price: signal.take_profit_price ?? null,
      risk_reward_ratio: rawSignal.risk_reward_ratio ?? 2.0,
      price_source: signal.meta?.priceSource ?? 'strategy_runner',
      price_timestamp: new Date().toISOString(),
      price_verified: true,
      technical_analysis: signal.meta?.indicatorsSnapshot ?? {},
      volume_analysis: signal.meta?.volumeAnalysis ?? {},
      market_sentiment: signal.meta?.sentimentAnalysis ?? {},
      confirmations,
      status: 'ACTIVE',
      result: null,
      profit_loss_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('enhanced_trading_signals')
      .insert(enhancedRecord);

    if (error && error.code !== '42P01') {
      console.error('Failed to mirror signal into enhanced_trading_signals:', error);
    } else if (error && error.code === '42P01') {
      console.warn('enhanced_trading_signals table is missing. Please run APPLY_ENHANCED_SIGNALS_TABLE.sql.');
    }
  } catch (err) {
    console.error('Unexpected error while mirroring enhanced trading signal:', err);
  }
}

