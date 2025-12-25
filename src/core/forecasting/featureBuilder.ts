/**
 * Feature Builder
 * 
 * Phase X.11 - AI Trade Forecasting Engine
 * 
 * Converts signal data + market intelligence into feature vectors
 */

import { supabase } from '@/integrations/supabase/client';
import type { SignalFeatures } from './types';

/**
 * Convert risk level to numeric value
 */
function riskLevelToNumeric(riskLevel?: string | null): number {
  switch (riskLevel) {
    case 'LOW':
      return 1;
    case 'MEDIUM':
      return 2;
    case 'HIGH':
      return 3;
    case 'EXTREME':
      return 4;
    default:
      return 2; // Default to MEDIUM
  }
}

/**
 * Convert timeframe to bucket number
 */
function timeframeToBucket(timeframe: string): number {
  const tfMap: Record<string, number> = {
    '1m': 1,
    '3m': 1.5,
    '5m': 2,
    '15m': 3,
    '30m': 3.5,
    '1h': 4,
    '4h': 5,
    '1d': 6,
  };
  return tfMap[timeframe.toLowerCase()] || 3;
}

/**
 * Normalize symbol to category
 */
function getSymbolCategory(symbol: string): string {
  const major = ['BTC', 'ETH', 'BNB'];
  const symbolBase = symbol.split('/')[0] || symbol;
  
  if (major.includes(symbolBase)) {
    return 'major';
  }
  
  // Could add more categories based on market cap, volatility, etc.
  return 'alt';
}

/**
 * Build features for a signal from database
 */
export async function buildFeaturesForSignal(signalId: string): Promise<SignalFeatures | null> {
  try {
      // Fetch signal data from ai_signals_history
      const { data: signal, error: signalError } = await supabase
        .from('ai_signals_history' as any)
        .select('*')
        .eq('id', signalId)
        .maybeSingle();

    if (signalError || !signal) {
      console.warn('Signal not found in ai_signals_history, trying trading_signals...');
      
        // Try trading_signals as fallback
        const { data: tradingSignal } = await supabase
          .from('trading_signals' as any)
          .select('*')
          .eq('id', signalId)
          .maybeSingle();
      
      if (!tradingSignal) {
        return null;
      }
      
      // Build features from trading_signals (limited data)
      const tradingSignalData = tradingSignal as any;
      return {
        ai_score: tradingSignalData?.confidence_score || 50,
        technical_score: 50,
        volume_score: 50,
        pattern_score: 50,
        wave_score: 50,
        sentiment_score: 50,
        risk_level_numeric: riskLevelToNumeric(tradingSignalData?.risk_level),
        volatility_score: 50,
        activity_score: 50,
        funding_rate: 0,
        market_sentiment_value: 50,
        timeframe_bucket: timeframeToBucket(tradingSignalData?.timeframe || '1h'),
        symbol_category: getSymbolCategory(tradingSignalData?.symbol || 'BTC/USDT'),
      };
    }

    // Build features from ai_signals_history
    const signalData = signal as any;
    const symbol = signalData.symbol || 'BTC/USDT';
    const timeframe = signalData.timeframe || '1h';

    // Fetch market intelligence data in parallel
    const [riskProfile, heatmap, fundingRate, sentiment] = await Promise.all([
      // Asset risk profile
      supabase
        .from('asset_risk_profiles' as any)
        .select('volatility_score, liquidity_score')
        .eq('symbol', symbol)
        .maybeSingle(),
      
      // Market heatmap metrics
      supabase
        .from('market_heatmap_metrics' as any)
        .select('volatility_score, activity_score')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Funding rate
      supabase
        .from('funding_rates' as any)
        .select('funding_rate')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Market sentiment
      supabase
        .from('market_sentiment_snapshots' as any)
        .select('value')
        .eq('source', 'fear_greed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      ai_score: signalData.ai_score || 0,
      technical_score: signalData.technical_score || 0,
      volume_score: signalData.volume_score || 0,
      pattern_score: signalData.pattern_score || 0,
      wave_score: signalData.wave_score || 0,
      sentiment_score: signalData.sentiment_score || 0,
      risk_level_numeric: riskLevelToNumeric(signalData.risk_level),
      volatility_score: (heatmap?.data as any)?.[0]?.volatility_score || (riskProfile?.data as any)?.volatility_score || 50,
      activity_score: (heatmap?.data as any)?.[0]?.activity_score || 50,
      funding_rate: (fundingRate?.data as any)?.[0]?.funding_rate || 0,
      market_sentiment_value: (sentiment?.data as any)?.[0]?.value || 50,
      timeframe_bucket: timeframeToBucket(timeframe),
      symbol_category: getSymbolCategory(symbol),
    };
  } catch (error) {
    console.error('Error building features for signal:', error);
    return null;
  }
}

/**
 * Build features from raw signal data (for real-time forecasting)
 */
export function buildFeaturesFromSignalData(data: {
  symbol: string;
  timeframe: string;
  side: string;
  ai_score?: number;
  technical_score?: number;
  volume_score?: number;
  pattern_score?: number;
  wave_score?: number;
  sentiment_score?: number;
  risk_level?: string;
  volatility_score?: number;
  activity_score?: number;
  funding_rate?: number;
  market_sentiment_value?: number;
}): SignalFeatures {
  return {
    ai_score: data.ai_score || 0,
    technical_score: data.technical_score || 0,
    volume_score: data.volume_score || 0,
    pattern_score: data.pattern_score || 0,
    wave_score: data.wave_score || 0,
    sentiment_score: data.sentiment_score || 0,
    risk_level_numeric: riskLevelToNumeric(data.risk_level),
    volatility_score: data.volatility_score || 50,
    activity_score: data.activity_score || 50,
    funding_rate: data.funding_rate || 0,
    market_sentiment_value: data.market_sentiment_value || 50,
    timeframe_bucket: timeframeToBucket(data.timeframe),
    symbol_category: getSymbolCategory(data.symbol),
  };
}

