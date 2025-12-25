/**
 * DCA (Dollar Cost Averaging) Engine
 * 
 * محرك حساب مستويات DCA
 * 
 * Phase 1: نقل الحسابات من UI إلى Core Engines
 */

import { BotSettingsForm } from '../config';

export interface DCALevel {
  level: number;
  priceDropPercent: number;
  entryPrice: number;
  amount: number;
  cumulativeAmount: number;
  averageEntry: number;
  stopLossPrice?: number;
  actualLossAmount?: number;
}

export interface DCAParams {
  entryPrice: number;
  totalAmount: number;
  initialAmount: number;
  dcaLevels: number;
  priceDropPercent: number; // عادة 2% لكل مستوى
  stopLossCalculationMethod?: 'initial_entry' | 'average_position';
  stopLossPercentage?: number;
  maxAllowedLoss?: number;
}

export interface DCAResult {
  levels: DCALevel[];
  totalInvested: number;
  totalQuantity: number;
  finalAverageEntry: number;
}

/**
 * حساب مستويات DCA
 * 
 * @param params - معاملات حساب DCA
 * @returns نتيجة حساب DCA
 */
export function calculateDCALevels(params: DCAParams): DCAResult {
  const {
    entryPrice,
    totalAmount,
    initialAmount,
    dcaLevels,
    priceDropPercent,
    stopLossCalculationMethod,
    stopLossPercentage,
    maxAllowedLoss
  } = params;

  const levels: DCALevel[] = [];
  
  // حساب المبلغ المتبقي للـ DCA
  const remainingAmount = totalAmount - initialAmount;
  const dcaAmountPerLevel = remainingAmount / dcaLevels;

  // حساب تراكمي
  let cumulativeInvestment = initialAmount;
  let cumulativeQuantity = initialAmount / entryPrice;

  for (let i = 1; i <= dcaLevels; i++) {
    // حساب نسبة انخفاض السعر لهذا المستوى
    const dropPercent = priceDropPercent * i; // 2%, 4%, 6%, etc.
    
    // حساب سعر الدخول لهذا المستوى
    const dcaEntryPrice = entryPrice * (1 - dropPercent / 100);

    // تحديث الاستثمار التراكمي
    cumulativeInvestment += dcaAmountPerLevel;
    cumulativeQuantity += dcaAmountPerLevel / dcaEntryPrice;

    // حساب متوسط سعر الدخول
    const averageEntry = cumulativeInvestment / cumulativeQuantity;

    const level: DCALevel = {
      level: i,
      priceDropPercent: dropPercent,
      entryPrice: dcaEntryPrice,
      amount: dcaAmountPerLevel,
      cumulativeAmount: cumulativeInvestment,
      averageEntry
    };

    // حساب Stop Loss إذا كان مطلوباً
    if (stopLossCalculationMethod && stopLossPercentage && maxAllowedLoss) {
      let levelStopLoss: number;
      let actualLossAmount: number;

      if (stopLossCalculationMethod === 'average_position') {
        // من سعر المركز المتوسط (متحرك)
        levelStopLoss = averageEntry - (maxAllowedLoss / cumulativeQuantity);
        actualLossAmount = (averageEntry - levelStopLoss) * cumulativeQuantity;
      } else {
        // من سعر الدخول الأول (ثابت)
        levelStopLoss = entryPrice - (maxAllowedLoss / cumulativeQuantity);
        actualLossAmount = (entryPrice - levelStopLoss) * cumulativeQuantity;
      }

      // التأكد من أن stop loss لا يكون أعلى من سعر الدخول
      if (levelStopLoss >= averageEntry) {
        levelStopLoss = averageEntry * 0.99; // 1% أقل من سعر الدخول كحد أدنى
        actualLossAmount = (averageEntry - levelStopLoss) * cumulativeQuantity;
      }

      // إعادة حساب الخسارة الفعلية للتأكد من الدقة
      actualLossAmount = Math.min(actualLossAmount, maxAllowedLoss || Infinity);

      level.stopLossPrice = levelStopLoss;
      level.actualLossAmount = actualLossAmount;
    }

    levels.push(level);
  }

  const finalLevel = levels[levels.length - 1];

  return {
    levels,
    totalInvested: finalLevel.cumulativeAmount,
    totalQuantity: finalLevel.cumulativeAmount / finalLevel.averageEntry,
    finalAverageEntry: finalLevel.averageEntry
  };
}

/**
 * حساب متوسط سعر الدخول بعد DCA
 * 
 * @param levels - مستويات DCA
 * @returns متوسط سعر الدخول
 */
export function calculateAverageEntry(levels: DCALevel[]): number {
  if (levels.length === 0) return 0;

  const finalLevel = levels[levels.length - 1];
  return finalLevel.averageEntry;
}

/**
 * حساب الكمية الإجمالية بعد DCA
 * 
 * @param levels - مستويات DCA
 * @returns الكمية الإجمالية
 */
export function calculateTotalQuantity(levels: DCALevel[]): number {
  if (levels.length === 0) return 0;

  const finalLevel = levels[levels.length - 1];
  return finalLevel.cumulativeAmount / finalLevel.averageEntry;
}


