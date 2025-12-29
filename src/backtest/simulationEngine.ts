/**
 * Simulation Engine
 * 
 * Simulates trade execution in backtesting environment
 * Handles entry, DCA, TP, SL execution with fees and slippage
 * 
 * Phase 9: Backtesting Engine - Task 3
 */

import { NormalizedCandle } from '@/services/marketData/types';
import { BacktestTrade, Fill, addFill, calculateTradePnL } from '@/core/models/BacktestTrade';
import { calculateFee, applyFee, OrderType } from './feeModel';
import { applySlippage, generateSeed, SlippageConfig } from './slippageModel';
import { BotSettingsForm } from '@/core/config';
import { calculatePositionSize, SizingParams } from '@/core/engines/sizingEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simulation State
 */
export interface SimulationState {
  /** Current equity */
  equity: number;
  /** Available balance */
  availableBalance: number;
  /** Open positions */
  openPositions: Map<string, BacktestTrade>;
  /** Closed positions */
  closedPositions: BacktestTrade[];
  /** Equity curve points */
  equityCurve: Array<{ time: number; equity: number }>;
}

/**
 * Entry Signal
 */
export interface EntrySignal {
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  confidence: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  reason: string;
  timestamp: number;
}

/**
 * Simulate trade entry
 * 
 * @param signal - Entry signal
 * @param state - Current simulation state
 * @param candle - Current candle
 * @param config - Backtest configuration (includes fees, slippage)
 * @param botSettings - Bot settings
 * @returns New trade or null if entry failed
 */
export function simulateEntry(
  signal: EntrySignal,
  state: SimulationState,
  candle: NormalizedCandle,
  config: {
    fees: { makerPct: number; takerPct: number };
    slippage: SlippageConfig;
    initialCapitalUsd: number;
  },
  botSettings: BotSettingsForm
): BacktestTrade | null {
  // Check if we have enough balance
  if (state.availableBalance <= 0) {
    return null;
  }
  
  // Calculate position size
  const sizingParams: SizingParams = {
    availableBalance: state.availableBalance,
    riskPercentage: botSettings.risk_percentage || 2,
    lossPercentage: signal.stopLossPrice 
      ? Math.abs((signal.entryPrice - signal.stopLossPrice) / signal.entryPrice) * 100
      : 2, // Default 2% loss
    leverage: botSettings.leverage || 1,
    entryPrice: signal.entryPrice,
    initialOrderPercentage: botSettings.initial_order_percentage || 100
  };
  
  const sizingResult = calculatePositionSize(sizingParams);
  
  // Check if we can afford this trade
  if (sizingResult.positionSize > state.availableBalance) {
    return null;
  }
  
  // Apply slippage to entry price
  const entrySeed = generateSeed(candle.timestamp, signal.symbol);
  const entryPriceWithSlippage = applySlippage(
    signal.entryPrice,
    signal.side,
    config.slippage,
    entrySeed
  );
  
  // Calculate quantity
  const entryQty = sizingResult.initialAmount / entryPriceWithSlippage;
  
  // Calculate entry fee
  const entryNotional = entryPriceWithSlippage * entryQty;
  const entryOrderType: OrderType = 'taker'; // Assume taker for simulation
  const entryFee = calculateFee(entryNotional, entryOrderType, config.fees);
  
  // Create trade
  const trade: BacktestTrade = {
    id: uuidv4(),
    symbol: signal.symbol,
    side: signal.side,
    entryTime: candle.timestamp,
    entryPrice: entryPriceWithSlippage,
    entryQty: entryQty,
    entryFee: entryFee,
    dcaFills: [],
    tpFills: [],
    pnlUsd: 0,
    pnlPct: 0,
    maxAdverseMovePct: 0,
    maxFavorableMovePct: 0,
    status: 'open',
    metadata: {
      strategy: 'main',
      signalId: signal.reason
    }
  };
  
  // Update state
  state.availableBalance -= entryNotional + entryFee;
  state.openPositions.set(trade.id, trade);
  
  return trade;
}

/**
 * Simulate DCA fill
 * 
 * @param trade - Trade to add DCA to
 * @param candle - Current candle
 * @param dcaLevel - DCA level price
 * @param dcaQty - DCA quantity
 * @param config - Backtest configuration
 * @returns Updated trade
 */
