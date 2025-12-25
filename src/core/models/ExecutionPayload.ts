/**
 * Execution Payload
 * 
 * Unified payload structure for trade execution
 * Used by execute-trade Edge Function
 */

/**
 * DCALevel
 */
export interface DCALevel {
  price: number;
  amountUsd: number;
  level: number;
}

/**
 * Capital allocation
 */
export interface CapitalAllocation {
  totalUsd: number;
  initialOrderPct: number;
  dcaBudgetPct: number;
}

/**
 * Risk management parameters
 */
export interface RiskParams {
  stopLossPrice: number;
  takeProfitPrice: number;
  trailing?: {
    enabled: boolean;
    activationPrice?: number;
    trailingDistance?: number;
  };
  partialTp?: {
    enabled: boolean;
    levels?: Array<{
      price: number;
      percentage: number; // Percentage of position to close
    }>;
  };
}

/**
 * Trade metadata
 */
export interface TradeMetadata {
  strategyId?: string;
  signalId?: string;
  isTestnet: boolean;
  clientOrderId?: string; // For idempotency
  notes?: string;
}

/**
 * Unified Execution Payload
 * 
 * This payload is sent to execute-trade Edge Function
 */
export interface ExecutionPayload {
  userId: string;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  symbol: string;
  side: 'buy' | 'sell';
  leverage?: number;
  capital: CapitalAllocation;
  dca: {
    enabled: boolean;
    levels: DCALevel[];
  };
  risk: RiskParams;
  meta: TradeMetadata;
}

/**
 * Order Type
 */
export type OrderType = 'market' | 'limit';

/**
 * Convert ExecutionPayload to legacy format for backward compatibility
 */
export function toLegacyFormat(payload: ExecutionPayload): {
  platform: string;
  symbol: string;
  marketType: 'spot' | 'futures';
  orderType: OrderType;
  entryPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  initialAmount: number;
  dcaLevels: Array<{
    level: number;
    targetPrice: number;
    amount: number;
  }>;
  leverage: number;
  strategy?: string;
  autoExecute: boolean;
} {
  // Calculate entry price (use first DCA level or current market price)
  const entryPrice = payload.dca.levels.length > 0
    ? payload.dca.levels[0].price
    : 0; // Should be filled from market price

  // Calculate initial amount
  const initialAmount = payload.capital.totalUsd * (payload.capital.initialOrderPct / 100);

  return {
    platform: payload.exchange,
    symbol: payload.symbol,
    marketType: payload.marketType,
    orderType: 'limit', // Default to limit, can be overridden
    entryPrice,
    stopLossPrice: payload.risk.stopLossPrice || null,
    takeProfitPrice: payload.risk.takeProfitPrice || null,
    initialAmount,
    dcaLevels: payload.dca.levels.map(level => ({
      level: level.level,
      targetPrice: level.price,
      amount: level.amountUsd
    })),
    leverage: payload.leverage || 1,
    strategy: payload.meta.strategyId,
    autoExecute: true // Always true for execution payload
  };
}


