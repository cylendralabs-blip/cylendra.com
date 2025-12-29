/**
 * Sentiment Analysis Analyzer
 * 
 * Analyzes market sentiment from:
 * - Fear & Greed Index
 * - Funding Rates
 * - Social Sentiment (optional)
 * - Open Interest (optional)
 * 
 * Phase X.1: AI Multi-Factor Analyzer
 * Phase X.9: Enhanced with database-backed sentiment data
 */

import type { SentimentAnalysisResult, MarketBias, SentimentData } from '../types';
import { getEnvValue } from '../utils/env';
import type { SupabaseClient } from '@supabase/supabase-js';

const FEAR_GREED_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const FUNDING_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

let fearGreedCache: { value: number; timestamp: number } | null = null;
const fundingCache: Map<string, { value: number; timestamp: number }> = new Map();

function normalizeDerivativeSymbol(symbol: string): string {
  return symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Phase X.9: Fetch Fear & Greed Index from database (preferred) or API (fallback)
 */
async function fetchFearGreedIndex(supabaseClient?: SupabaseClient): Promise<number | null> {
  try {
    // Check cache first
    if (fearGreedCache && Date.now() - fearGreedCache.timestamp < FEAR_GREED_CACHE_TTL) {
      return fearGreedCache.value;
    }

    // Phase X.9: Try database first
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('market_sentiment_snapshots')
          .select('value')
          .eq('source', 'fear_greed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const value = Number(data.value);
          if (Number.isFinite(value)) {
            fearGreedCache = { value, timestamp: Date.now() };
            return value;
          }
        }
      } catch (dbError) {
        // Fall through to API
        console.warn('Failed to fetch Fear & Greed from database, falling back to API:', dbError);
      }
    }

    // Fallback to API
    const apiUrl =
      getEnvValue('SENTIMENT_FNG_API_URL') ||
      'https://api.alternative.me/fng/?limit=1&format=json';

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data = await response.json();
    const value = parseFloat(data?.data?.[0]?.value ?? data?.value);

    if (Number.isFinite(value)) {
      fearGreedCache = { value, timestamp: Date.now() };
      return value;
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch Fear & Greed Index:', error);
    return null;
  }
}

/**
 * Phase X.9: Fetch Funding Rate from database (preferred) or API (fallback)
 */