export function simulateDCA(
  trade: BacktestTrade,
  candle: NormalizedCandle,
  dcaLevel: number,
  dcaQty: number,
  config: {
    fees: { makerPct: number; takerPct: number };
    slippage: SlippageConfig;
  },
  state: SimulationState
): BacktestTrade | null {
  // Check if DCA price is hit
  const priceHit = trade.side === 'buy'
    ? candle.low <= dcaLevel // Buy at lower price
    : candle.high >= dcaLevel; // Sell at higher price
  
  if (!priceHit) {
    return null;
  }
  
  // Check if we have enough balance
  const dcaNotional = dcaLevel * dcaQty;
  if (dcaNotional > state.availableBalance) {
    return null;
  }
  
  // Apply slippage
  const dcaSeed = generateSeed(candle.timestamp, `${trade.symbol}_dca`);
  const dcaPriceWithSlippage = applySlippage(
    dcaLevel,
    trade.side,
    config.slippage,
    dcaSeed
  );
  
  // Calculate fee
  const actualNotional = dcaPriceWithSlippage * dcaQty;
  const dcaFee = calculateFee(actualNotional, 'taker', config.fees);
  
  // Create fill
  const fill: Fill = {
    time: candle.timestamp,
    price: dcaPriceWithSlippage,
    qty: dcaQty,
    fee: dcaFee
  };
  
  // Update state
  state.availableBalance -= actualNotional + dcaFee;
  
  // Add fill to trade
  return addFill(trade, fill, 'dca');
}

/**
 * Simulate TP fill
 * 
 * @param trade - Trade to close with TP
 * @param candle - Current candle
 * @param tpPrice - Take profit price
 * @param tpQty - Quantity to close (can be partial)
 * @param config - Backtest configuration
 * @returns Updated trade
 */
export function simulateTP(
  trade: BacktestTrade,
  candle: NormalizedCandle,
  tpPrice: number,
  tpQty: number,
  config: {
    fees: { makerPct: number; takerPct: number };
    slippage: SlippageConfig;
  },
  state: SimulationState
): BacktestTrade | null {
  // Check if TP price is hit
  const priceHit = trade.side === 'buy'
    ? candle.high >= tpPrice // Sell at higher price
    : candle.low <= tpPrice; // Buy back at lower price
  
  if (!priceHit) {
    return null;
  }
  
  // Ensure we don't close more than open quantity
  const openQty = trade.entryQty - trade.tpFills.reduce((sum, f) => sum + f.qty, 0);
  const actualQty = Math.min(tpQty, openQty);
  
  if (actualQty <= 0) {
    return null;
  }
  
  // Apply slippage
  const tpSeed = generateSeed(candle.timestamp, `${trade.symbol}_tp`);
  const tpPriceWithSlippage = applySlippage(
    tpPrice,
    trade.side === 'buy' ? 'sell' : 'buy', // Opposite side for exit
    config.slippage,
    tpSeed
  );
  
  // Calculate fee
  const tpNotional = tpPriceWithSlippage * actualQty;
  const tpFee = calculateFee(tpNotional, 'taker', config.fees);
  
  // Create fill
  const fill: Fill = {
    time: candle.timestamp,
    price: tpPriceWithSlippage,
    qty: actualQty,
    fee: tpFee
  };
  
  // Update state
  const realizedPnL = calculateExitPnL(trade, fill, 'tp');
  state.availableBalance += tpNotional - tpFee;
  
  // Add fill to trade
  return addFill(trade, fill, 'tp');
}

/**
 * Simulate SL fill
 * 
 * @param trade - Trade to close with SL
 * @param candle - Current candle
 * @param slPrice - Stop loss price
 * @param config - Backtest configuration
 * @returns Updated trade
 */
export function simulateSL(
  trade: BacktestTrade,
  candle: NormalizedCandle,
  slPrice: number,
  config: {
    fees: { makerPct: number; takerPct: number };
    slippage: SlippageConfig;
  },
  state: SimulationState
): BacktestTrade | null {
  // Check if SL price is hit
  const priceHit = trade.side === 'buy'
    ? candle.low <= slPrice // Sell at lower price (loss)
    : candle.high >= slPrice; // Buy back at higher price (loss)
  
  if (!priceHit) {
    return null;
  }
  
  // Close entire position
  const slQty = trade.entryQty;
  
  // Apply slippage
  const slSeed = generateSeed(candle.timestamp, `${trade.symbol}_sl`);
  const slPriceWithSlippage = applySlippage(
    slPrice,
    trade.side === 'buy' ? 'sell' : 'buy', // Opposite side for exit
    config.slippage,
    slSeed
  );
  
  // Calculate fee
  const slNotional = slPriceWithSlippage * slQty;
  const slFee = calculateFee(slNotional, 'taker', config.fees);
  
  // Create fill
  const fill: Fill = {
    time: candle.timestamp,
    price: slPriceWithSlippage,
    qty: slQty,
    fee: slFee
  };
  
  // Update state
  state.availableBalance += slNotional - slFee;
  
  // Add fill to trade
  return addFill(trade, fill, 'sl');
}

