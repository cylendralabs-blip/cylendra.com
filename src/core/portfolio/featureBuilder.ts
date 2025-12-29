/**
 * Portfolio Feature Builder
 * 
 * Phase X.13 - Builds features for portfolio risk analysis
 */

import type { PortfolioSnapshot, PortfolioFeatures } from './types';

/**
 * Build portfolio features from snapshot
 */
export function buildPortfolioFeatures(
  snapshot: PortfolioSnapshot,
  marketData?: {
    volatility?: Record<string, number>;
    fundingRates?: Record<string, number>;
    sentiment?: Record<string, number>;
  }
): PortfolioFeatures {
  const features: PortfolioFeatures = {
    volatility_risk: 0,
    leverage_risk: 0,
    exposure_risk: 0,
    diversification_risk: 0,
    funding_risk: 0,
    sentiment_bias: 0,
    technical_bias: 0,
  };

  // 1. Leverage Risk (0-100)
  if (snapshot.leverage_used > 0) {
    if (snapshot.leverage_used >= 10) {
      features.leverage_risk = 100;
    } else if (snapshot.leverage_used >= 5) {
      features.leverage_risk = 75;
    } else if (snapshot.leverage_used >= 3) {
      features.leverage_risk = 50;
    } else if (snapshot.leverage_used >= 2) {
      features.leverage_risk = 25;
    } else {
      features.leverage_risk = 10;
    }
  }

  // 2. Exposure Risk (0-100)
  // High exposure = high risk
  if (snapshot.total_exposure > 90) {
    features.exposure_risk = 100;
  } else if (snapshot.total_exposure > 70) {
    features.exposure_risk = 75;
  } else if (snapshot.total_exposure > 50) {
    features.exposure_risk = 50;
  } else if (snapshot.total_exposure > 30) {
    features.exposure_risk = 25;
  } else {
    features.exposure_risk = 10;
  }

  // 3. Diversification Risk (0-100)
  // Lower diversification = higher risk
  if (snapshot.exposure) {
    const assets = Object.keys(snapshot.exposure);
    const maxExposure = Math.max(...assets.map(a => snapshot.exposure![a] || 0));
    
    if (maxExposure > 0.5) {
      // Single asset > 50%
      features.diversification_risk = 100;
    } else if (maxExposure > 0.4) {
      features.diversification_risk = 75;
    } else if (maxExposure > 0.3) {
      features.diversification_risk = 50;
    } else if (maxExposure > 0.2) {
      features.diversification_risk = 25;
    } else {
      features.diversification_risk = 10;
    }

    // Also consider number of assets
    if (assets.length < 3) {
      features.diversification_risk = Math.max(features.diversification_risk, 60);
    }
  }

  // 4. Volatility Risk (0-100)
  if (marketData?.volatility && snapshot.exposure) {
    let weightedVolatility = 0;
    let totalWeight = 0;

    for (const [asset, exposure] of Object.entries(snapshot.exposure)) {
      const vol = marketData.volatility[asset] || 0;
      weightedVolatility += vol * exposure;
      totalWeight += exposure;
    }

    if (totalWeight > 0) {
      const avgVolatility = weightedVolatility / totalWeight;
      // Normalize volatility (assuming 0-100 range)
      features.volatility_risk = Math.min(100, avgVolatility * 100);
    }
  }

  // 5. Funding Risk (0-100)
  if (marketData?.fundingRates && snapshot.futures_positions) {
    let totalFundingRisk = 0;
    let positionCount = 0;

    for (const position of snapshot.futures_positions) {
      const fundingRate = marketData.fundingRates[position.symbol] || 0;
      // Negative funding = paying fees (risk)
      // High positive funding = receiving fees (lower risk)
      const risk = fundingRate < -0.01 ? 75 : fundingRate < 0 ? 50 : 25;
      totalFundingRisk += risk;
      positionCount++;
    }

    if (positionCount > 0) {
      features.funding_risk = totalFundingRisk / positionCount;
    }
  }

  // 6. Sentiment Bias (0-100, normalized to -100 to +100)
  if (marketData?.sentiment && snapshot.exposure) {
    let weightedSentiment = 0;
    let totalWeight = 0;

    for (const [asset, exposure] of Object.entries(snapshot.exposure)) {
      const sentiment = marketData.sentiment[asset] || 0;
      weightedSentiment += sentiment * exposure;
      totalWeight += exposure;
    }

    if (totalWeight > 0) {
      features.sentiment_bias = weightedSentiment / totalWeight;
    }
  }

  return features;
}

