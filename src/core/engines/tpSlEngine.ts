/**
 * Take Profit / Stop Loss Engine
 * 
 * محرك حساب مستويات TP/SL
 * 
 * Phase 1: نقل الحسابات من UI إلى Core Engines
 */

export interface TPSLParams {
  entryPrice: number;
  direction: 'long' | 'short';
  takeProfitPercentage?: number;
  stopLossPercentage?: number;
  riskRewardRatio?: number;
  useRiskRewardRatio?: boolean; // إذا true، يتم حساب TP من R:R بدلاً من نسبة ثابتة
}

export interface TPSLResult {
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  takeProfitPercentage: number;
  stopLossPercentage: number;
}

/**
 * حساب مستويات TP/SL
 * 
 * @param params - معاملات حساب TP/SL
 * @returns نتيجة حساب TP/SL
 */
export function calculateTPSL(params: TPSLParams): TPSLResult {
  const {
    entryPrice,
    direction,
    takeProfitPercentage = 3,
    stopLossPercentage = 5,
    riskRewardRatio = 2,
    useRiskRewardRatio = false
  } = params;

  // حساب Stop Loss
  const stopLossPrice = direction === 'long'
    ? entryPrice * (1 - stopLossPercentage / 100)  // Long: SL أسفل السعر
    : entryPrice * (1 + stopLossPercentage / 100); // Short: SL أعلى السعر

  // حساب Take Profit
  let takeProfitPrice: number;
  let finalTakeProfitPercentage: number;

  if (useRiskRewardRatio && riskRewardRatio > 0) {
    // حساب TP بناءً على Risk:Reward Ratio
    const riskAmount = Math.abs(entryPrice - stopLossPrice);
    const rewardAmount = riskAmount * riskRewardRatio;
    
    takeProfitPrice = direction === 'long'
      ? entryPrice + rewardAmount  // Long: TP أعلى السعر
      : entryPrice - rewardAmount; // Short: TP أسفل السعر

    finalTakeProfitPercentage = (rewardAmount / entryPrice) * 100;
  } else {
    // حساب TP بناءً على نسبة ثابتة
    takeProfitPrice = direction === 'long'
      ? entryPrice * (1 + takeProfitPercentage / 100)  // Long: TP أعلى السعر
      : entryPrice * (1 - takeProfitPercentage / 100); // Short: TP أسفل السعر

    finalTakeProfitPercentage = takeProfitPercentage;
  }

  // حساب Risk/Reward
  const riskAmount = Math.abs(entryPrice - stopLossPrice);
  const rewardAmount = Math.abs(takeProfitPrice - entryPrice);
  const actualRiskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  return {
    entryPrice,
    takeProfitPrice,
    stopLossPrice,
    riskAmount,
    rewardAmount,
    riskRewardRatio: actualRiskRewardRatio,
    takeProfitPercentage: finalTakeProfitPercentage,
    stopLossPercentage
  };
}

/**
 * حساب TP/SL من إشارة
 * 
 * @param entryPrice - سعر الدخول
 * @param stopLossPrice - سعر Stop Loss (إن وجد)
 * @param takeProfitPrice - سعر Take Profit (إن وجد)
 * @param direction - اتجاه الصفقة
 * @returns نتيجة حساب TP/SL
 */
export function calculateTPSLFromPrices(
  entryPrice: number,
  stopLossPrice: number | null,
  takeProfitPrice: number | null,
  direction: 'long' | 'short'
): TPSLResult | null {
  if (!stopLossPrice || !takeProfitPrice) {
    return null;
  }

  const riskAmount = Math.abs(entryPrice - stopLossPrice);
  const rewardAmount = Math.abs(takeProfitPrice - entryPrice);
  const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  const stopLossPercentage = (riskAmount / entryPrice) * 100;
  const takeProfitPercentage = (rewardAmount / entryPrice) * 100;

  return {
    entryPrice,
    takeProfitPrice,
    stopLossPrice,
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    takeProfitPercentage,
    stopLossPercentage
  };
}

/**
 * التحقق من صحة مستويات TP/SL
 * 
 * @param entryPrice - سعر الدخول
 * @param stopLossPrice - سعر Stop Loss
 * @param takeProfitPrice - سعر Take Profit
 * @param direction - اتجاه الصفقة
 * @returns true إذا كانت المستويات صحيحة
 */
export function validateTPSL(
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  direction: 'long' | 'short'
): boolean {
  if (direction === 'long') {
    // Long: SL يجب أن يكون أسفل السعر، TP أعلى السعر
    return stopLossPrice < entryPrice && takeProfitPrice > entryPrice;
  } else {
    // Short: SL يجب أن يكون أعلى السعر، TP أسفل السعر
    return stopLossPrice > entryPrice && takeProfitPrice < entryPrice;
  }
}