async function fetchFundingRate(
  symbol: string,
  supabaseClient?: SupabaseClient
): Promise<number | null> {
  const cacheKey = normalizeDerivativeSymbol(symbol);

  try {
    // Check cache first
    const cached = fundingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FUNDING_CACHE_TTL) {
      return cached.value;
    }

    // Phase X.9: Try database first (prefer Binance)
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('funding_rates')
          .select('funding_rate')
          .eq('symbol', cacheKey)
          .eq('exchange', 'binance')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const value = Number(data.funding_rate);
          if (Number.isFinite(value)) {
            fundingCache.set(cacheKey, { value, timestamp: Date.now() });
            return value;
          }
        }
      } catch (dbError) {
        // Fall through to API
        console.warn(`Failed to fetch funding rate from database for ${symbol}, falling back to API:`, dbError);
      }
    }

    // Fallback to API
    const apiUrl =
      getEnvValue('SENTIMENT_FUNDING_API_URL') ||
      'https://fapi.binance.com/fapi/v1/premiumIndex';

    const params = new URLSearchParams({ symbol: cacheKey });
    const url = `${apiUrl}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Funding API error: ${response.status}`);
    }

    const data = await response.json();
    const value = parseFloat(data?.lastFundingRate ?? data?.fundingRate);

    if (Number.isFinite(value)) {
      fundingCache.set(cacheKey, { value, timestamp: Date.now() });
      return value;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch funding rate for ${symbol}:`, error);
    return null;
  }
}

/**
 * Analyze market sentiment
 * Phase X.9: Enhanced with database-backed data
 */
export async function analyzeSentiment(
  symbol: string,
  sentimentData?: SentimentData,
  supabaseClient?: SupabaseClient
): Promise<SentimentAnalysisResult> {
  // Get Fear & Greed Index
  let fearGreedIndex: number | undefined;
  
  if (sentimentData?.fear_greed_index !== undefined) {
    fearGreedIndex = sentimentData.fear_greed_index;
  } else {
    // Phase X.9: Try to fetch from database or API
    const fetched = await fetchFearGreedIndex(supabaseClient);
    if (fetched !== null) {
      fearGreedIndex = fetched;
    }
  }

  // Get Funding Rate
  let fundingRate: number | undefined;
  
  if (sentimentData?.funding_rate !== undefined) {
    fundingRate = sentimentData.funding_rate;
  } else {
    // Phase X.9: Try to fetch from database or API
    const fetched = await fetchFundingRate(symbol, supabaseClient);
    if (fetched !== null) {
      fundingRate = fetched;
    }
  }

  // Get Social Sentiment (optional)
  const socialSentiment = sentimentData?.social_sentiment;

  // Calculate sentiment score (0-100)
  let sentimentScore = 50; // Base score (neutral)

  // Fear & Greed Index contribution (0-40 points)
  if (fearGreedIndex !== undefined) {
    // Fear & Greed Index: 0-100
    // 0-25: Extreme Fear (bearish)
    // 25-45: Fear (bearish)
    // 45-55: Neutral
    // 55-75: Greed (bullish)
    // 75-100: Extreme Greed (bullish)
    
    if (fearGreedIndex >= 75) {
      sentimentScore += 40; // Extreme Greed
    } else if (fearGreedIndex >= 55) {
      sentimentScore += 20; // Greed
    } else if (fearGreedIndex <= 25) {
      sentimentScore -= 40; // Extreme Fear
    } else if (fearGreedIndex <= 45) {
      sentimentScore -= 20; // Fear
    }
  }

  // Funding Rate contribution (0-30 points)
  if (fundingRate !== undefined) {
    // Positive funding rate = longs pay shorts (bearish sentiment)
    // Negative funding rate = shorts pay longs (bullish sentiment)
    // Typical range: -0.01 to 0.01 (0.1% to -0.1%)
    
    const fundingPercent = fundingRate * 100; // Convert to percentage
    
    if (fundingPercent > 0.05) {
      // Very high positive funding (extreme bearish sentiment)
      sentimentScore -= 30;
    } else if (fundingPercent > 0.02) {
      // High positive funding (bearish sentiment)
      sentimentScore -= 15;
    } else if (fundingPercent < -0.05) {
      // Very negative funding (extreme bullish sentiment)
      sentimentScore += 30;
    } else if (fundingPercent < -0.02) {
      // Negative funding (bullish sentiment)
      sentimentScore += 15;
    }
  }

  // Social Sentiment contribution (0-20 points)
  if (socialSentiment !== undefined) {
    // Social sentiment: 0-100
    // 0-40: Negative
    // 40-60: Neutral
    // 60-100: Positive
    
    if (socialSentiment >= 70) {
      sentimentScore += 20; // Very positive
    } else if (socialSentiment >= 60) {
      sentimentScore += 10; // Positive
    } else if (socialSentiment <= 30) {
      sentimentScore -= 20; // Very negative
    } else if (socialSentiment <= 40) {
      sentimentScore -= 10; // Negative
    }
  }

  // Open Interest contribution (0-10 points) - if available
  if (sentimentData?.open_interest !== undefined) {
    // High open interest can indicate strong conviction
    // This is a simplified approach - in production, compare with historical averages
    // For now, we'll just note it but not heavily weight it
  }

  // Normalize to 0-100
  sentimentScore = Math.max(0, Math.min(100, sentimentScore));

  // Determine overall sentiment
  let overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
  if (sentimentScore >= 60) {
    overallSentiment = 'POSITIVE';
  } else if (sentimentScore <= 40) {
    overallSentiment = 'NEGATIVE';
  }

  // Determine funding bias
  let fundingBias: MarketBias = 'WAIT';
  if (fundingRate !== undefined) {
    if (fundingRate < -0.01) {
      fundingBias = 'BUY'; // Negative funding = bullish
    } else if (fundingRate > 0.01) {
      fundingBias = 'SELL'; // Positive funding = bearish
    }
  }

  return {
    sentiment_score: sentimentScore,
    funding_rate: fundingRate,
    overall_sentiment: overallSentiment,
    fear_greed_index: fearGreedIndex,
    social_sentiment: socialSentiment,
    funding_bias: fundingBias
  };
}

/**
 * Synchronous version (uses provided data only, no API calls)
 */
export function analyzeSentimentSync(
  symbol: string,
  sentimentData?: SentimentData
): SentimentAnalysisResult {
  // Get Fear & Greed Index
  const fearGreedIndex = sentimentData?.fear_greed_index;

  // Get Funding Rate
  const fundingRate = sentimentData?.funding_rate;

  // Get Social Sentiment
  const socialSentiment = sentimentData?.social_sentiment;

  // Calculate sentiment score (0-100)
  let sentimentScore = 50; // Base score (neutral)

  // Fear & Greed Index contribution (0-40 points)
  if (fearGreedIndex !== undefined) {
    if (fearGreedIndex >= 75) {
      sentimentScore += 40; // Extreme Greed
    } else if (fearGreedIndex >= 55) {
      sentimentScore += 20; // Greed
    } else if (fearGreedIndex <= 25) {
      sentimentScore -= 40; // Extreme Fear
    } else if (fearGreedIndex <= 45) {
      sentimentScore -= 20; // Fear
    }
  }

  // Funding Rate contribution (0-30 points)
  if (fundingRate !== undefined) {
    const fundingPercent = fundingRate * 100;
    
    if (fundingPercent > 0.05) {
      sentimentScore -= 30;
    } else if (fundingPercent > 0.02) {
      sentimentScore -= 15;
    } else if (fundingPercent < -0.05) {
      sentimentScore += 30;
    } else if (fundingPercent < -0.02) {
      sentimentScore += 15;
    }
  }

  // Social Sentiment contribution (0-20 points)
  if (socialSentiment !== undefined) {
    if (socialSentiment >= 70) {
      sentimentScore += 20;
    } else if (socialSentiment >= 60) {
      sentimentScore += 10;
    } else if (socialSentiment <= 30) {
      sentimentScore -= 20;
    } else if (socialSentiment <= 40) {
      sentimentScore -= 10;
    }
  }

  // Normalize to 0-100
  sentimentScore = Math.max(0, Math.min(100, sentimentScore));

  // Determine overall sentiment
  let overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
  if (sentimentScore >= 60) {
    overallSentiment = 'POSITIVE';
  } else if (sentimentScore <= 40) {
    overallSentiment = 'NEGATIVE';
  }

  // Determine funding bias
  let fundingBias: MarketBias = 'WAIT';
  if (fundingRate !== undefined) {
    if (fundingRate < -0.01) {
      fundingBias = 'BUY';
    } else if (fundingRate > 0.01) {
      fundingBias = 'SELL';
    }
  }

  return {
    sentiment_score: sentimentScore,
    funding_rate: fundingRate,
    overall_sentiment: overallSentiment,
    fear_greed_index: fearGreedIndex,
    social_sentiment: socialSentiment,
    funding_bias: fundingBias
  };
}

