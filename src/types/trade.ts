/**
 * Shared Trade Types
 * 
 * Phase 1.1: Unified types for Smart Trade and Execute Trade
 * Used across the entire trading system
 */

import { ExecutionPayload, DCALevel, RiskParams, CapitalAllocation } from '@/core/models/ExecutionPayload';

/**
 * Trade Calculation Result
 * 
 * Result of trade calculation based on risk parameters and bot settings
 */
export interface TradeCalculation {
  maxLossAmount: number;
  totalTradeAmount: number;
  initialOrderAmount: number;
  dcaReservedAmount: number;
  leveragedAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  dcaLevels: Array<{
    level: number;
    percentage: number;
    amount: number;
    targetPrice: number;
    cumulativeAmount: number;
    averageEntry: number;
  }>;
}

/**
 * Trade Source Mode
 * 
 * Identifies where the trade originated from
 */
export type TradeSourceMode = 
  | 'auto_bot'           // Automated bot trading
  | 'manual_execute'     // Execute Trade page
  | 'manual_smart_trade' // Smart Trade page
  | 'signal_execution';  // Direct signal execution

/**
 * Extended Execution Payload with source mode
 */
export interface ExtendedExecutionPayload extends ExecutionPayload {
  sourceMode: TradeSourceMode;
  managedByBot?: boolean;
  managementProfileId?: string;
}

/**
 * Risk Profile Constraints (from Bot Settings)
 * 
 * Read-only constraints that Smart Trade must respect
 */
export interface RiskProfileConstraints {
  maxRiskPerTrade: number;      // Maximum risk % per trade
  maxDCALevels: number;         // Maximum DCA levels allowed
  maxLeverage: number;          // Maximum leverage allowed
  maxConcurrentTrades?: number; // Maximum concurrent open trades
  maxTotalRisk?: number;        // Maximum total risk % on account
}

/**
 * Trade Validation Result
 */
export interface TradeValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'safe' | 'warning' | 'danger';
}
