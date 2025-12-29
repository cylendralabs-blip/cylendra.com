/**
 * AI Safety Mode Engine
 * 
 * Phase X.14 - Reduces risk automatically when safety mode is enabled
 */

import type { AISafetyModeConfig } from './types';

/**
 * Check if signal should be filtered by safety mode
 */
export function shouldFilterSignalBySafetyMode(
  signal: {
    confidence?: number;
    risk_level?: string;
    leverage?: number;
    source?: string;
  },
  config: AISafetyModeConfig
): boolean {
  if (!config.enabled) {
    return false; // Safety mode disabled, allow all signals
  }

  // Filter high risk signals
  if (config.disable_high_risk_signals) {
    if (signal.risk_level === 'HIGH' || signal.risk_level === 'CRITICAL') {
      return true; // Filter out
    }
  }

  // Filter low confidence signals
  if (signal.confidence && signal.confidence < 60) {
    return true; // Filter out low confidence
  }

  // Filter wave signals if disabled
  if (config.disable_wave_signals && signal.source === 'wave') {
    return true; // Filter out
  }

  // Check leverage
  if (signal.leverage && signal.leverage > config.max_leverage) {
    return true; // Filter out high leverage
  }

  return false; // Allow signal
}

/**
 * Adjust signal parameters for safety mode
 */
export function adjustSignalForSafetyMode(
  signal: {
    leverage?: number;
    confidence?: number;
    risk_level?: string;
  },
  config: AISafetyModeConfig
): {
  leverage?: number;
  confidence?: number;
  risk_level?: string;
} {
  if (!config.enabled) {
    return signal; // No adjustments
  }

  const adjusted = { ...signal };

  // Reduce leverage
  if (adjusted.leverage && adjusted.leverage > config.max_leverage) {
    adjusted.leverage = config.max_leverage;
  }

  // Reduce confidence if sensitivity is reduced
  if (config.reduce_sensitivity && adjusted.confidence) {
    adjusted.confidence = Math.max(50, adjusted.confidence * 0.9);
  }

  // Adjust risk level
  if (adjusted.risk_level === 'HIGH' && config.risk_threshold < 0.7) {
    adjusted.risk_level = 'MEDIUM';
  }

  return adjusted;
}

/**
 * Get safety mode recommendations
 */
export function getSafetyModeRecommendations(
  marketConditions: {
    volatility?: number;
    trend_reversal?: boolean;
    volume_spike?: boolean;
  },
  config: AISafetyModeConfig
): string[] {
  const recommendations: string[] = [];

  if (!config.enabled) {
    if (marketConditions.volatility && marketConditions.volatility > 0.8) {
      recommendations.push('High volatility detected. Consider enabling Safety Mode.');
    }
    if (marketConditions.trend_reversal) {
      recommendations.push('Trend reversal detected. Consider enabling Safety Mode.');
    }
    if (marketConditions.volume_spike) {
      recommendations.push('Volume spike detected. Consider enabling Safety Mode.');
    }
  } else {
    if (marketConditions.volatility && marketConditions.volatility < 0.3) {
      recommendations.push('Low volatility. Safety Mode may be too conservative.');
    }
  }

  return recommendations;
}

