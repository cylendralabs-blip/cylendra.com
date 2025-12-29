/**
 * Technical Summary Hook
 * 
 * Phase 2.4: Fetch and calculate technical summary for a symbol
 * Uses get-candles Edge Function and indicator engine
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateIndicatorsFromCandles } from '@/core/engines/indicatorEngine';
import { Candle } from '@/services/marketData/types';

export interface TechnicalSummary {
  trend: 'BULLISH' | 'BEARISH' | 'RANGING';
  rsiStatus: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  macdAlignment: 'BULLISH' | 'BEARISH' | 'FLAT';
  overallSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  indicators: {
    rsi: number;
    macd: {
      line: number;
      signal: number;
      histogram: number;
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    };
    ema20: number;
    ema50: number;
    adx: {
      value: number;
      trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    };
  };
}

/**
 * Fetch candles from get-candles Edge Function
 */
async function fetchCandles(
  symbol: string,
  timeframe: string,
  platform: string = 'binance'
): Promise<Candle[]> {
  const { data, error } = await supabase.functions.invoke('get-candles', {
    body: {
      symbol,
      timeframe,
      exchange: platform,
      limit: 100
    }
  });

  if (error) throw error;

  // Convert to Candle format
  return (data?.candles || []).map((c: any) => ({
    openTime: c.openTime || c[0],
    open: parseFloat(c.open || c[1]),
    high: parseFloat(c.high || c[2]),
    low: parseFloat(c.low || c[3]),
    close: parseFloat(c.close || c[4]),
    volume: parseFloat(c.volume || c[5]),
    closeTime: c.closeTime || c[6],
    quoteVolume: parseFloat(c.quoteVolume || c[7] || 0),
    trades: c.trades || c[8] || 0
  }));
}

/**
 * Calculate technical summary from candles
 */
function calculateTechnicalSummary(candles: Candle[]): TechnicalSummary {
  if (candles.length < 20) {
    return {
      trend: 'RANGING',
      rsiStatus: 'NEUTRAL',
      macdAlignment: 'FLAT',
      overallSignal: 'NEUTRAL',
      confidence: 0,
      indicators: {
        rsi: 50,
        macd: { line: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' },
        ema20: 0,
        ema50: 0,
        adx: { value: 0, trend_strength: 'WEAK' }
      }
    };
  }

  // Calculate indicators
  const indicators = calculateIndicatorsFromCandles(candles);

  // Determine RSI status
  let rsiStatus: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
  if (indicators.rsi >= 70) rsiStatus = 'OVERBOUGHT';
  else if (indicators.rsi <= 30) rsiStatus = 'OVERSOLD';

  // Determine MACD alignment
  const macdAlignment: 'BULLISH' | 'BEARISH' | 'FLAT' = indicators.macd.trend;

  // Determine trend
  const currentPrice = candles[candles.length - 1].close;
  const ema20AboveEma50 = indicators.ema20 > indicators.ema50;
  const priceAboveEma20 = currentPrice > indicators.ema20;
  
  let trend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING';
  if (ema20AboveEma50 && priceAboveEma20) {
    trend = 'BULLISH';
  } else if (!ema20AboveEma50 && !priceAboveEma20) {
    trend = 'BEARISH';
  }

  // Calculate overall signal
  let bullishSignals = 0;
  let bearishSignals = 0;

  // RSI signals
  if (rsiStatus === 'OVERSOLD') bullishSignals++;
  else if (rsiStatus === 'OVERBOUGHT') bearishSignals++;

  // MACD signals
  if (macdAlignment === 'BULLISH') bullishSignals++;
  else if (macdAlignment === 'BEARISH') bearishSignals++;

  // Trend signals
  if (trend === 'BULLISH') bullishSignals++;
  else if (trend === 'BEARISH') bearishSignals++;

  // EMA signals
  if (priceAboveEma20 && ema20AboveEma50) bullishSignals++;
  else if (!priceAboveEma20 && !ema20AboveEma50) bearishSignals++;

  const overallSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 
    bullishSignals > bearishSignals ? 'BULLISH' :
    bearishSignals > bullishSignals ? 'BEARISH' : 'NEUTRAL';

  // Calculate confidence (0-100)
  const totalSignals = bullishSignals + bearishSignals;
  const confidence = totalSignals > 0 
    ? Math.min(100, (Math.max(bullishSignals, bearishSignals) / totalSignals) * 100)
    : 0;

  return {
    trend,
    rsiStatus,
    macdAlignment,
    overallSignal,
    confidence,
    indicators: {
      rsi: indicators.rsi,
      macd: indicators.macd,
      ema20: indicators.ema20,
      ema50: indicators.ema50,
      adx: indicators.adx
    }
  };
}

/**
 * Hook to get technical summary for a symbol
 */
export function useTechnicalSummary(
  symbol: string,
  timeframe: string,
  platform?: string,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery<TechnicalSummary, Error>({
    queryKey: ['technical-summary', symbol, timeframe, platform],
    queryFn: async () => {
      if (!symbol || !timeframe) {
        throw new Error('Symbol and timeframe are required');
      }

      // Fetch candles
      const candles = await fetchCandles(symbol, timeframe, platform);

      if (candles.length === 0) {
        throw new Error('No candles data available');
      }

      // Calculate summary
      return calculateTechnicalSummary(candles);
    },
    enabled: enabled && !!symbol && !!timeframe,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

