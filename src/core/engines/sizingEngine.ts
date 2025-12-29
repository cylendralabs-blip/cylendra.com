/**
 * Position Sizing Engine
 * 
 * محرك حساب حجم الصفقة بناءً على المخاطرة
 * 
 * Phase 1: نقل الحسابات من UI إلى Core Engines
 */

import { BotSettingsForm } from '../config';

export interface SizingParams {
  availableBalance: number;
  riskPercentage: number;
  lossPercentage: number;
  leverage: number;
  entryPrice: number;
  initialOrderPercentage: number;
}

export interface SizingResult {
  maxLossAmount: number;
  positionSize: number;
  marginUsed: number;
  initialAmount: number;
  remainingAmount: number;
}

/**
 * حساب حجم الصفقة بناءً على المخاطرة
 * 
 * @param params - معاملات الحساب
 * @returns نتيجة حساب الحجم
 */
export function calculatePositionSize(params: SizingParams): SizingResult {
  const {
    availableBalance,
    riskPercentage,
    lossPercentage,
    leverage,
    entryPrice,
    initialOrderPercentage
  } = params;

  // حساب الحد الأقصى للخسارة المسموح به
  const maxLossAmount = (availableBalance * riskPercentage) / 100;

  // حساب حجم الصفقة بناءً على نسبة الخسارة
  // positionSize = maxLossAmount / (lossPercentage / 100)
  const calculatedPositionSize = maxLossAmount / (lossPercentage / 100);

  // التأكد من أن حجم الصفقة لا يتجاوز الرصيد المتاح (95% كحد أقصى)
  const positionSize = Math.min(calculatedPositionSize, availableBalance * 0.95);

  // حساب الهامش المستخدم (للتداول بالرافعة)
  const marginUsed = positionSize / leverage;

  // حساب المبلغ الأولي
  const initialAmount = (positionSize * initialOrderPercentage) / 100;

  // حساب المبلغ المتبقي للـ DCA
  const remainingAmount = positionSize - initialAmount;

  return {
    maxLossAmount,
    positionSize,
    marginUsed,
    initialAmount,
    remainingAmount
  };
}

/**
 * حساب حجم الصفقة من الحد الأقصى للخسارة مباشرة
 * 
 * @param maxLossAmount - الحد الأقصى للخسارة
 * @param lossPercentage - نسبة الخسارة
 * @returns حجم الصفقة
 */
export function calculatePositionSizeFromMaxLoss(
  maxLossAmount: number,
  lossPercentage: number
): number {
  return maxLossAmount / (lossPercentage / 100);
}

/**
 * التحقق من أن حجم الصفقة في الحدود الآمنة
 * 
 * @param positionSize - حجم الصفقة
 * @param availableBalance - الرصيد المتاح
 * @param maxPercentage - النسبة القصوى من الرصيد (افتراضي 95%)
 * @returns true إذا كان آمن
 */
export function validatePositionSize(
  positionSize: number,
  availableBalance: number,
  maxPercentage: number = 95
): boolean {
  const maxPositionSize = (availableBalance * maxPercentage) / 100;
  return positionSize <= maxPositionSize && positionSize > 0;
}


