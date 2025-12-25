/**
 * Copy Trading System - Type Definitions
 * 
 * Phase X.17 - Copy Trading System
 */

export type StrategyType = 'AI_MASTER' | 'HUMAN_BOT' | 'INFLUENCER';
export type StrategyStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type FollowerStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED';
export type AllocationMode = 'PERCENT' | 'FIXED';
export type MarketType = 'SPOT' | 'FUTURES';
export type TradeSide = 'BUY' | 'SELL' | 'LONG' | 'SHORT';
export type TradeDirection = 'OPEN' | 'CLOSE' | 'PARTIAL_CLOSE';
export type CopyTradeStatus = 'EXECUTED' | 'FAILED' | 'SKIPPED';
export type FeeModel = 'NONE' | 'PROFIT_SHARE' | 'SUBSCRIPTION';
export type RiskLabel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Master Execution Context
 * Represents a trade executed by the master strategy
 */
export interface MasterExecutionContext {
  strategyId: string;
  masterUserId: string;
  masterTradeId?: string;
  masterSignalExecutionId?: string;
  symbol: string;
  marketType: MarketType;
  side: TradeSide;
  leverage?: number;
  positionSize: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  direction: TradeDirection;
  timestamp: string;
}

/**
 * Follower Configuration
 * Settings for how a follower copies trades
 */
export interface FollowerConfig {
  id: string;
  followerUserId: string;
  strategyId: string;
  status: FollowerStatus;
  allocationMode: AllocationMode;
  allocationValue: number;
  maxDailyLoss?: number;
  maxTotalLoss?: number;
  maxOpenTrades: number;
  maxLeverage: number;
  riskMultiplier: number;
}

/**
 * Calculated Position Size
 * Result of position size calculation for a follower
 */
export interface CalculatedPosition {
  positionSize: number;
  leverage: number;
  allocationBefore: number;
  allocationAfter: number;
  reason?: string;
}

/**
 * Risk Check Result
 * Result of risk filter checks
 */
export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Copy Strategy
 */
export interface CopyStrategy {
  id: string;
  ownerUserId: string;
  botId?: string;
  name: string;
  description?: string;
  strategyType: StrategyType;
  isPublic: boolean;
  minDeposit: number;
  performanceWindow: string;
  status: StrategyStatus;
  feeModel: FeeModel;
  profitSharePercent?: number;
  monthlyFee?: number;
  riskLabel?: RiskLabel;
  createdAt: string;
  updatedAt: string;
}

/**
 * Copy Follower
 */
export interface CopyFollower {
  id: string;
  followerUserId: string;
  strategyId: string;
  status: FollowerStatus;
  allocationMode: AllocationMode;
  allocationValue: number;
  maxDailyLoss?: number;
  maxTotalLoss?: number;
  maxOpenTrades: number;
  maxLeverage: number;
  riskMultiplier: number;
  startCopyAt: string;
  stopCopyAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Copy Trade Log Entry
 */
export interface CopyTradeLog {
  id: string;
  strategyId: string;
  masterUserId: string;
  followerUserId: string;
  masterTradeId?: string;
  masterSignalExecutionId?: string;
  symbol: string;
  side: TradeSide;
  marketType: MarketType;
  leverage?: number;
  masterPositionSize: number;
  followerPositionSize: number;
  followerAllocationBefore?: number;
  followerAllocationAfter?: number;
  status: CopyTradeStatus;
  failReason?: string;
  pnlPercentage?: number;
  pnlAmount?: number;
  openedAt?: string;
  closedAt?: string;
  createdAt: string;
}

/**
 * Strategy Performance Metrics
 */
export interface StrategyPerformance {
  strategyId: string;
  totalCopiers: number;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  last30dReturn: number;
  last7dReturn: number;
  totalVolume: number;
  updatedAt: string;
}

