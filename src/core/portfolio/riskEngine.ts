/**
 * Portfolio Risk Engine
 * 
 * Phase X.13 - Analyzes portfolio risk and generates risk scores
 */

import type { PortfolioSnapshot, PortfolioFeatures, RiskAnalysisResult } from './types';

/**
 * Analyze portfolio risk
 */
export function analyzePortfolioRisk(
  snapshot: PortfolioSnapshot,
  features: PortfolioFeatures
): RiskAnalysisResult {
  const riskFactors: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }> = [];

  // Calculate overall risk score (weighted average)
  const weights = {
    volatility: 0.15,
    leverage: 0.25,
    exposure: 0.20,
    diversification: 0.15,
    liquidation: 0.15,
    funding: 0.10,
  };

  // Calculate liquidation risk
  let liquidationRisk = 0;
  if (snapshot.futures_positions && snapshot.futures_positions.length > 0) {
    const highLeveragePositions = snapshot.futures_positions.filter(
      p => p.leverage >= 5
    );
    const negativePnLPositions = snapshot.futures_positions.filter(
      p => p.unrealized_pnl < 0
    );

    if (highLeveragePositions.length > 0 && negativePnLPositions.length > 0) {
      liquidationRisk = 80;
      riskFactors.push({
        type: 'liquidation',
        severity: 'HIGH',
        description: `High leverage positions (${highLeveragePositions.length}) with negative PnL are at risk of liquidation`,
      });
    } else if (highLeveragePositions.length > 0) {
      liquidationRisk = 50;
      riskFactors.push({
        type: 'liquidation',
        severity: 'MEDIUM',
        description: `${highLeveragePositions.length} high leverage positions detected`,
      });
    }
  }

  // Overall score calculation
  const overallScore = Math.round(
    features.volatility_risk * weights.volatility +
    features.leverage_risk * weights.leverage +
    features.exposure_risk * weights.exposure +
    features.diversification_risk * weights.diversification +
    liquidationRisk * weights.liquidation +
    features.funding_risk * weights.funding
  );

  // Identify risk factors
  if (features.leverage_risk >= 75) {
    riskFactors.push({
      type: 'leverage',
      severity: 'CRITICAL',
      description: `Extremely high leverage (${snapshot.leverage_used.toFixed(1)}x) detected`,
    });
  } else if (features.leverage_risk >= 50) {
    riskFactors.push({
      type: 'leverage',
      severity: 'HIGH',
      description: `High leverage (${snapshot.leverage_used.toFixed(1)}x) increases liquidation risk`,
    });
  }

  if (features.diversification_risk >= 75) {
    const maxAsset = snapshot.exposure
      ? Object.entries(snapshot.exposure).sort((a, b) => b[1] - a[1])[0]
      : null;
    if (maxAsset) {
      riskFactors.push({
        type: 'diversification',
        severity: 'HIGH',
        description: `Over-concentration in ${maxAsset[0]} (${(maxAsset[1] * 100).toFixed(1)}%)`,
      });
    }
  }

  if (features.exposure_risk >= 75) {
    riskFactors.push({
      type: 'exposure',
      severity: 'HIGH',
      description: `Very high total exposure (${snapshot.total_exposure.toFixed(1)}%)`,
    });
  }

  if (snapshot.unrealized_pnl < -0.1 * snapshot.total_balance) {
    riskFactors.push({
      type: 'pnl',
      severity: 'MEDIUM',
      description: `Significant unrealized losses (${((snapshot.unrealized_pnl / snapshot.total_balance) * 100).toFixed(1)}%)`,
    });
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (overallScore >= 80 || riskFactors.some(f => f.severity === 'CRITICAL')) {
    riskLevel = 'CRITICAL';
  } else if (overallScore >= 60 || riskFactors.some(f => f.severity === 'HIGH')) {
    riskLevel = 'HIGH';
  } else if (overallScore >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Generate AI comment
  const aiComment = generateAIComment(riskLevel, overallScore, riskFactors, snapshot);

  return {
    risk_level: riskLevel,
    overall_score: overallScore,
    ai_comment: aiComment,
    risk_factors: riskFactors,
    scores: {
      volatility: features.volatility_risk,
      leverage: features.leverage_risk,
      exposure: features.exposure_risk,
      diversification: features.diversification_risk,
      liquidation: liquidationRisk,
      funding: features.funding_risk,
      sentiment: features.sentiment_bias,
    },
  };
}

/**
 * Generate AI comment based on risk analysis
 */
function generateAIComment(
  riskLevel: string,
  score: number,
  factors: Array<{ type: string; severity: string; description: string }>,
  snapshot: PortfolioSnapshot
): string {
  const comments: string[] = [];

  if (riskLevel === 'CRITICAL') {
    comments.push('⚠️ CRITICAL RISK: Immediate action required.');
  } else if (riskLevel === 'HIGH') {
    comments.push('⚠️ HIGH RISK: Consider reducing exposure or leverage.');
  } else if (riskLevel === 'MEDIUM') {
    comments.push('ℹ️ MODERATE RISK: Monitor positions closely.');
  } else {
    comments.push('✅ LOW RISK: Portfolio appears well-balanced.');
  }

  // Add specific recommendations
  if (factors.some(f => f.type === 'leverage' && f.severity === 'CRITICAL')) {
    comments.push('Reduce leverage immediately to avoid liquidation risk.');
  }

  if (factors.some(f => f.type === 'diversification' && f.severity === 'HIGH')) {
    comments.push('Consider diversifying across more assets to reduce concentration risk.');
  }

  if (snapshot.total_exposure > 80) {
    comments.push('High exposure may limit flexibility during market downturns.');
  }

  return comments.join(' ');
}

