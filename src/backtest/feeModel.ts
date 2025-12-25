/**
 * Fee Model
 * 
 * Calculates trading fees (maker/taker)
 * 
 * Phase 9: Backtesting Engine - Task 5
 */

/**
 * Fee Configuration
 */
export interface FeeConfig {
  /** Maker fee percentage (e.g., 0.1 for 0.1%) */
  makerPct: number;
  /** Taker fee percentage (e.g., 0.1 for 0.1%) */
  takerPct: number;
}

/**
 * Order Type
 */
export type OrderType = 'maker' | 'taker';

/**
 * Calculate fee for a trade
 * 
 * @param notional - Trade notional value (price * quantity)
 * @param orderType - Order type (maker or taker)
 * @param feeConfig - Fee configuration
 * @returns Fee amount in USD
 */
export function calculateFee(
  notional: number,
  orderType: OrderType,
  feeConfig: FeeConfig
): number {
  const feePct = orderType === 'maker' ? feeConfig.makerPct : feeConfig.takerPct;
  return (notional * feePct) / 100;
}

/**
 * Calculate total fees for multiple trades
 * 
 * @param notional - Total notional value
 * @param makerNotional - Maker order notional value
 * @param takerNotional - Taker order notional value
 * @param feeConfig - Fee configuration
 * @returns Total fee amount in USD
 */
export function calculateTotalFees(
  makerNotional: number,
  takerNotional: number,
  feeConfig: FeeConfig
): number {
  const makerFee = calculateFee(makerNotional, 'maker', feeConfig);
  const takerFee = calculateFee(takerNotional, 'taker', feeConfig);
  return makerFee + takerFee;
}

/**
 * Apply fee to trade notional (reduce from profit)
 * 
 * @param notional - Trade notional value
 * @param orderType - Order type
 * @param feeConfig - Fee configuration
 * @returns Net notional after fees
 */
export function applyFee(
  notional: number,
  orderType: OrderType,
  feeConfig: FeeConfig
): number {
  const fee = calculateFee(notional, orderType, feeConfig);
  return notional - fee;
}

/**
 * Calculate round-trip fee (entry + exit)
 * 
 * @param entryNotional - Entry trade notional value
 * @param exitNotional - Exit trade notional value
 * @param entryOrderType - Entry order type
 * @param exitOrderType - Exit order type
 * @param feeConfig - Fee configuration
 * @returns Total round-trip fee
 */
export function calculateRoundTripFee(
  entryNotional: number,
  exitNotional: number,
  entryOrderType: OrderType,
  exitOrderType: OrderType,
  feeConfig: FeeConfig
): number {
  const entryFee = calculateFee(entryNotional, entryOrderType, feeConfig);
  const exitFee = calculateFee(exitNotional, exitOrderType, feeConfig);
  return entryFee + exitFee;
}

/**
 * Default fee configuration for Binance
 */
export const BINANCE_FEES: FeeConfig = {
  makerPct: 0.1, // 0.1% maker fee
  takerPct: 0.1  // 0.1% taker fee
};

/**
 * Default fee configuration for OKX
 */
export const OKX_FEES: FeeConfig = {
  makerPct: 0.08, // 0.08% maker fee
  takerPct: 0.1   // 0.1% taker fee
};

