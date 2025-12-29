/**
 * Risk Profile Hook
 * 
 * Phase 1.4: Read risk profile constraints from bot settings
 * Provides validation for Smart Trade based on bot risk limits
 */

import { useMemo } from 'react';
import { BotSettingsForm } from '@/types/botSettings';
import { RiskProfileConstraints, TradeValidationResult } from '@/types/trade';

/**
 * Get risk profile constraints from bot settings
 */
export function useRiskProfile(botSettings: BotSettingsForm | null): RiskProfileConstraints | null {
  return useMemo(() => {
    if (!botSettings) return null;

    return {
      maxRiskPerTrade: botSettings.risk_percentage || 2,
      maxDCALevels: botSettings.dca_levels || 3,
      maxLeverage: botSettings.leverage || 1,
      maxConcurrentTrades: botSettings.max_active_trades || 5,
      maxTotalRisk: (botSettings.risk_percentage || 2) * (botSettings.max_active_trades || 5)
    };
  }, [botSettings]);
}

/**
 * Validate trade against risk profile
 */
export function validateTradeAgainstRiskProfile(
  tradeCalculation: {
    maxLossAmount: number;
    totalTradeAmount: number;
    dcaLevels: Array<any>;
  },
  availableBalance: number,
  riskProfile: RiskProfileConstraints,
  currentOpenTrades?: number
): TradeValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';

  // Check risk per trade
  const riskPercentage = (tradeCalculation.maxLossAmount / availableBalance) * 100;
  if (riskPercentage > riskProfile.maxRiskPerTrade * 1.5) {
    errors.push(`المخاطرة ${riskPercentage.toFixed(2)}% تتجاوز الحد الأقصى المسموح ${riskProfile.maxRiskPerTrade * 1.5}%`);
    riskLevel = 'danger';
  } else if (riskPercentage > riskProfile.maxRiskPerTrade) {
    warnings.push(`المخاطرة ${riskPercentage.toFixed(2)}% أعلى من الموصى به ${riskProfile.maxRiskPerTrade}%`);
    riskLevel = 'warning';
  }

  // Check DCA levels
  if (tradeCalculation.dcaLevels.length > riskProfile.maxDCALevels) {
    errors.push(`عدد مستويات DCA ${tradeCalculation.dcaLevels.length} يتجاوز الحد الأقصى ${riskProfile.maxDCALevels}`);
    riskLevel = 'danger';
  }

  // Check total trade amount vs available balance
  if (tradeCalculation.totalTradeAmount > availableBalance * 0.95) {
    warnings.push(`المبلغ الإجمالي ${tradeCalculation.totalTradeAmount.toFixed(2)} يستخدم أكثر من 95% من الرصيد المتاح`);
    if (riskLevel === 'safe') riskLevel = 'warning';
  }

  // Check concurrent trades (if provided)
  if (currentOpenTrades !== undefined && riskProfile.maxConcurrentTrades) {
    if (currentOpenTrades >= riskProfile.maxConcurrentTrades) {
      errors.push(`عدد الصفقات المفتوحة ${currentOpenTrades} وصل للحد الأقصى ${riskProfile.maxConcurrentTrades}`);
      riskLevel = 'danger';
    } else if (currentOpenTrades >= riskProfile.maxConcurrentTrades * 0.8) {
      warnings.push(`عدد الصفقات المفتوحة ${currentOpenTrades} قريب من الحد الأقصى ${riskProfile.maxConcurrentTrades}`);
      if (riskLevel === 'safe') riskLevel = 'warning';
    }
  }

  // Check max total risk (if provided)
  if (riskProfile.maxTotalRisk) {
    // This would require calculating total risk across all open positions
    // For now, we'll just validate the current trade risk
    const currentRiskPct = (tradeCalculation.maxLossAmount / availableBalance) * 100;
    if (currentRiskPct > riskProfile.maxTotalRisk) {
      warnings.push(`المخاطرة الإجمالية ${currentRiskPct.toFixed(2)}% تتجاوز الحد الموصى به ${riskProfile.maxTotalRisk}%`);
      if (riskLevel === 'safe') riskLevel = 'warning';
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    riskLevel
  };
}