/**
 * Update trade PnL for open positions
 * 
 * @param trade - Trade to update
 * @param candle - Current candle
 * @returns Updated trade
 */
export function updateTradePnL(
  trade: BacktestTrade,
  candle: NormalizedCandle
): BacktestTrade {
  if (trade.status === 'closed') {
    return trade;
  }
  
  // Calculate unrealized PnL
  const currentPrice = candle.close;
  const entryValue = trade.entryPrice * trade.entryQty;
  const currentValue = currentPrice * trade.entryQty;
  
  const unrealizedPnL = trade.side === 'buy'
    ? currentValue - entryValue
    : entryValue - currentValue;
  
  // Subtract fees
  const { pnlUsd, pnlPct } = calculateTradePnL({
    ...trade,
    exitPrice: currentPrice,
    exitQty: trade.entryQty
  });
  
  // Calculate max adverse/favorable moves
  const highPnL = trade.side === 'buy'
    ? (candle.high * trade.entryQty - entryValue) / entryValue * 100
    : (entryValue - candle.low * trade.entryQty) / entryValue * 100;
  
  const lowPnL = trade.side === 'buy'
    ? (candle.low * trade.entryQty - entryValue) / entryValue * 100
    : (entryValue - candle.high * trade.entryQty) / entryValue * 100;
  
  return {
    ...trade,
    pnlUsd,
    pnlPct,
    maxAdverseMovePct: Math.min(trade.maxAdverseMovePct, lowPnL),
    maxFavorableMovePct: Math.max(trade.maxFavorableMovePct, highPnL)
  };
}

/**
 * Calculate exit PnL
 */
function calculateExitPnL(
  trade: BacktestTrade,
  fill: Fill,
  type: 'tp' | 'sl'
): number {
  const entryValue = trade.entryPrice * trade.entryQty;
  const exitValue = fill.price * fill.qty;
  
  const basePnL = trade.side === 'buy'
    ? exitValue - (trade.entryPrice * fill.qty)
    : (trade.entryPrice * fill.qty) - exitValue;
  
  const totalFees = (trade.entryFee || 0) + fill.fee;
  return basePnL - totalFees;
}

/**
 * Update simulation state equity
 * 
 * @param state - Simulation state
 * @param candle - Current candle
 * @param config - Backtest configuration
 */
export function updateEquity(
  state: SimulationState,
  candle: NormalizedCandle,
  config: { initialCapitalUsd: number }
): void {
  // Calculate unrealized PnL from open positions
  let unrealizedPnl = 0;
  
  for (const [tradeId, trade] of state.openPositions.entries()) {
    const updatedTrade = updateTradePnL(trade, candle);
    unrealizedPnl += updatedTrade.pnlUsd;
    state.openPositions.set(tradeId, updatedTrade);
  }
  
  // Calculate realized PnL from closed positions
  const realizedPnl = state.closedPositions.reduce(
    (sum, trade) => sum + trade.pnlUsd,
    0
  );
  
  // Total equity = available balance + unrealized PnL + realized PnL
  // For simplicity, we track equity as: initial + all realized + unrealized
  const totalEquity = config.initialCapitalUsd + realizedPnl + unrealizedPnl;
  
  // Add to equity curve
  state.equityCurve.push({
    time: candle.timestamp,
    equity: totalEquity
  });
  
  state.equity = totalEquity;
}

/**
 * Initialize simulation state
 */
export function initializeSimulationState(
  initialCapital: number
): SimulationState {
  return {
    equity: initialCapital,
    availableBalance: initialCapital,
    openPositions: new Map(),
    closedPositions: [],
    equityCurve: [{
      time: Date.now(),
      equity: initialCapital
    }]
  };
}

