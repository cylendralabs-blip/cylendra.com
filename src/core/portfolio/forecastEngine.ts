/**
 * Portfolio Forecast Engine
 * 
 * Phase X.13 - Generates portfolio performance forecasts
 */

import type { PortfolioSnapshot, PortfolioForecast } from './types';

/**
 * Generate portfolio forecast
 */
export function generatePortfolioForecast(
  snapshot: PortfolioSnapshot,
  historicalData?: {
    pastReturns?: Record<string, number>;
    marketSentiment?: Record<string, number>;
    signals?: Array<{ symbol: string; side: 'BUY' | 'SELL'; confidence: number }>;
  },
  period: '7d' | '30d' | '90d' = '7d'
): PortfolioForecast {
  const forecast: PortfolioForecast = {
    id: '',
    user_id: snapshot.user_id,
    forecast_period: period,
    expected_growth: 0,
    risk_adjusted_growth: 0,
    momentum_direction: 'NEUTRAL',
    confidence_score: 50,
    created_at: new Date().toISOString(),
  };

  // Calculate expected growth based on exposure
  let totalExpectedReturn = 0;
  const assetForecasts: Array<{
    asset: string;
    expected_return: number;
    risk_level: string;
  }> = [];

  if (snapshot.exposure) {
    for (const [asset, exposure] of Object.entries(snapshot.exposure)) {
      if (asset === 'USDT' || exposure === 0) continue;

      // Base expected return (simplified model)
      let expectedReturn = 0;
      
      // Use historical data if available
      if (historicalData?.pastReturns?.[asset]) {
        expectedReturn = historicalData.pastReturns[asset];
      } else {
        // Default estimates (simplified)
        if (asset === 'BTC') {
          expectedReturn = period === '7d' ? 2 : period === '30d' ? 8 : 20;
        } else if (asset === 'ETH') {
          expectedReturn = period === '7d' ? 2.5 : period === '30d' ? 10 : 25;
        } else {
          expectedReturn = period === '7d' ? 3 : period === '30d' ? 12 : 30;
        }
      }

      // Adjust based on signals
      if (historicalData?.signals) {
        const assetSignals = historicalData.signals.filter(s => s.symbol.includes(asset));
        if (assetSignals.length > 0) {
          const avgConfidence = assetSignals.reduce((sum, s) => sum + s.confidence, 0) / assetSignals.length;
          const buySignals = assetSignals.filter(s => s.side === 'BUY').length;
          const sellSignals = assetSignals.filter(s => s.side === 'SELL').length;

          if (buySignals > sellSignals) {
            expectedReturn *= (1 + avgConfidence / 100);
          } else if (sellSignals > buySignals) {
            expectedReturn *= (1 - avgConfidence / 100);
          }
        }
      }

      // Adjust based on sentiment
      if (historicalData?.marketSentiment?.[asset]) {
        const sentiment = historicalData.marketSentiment[asset];
        expectedReturn *= (1 + sentiment / 100);
      }

      const weightedReturn = expectedReturn * exposure;
      totalExpectedReturn += weightedReturn;

      assetForecasts.push({
        asset,
        expected_return: expectedReturn,
        risk_level: exposure > 0.3 ? 'HIGH' : exposure > 0.15 ? 'MEDIUM' : 'LOW',
      });
    }
  }

  forecast.expected_growth = Math.round(totalExpectedReturn * 100) / 100;

  // Risk-adjusted growth (reduce by risk factor)
  const riskAdjustment = snapshot.leverage_used > 1 ? 0.8 : 0.9;
  forecast.risk_adjusted_growth = Math.round(forecast.expected_growth * riskAdjustment * 100) / 100;

  // Determine best and worst assets
  if (assetForecasts.length > 0) {
    const sorted = [...assetForecasts].sort((a, b) => b.expected_return - a.expected_return);
    forecast.best_asset = sorted[0].asset;
    forecast.worst_asset = sorted[sorted.length - 1].asset;
  }

  // Determine momentum direction
  if (forecast.expected_growth > 3) {
    forecast.momentum_direction = 'BULLISH';
  } else if (forecast.expected_growth < -3) {
    forecast.momentum_direction = 'BEARISH';
  } else {
    forecast.momentum_direction = 'NEUTRAL';
  }

  // Calculate confidence score
  let confidence = 50;
  if (historicalData?.signals && historicalData.signals.length > 0) {
    confidence += 20; // Signals available
  }
  if (historicalData?.pastReturns) {
    confidence += 15; // Historical data available
  }
  if (snapshot.exposure && Object.keys(snapshot.exposure).length > 1) {
    confidence += 10; // Diversified
  }
  if (snapshot.leverage_used <= 2) {
    confidence += 5; // Low leverage = more predictable
  }

  forecast.confidence_score = Math.min(100, confidence);

  // Add forecast details
  forecast.forecast_details = {
    asset_forecasts: assetForecasts,
    market_conditions: forecast.momentum_direction === 'BULLISH' 
      ? 'Favorable market conditions expected'
      : forecast.momentum_direction === 'BEARISH'
      ? 'Challenging market conditions expected'
      : 'Neutral market conditions expected',
    key_factors: [
      `Expected ${period} return: ${forecast.expected_growth > 0 ? '+' : ''}${forecast.expected_growth.toFixed(2)}%`,
      `Risk-adjusted: ${forecast.risk_adjusted_growth > 0 ? '+' : ''}${forecast.risk_adjusted_growth.toFixed(2)}%`,
      `Confidence: ${forecast.confidence_score}%`,
    ],
  };

  return forecast;
}

