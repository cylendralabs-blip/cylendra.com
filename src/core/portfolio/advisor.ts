/**
 * Portfolio Advisor
 * 
 * Phase X.13 - Generates AI recommendations for portfolio optimization
 */

import type { PortfolioSnapshot, PortfolioRiskScore, PortfolioRecommendation } from './types';

/**
 * Generate portfolio recommendations based on risk analysis
 */
export function generateRecommendations(
  snapshot: PortfolioSnapshot,
  riskScore: PortfolioRiskScore
): PortfolioRecommendation[] {
  const recommendations: PortfolioRecommendation[] = [];

  // 1. Leverage reduction recommendation
  if (riskScore.leverage_risk && riskScore.leverage_risk >= 75) {
    const recommendedLeverage = Math.max(1, snapshot.leverage_used / 2);
    recommendations.push({
      id: '',
      user_id: snapshot.user_id,
      recommendation_type: 'reduce_leverage',
      priority: 'URGENT',
      title: 'Reduce Leverage',
      description: `Current leverage (${snapshot.leverage_used.toFixed(1)}x) is extremely high and poses significant liquidation risk.`,
      details: {
        action: 'Reduce leverage',
        current_value: snapshot.leverage_used,
        recommended_value: recommendedLeverage,
        reason: 'High leverage increases liquidation risk, especially during volatile market conditions.',
        affected_assets: snapshot.futures_positions?.map(p => p.symbol) || [],
      },
      is_applied: false,
      created_at: new Date().toISOString(),
    });
  }

  // 2. Diversification recommendation
  if (riskScore.diversification_score && riskScore.diversification_score < 30) {
    const maxAsset = snapshot.exposure
      ? Object.entries(snapshot.exposure).sort((a, b) => b[1] - a[1])[0]
      : null;
    
    if (maxAsset && maxAsset[1] > 0.5) {
      recommendations.push({
        id: '',
        user_id: snapshot.user_id,
        recommendation_type: 'diversify',
        priority: 'HIGH',
        title: 'Diversify Portfolio',
        description: `Over-concentration in ${maxAsset[0]} (${(maxAsset[1] * 100).toFixed(1)}%) increases risk.`,
        details: {
          action: 'Reduce concentration',
          current_value: maxAsset[1] * 100,
          recommended_value: 30,
          reason: 'Diversification reduces overall portfolio risk and improves resilience.',
          affected_assets: [maxAsset[0]],
        },
        is_applied: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 3. USDT Buffer recommendation
  if (snapshot.total_exposure > 90) {
    const recommendedBuffer = 20; // 20% USDT buffer
    recommendations.push({
      id: '',
      user_id: snapshot.user_id,
      recommendation_type: 'increase_usdt_buffer',
      priority: 'MEDIUM',
      title: 'Increase USDT Buffer',
      description: `Very high exposure (${snapshot.total_exposure.toFixed(1)}%) limits flexibility.`,
      details: {
        action: 'Increase cash buffer',
        current_value: (1 - snapshot.total_exposure / 100) * 100,
        recommended_value: recommendedBuffer,
        reason: 'Maintaining a cash buffer provides flexibility during market opportunities and downturns.',
        affected_assets: ['USDT'],
      },
      is_applied: false,
      created_at: new Date().toISOString(),
    });
  }

  // 4. Rebalancing recommendation
  if (riskScore.overall_score >= 60) {
    const idealDistribution = calculateIdealDistribution(snapshot);
    recommendations.push({
      id: '',
      user_id: snapshot.user_id,
      recommendation_type: 'rebalance',
      priority: 'HIGH',
      title: 'Rebalance Portfolio',
      description: 'Current allocation may not align with risk tolerance.',
      details: {
        action: 'Rebalance assets',
        reason: 'Rebalancing helps maintain target risk levels and optimize returns.',
        affected_assets: Object.keys(snapshot.exposure || {}),
      },
      is_applied: false,
      created_at: new Date().toISOString(),
    });
  }

  // 5. Take profit recommendation (for profitable positions)
  if (snapshot.futures_positions) {
    const profitablePositions = snapshot.futures_positions.filter(
      p => p.unrealized_pnl > 0 && p.unrealized_pnl > p.margin * 0.5
    );

    if (profitablePositions.length > 0 && riskScore.overall_score >= 50) {
      recommendations.push({
        id: '',
        user_id: snapshot.user_id,
        recommendation_type: 'take_profit',
        priority: 'MEDIUM',
        title: 'Consider Taking Profits',
        description: `${profitablePositions.length} position(s) showing significant unrealized gains.`,
        details: {
          action: 'Take partial profits',
          reason: 'Locking in profits reduces risk and provides capital for new opportunities.',
          affected_assets: profitablePositions.map(p => p.symbol),
        },
        is_applied: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 6. Stop loss recommendation (for losing positions)
  if (snapshot.futures_positions) {
    const losingPositions = snapshot.futures_positions.filter(
      p => p.unrealized_pnl < -p.margin * 0.2 // Loss > 20% of margin
    );

    if (losingPositions.length > 0) {
      recommendations.push({
        id: '',
        user_id: snapshot.user_id,
        recommendation_type: 'stop_loss',
        priority: 'HIGH',
        title: 'Review Stop Losses',
        description: `${losingPositions.length} position(s) showing significant unrealized losses.`,
        details: {
          action: 'Review and adjust stop losses',
          reason: 'Proper stop losses help limit downside risk and protect capital.',
          affected_assets: losingPositions.map(p => p.symbol),
        },
        is_applied: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  return recommendations;
}

/**
 * Calculate ideal portfolio distribution
 */
function calculateIdealDistribution(snapshot: PortfolioSnapshot): Record<string, number> {
  // Conservative distribution
  const ideal: Record<string, number> = {
    USDT: 0.30,  // 30% cash buffer
    BTC: 0.40,   // 40% BTC
    ETH: 0.20,   // 20% ETH
    ALTS: 0.10,  // 10% Altcoins
  };

  // Adjust based on current holdings
  if (snapshot.exposure) {
    const currentAssets = Object.keys(snapshot.exposure);
    
    // If user has specific assets, adjust ideal distribution
    if (currentAssets.includes('BTC')) {
      ideal.BTC = 0.35;
    }
    if (currentAssets.includes('ETH')) {
      ideal.ETH = 0.25;
    }
  }

  return ideal;
}

