/**
 * Backtest Engine Module
 * 
 * Professional backtesting engine that simulates trades over historical data
 * Uses existing indicator engine, strategy engine, and risk logic
 * 
 * Phase 1: Backtest Engine - Task 1
 */

import { NormalizedCandle, Candle } from '@/services/marketData/types';
import { getHistoricalCandles } from '@/services/marketData/history/historyRouter';
import { calculateIndicatorsFromCandles } from '@/core/engines/indicatorEngine';
import { MainStrategy } from '@/strategies/mainStrategy';
import { StrategyContext, GeneratedSignal } from '@/strategies/Strategy';
import {
  simulateEntry,
  simulateDCA,
  simulateTP,
  simulateSL,
  updateTradePnL,
  updateEquity,
  initializeSimulationState,
  SimulationState,
  EntrySignal
} from './simulationEngine';
import { calculatePerformanceMetrics } from '@/services/performance/performanceEngine';
import { BotSettingsForm } from '@/core/config';
import { BacktestTrade, calculateTradePnL } from '@/core/models/BacktestTrade';
import { EquityPoint } from '@/core/models/EquityPoint';
import { calculateFee, FeeConfig } from './feeModel';
import { applySlippage, SlippageConfig, generateSeed } from './slippageModel';
import { calculatePositionSize, SizingParams } from '@/core/engines/sizingEngine';

/**
 * Backtest Engine Configuration
 */
export interface BacktestEngineConfig {
  /** Trading pair (e.g., 'BTCUSDT') */
  pair: string;
  
  /** Timeframe (e.g., '15m', '1h', '4h', '1D') */
  timeframe: string;
  
  /** Start date (ISO string or timestamp) */
  periodFrom: string | number;
  
  /** End date (ISO string or timestamp) */
  periodTo: string | number;
  
  /** Exchange name */
  exchange: 'binance' | 'okx';
  
  /** Market type */
  marketType: 'spot' | 'futures';
  
  /** Initial capital in USD */
  initialCapital: number;
  
  /** Bot settings (strategy parameters) */
  botSettings: BotSettingsForm;
  
  /** Fee configuration */
  fees: FeeConfig;
  
  /** Slippage configuration */
  slippage: SlippageConfig;
  
  /** Strategy ID (default: 'main-strategy') */
  strategyId?: string;
}

/**
 * Backtest Engine Result
 */
export interface BacktestEngineResult {
  /** Total PnL in USD */
  totalPnL: number;
  
  /** Total return percentage */
  totalReturnPct: number;
  
  /** Maximum drawdown percentage */
  maxDrawdown: number;
  
  /** Win rate percentage */
  winrate: number;
  
  /** Number of trades */
  numTrades: number;
  
  /** Equity curve points */
  equityCurve: EquityPoint[];
  
  /** All trades */
  trades: BacktestTrade[];
  
  /** Performance statistics */
  stats: {
    /** Average R (risk-reward ratio) */
    avgR: number;
    
    /** Maximum win in USD */
    maxWin: number;
    
    /** Maximum loss in USD */
    maxLoss: number;
    
    /** Profit factor */
    profitFactor: number;
    
    /** Sharpe ratio (optional) */
    sharpeRatio?: number;
    
    /** Average trade duration (hours) */
    avgTradeDurationHours?: number;
  };
  
  /** Metadata */
  metadata: {
    candlesProcessed: number;
    indicatorsCalculated: number;
    signalsGenerated: number;
    executionTimeMs: number;
  };
}

/**
 * Convert NormalizedCandle[] to Candle[]
 */
function convertToCandles(normalizedCandles: NormalizedCandle[]): Candle[] {
  return normalizedCandles.map(candle => ({
    openTime: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    closeTime: candle.closeTime || candle.timestamp + 3600000
  }));
}

/**
 * Run Backtest Engine
 * 
 * This is the main function that performs the backtest simulation
 * 
 * @param config - Backtest engine configuration
 * @returns Backtest engine result
 */
export async function runBacktestEngine(
  config: BacktestEngineConfig
): Promise<BacktestEngineResult> {
  const startTime = Date.now();
  
  try {
    // 1. Load historical OHLC candles
    const startTimestamp = typeof config.periodFrom === 'string' 
      ? new Date(config.periodFrom).getTime()
      : config.periodFrom;
    
    const endTimestamp = typeof config.periodTo === 'string'
      ? new Date(config.periodTo).getTime()
      : config.periodTo;
    
    const normalizedCandles = await getHistoricalCandles(
      config.exchange,
      config.pair,
      config.timeframe,
      startTimestamp,
      endTimestamp
    );
    
    if (normalizedCandles.length === 0) {
      throw new Error(`No historical data found for ${config.pair}`);
    }
    
    // Convert to Candle format
    const candles = convertToCandles(normalizedCandles);
    
    // 2. Initialize strategy
    const strategy = new MainStrategy();
    
    // 3. Initialize simulation state
    const state = initializeSimulationState(config.initialCapital);
    
    // 4. Process candles sequentially
    let indicatorsCalculated = 0;
    let signalsGenerated = 0;
    
    // Need at least 50 candles for indicators
    const minCandlesForIndicators = 50;
    
    for (let i = minCandlesForIndicators; i < candles.length; i++) {
      const currentCandle = candles[i];
      const historicalCandles = candles.slice(0, i + 1);
      
      // 4.1 Compute indicators using existing indicator engine
      const indicators = calculateIndicatorsFromCandles(historicalCandles);
      indicatorsCalculated++;
      
      // 4.2 Feed into strategy engine to generate signals
      const strategyContext: StrategyContext = {
        symbol: config.pair,
        timeframe: config.timeframe,
        candles: historicalCandles,
        currentPrice: currentCandle.close,
        indicators,
        botSettings: config.botSettings,
        lastSignals: [],
        openPositions: [],
        openTrades: [],
        activeTradesCount: state.openPositions.size,
        totalExposure: 0,
        availableBalance: state.availableBalance,
        exchange: config.exchange,
        marketType: config.marketType
      };
      
      // Generate signal
      const signal = await strategy.generateSignal(strategyContext);
      
      // 4.3 Decide: BUY / SELL / HOLD
      if (signal) {
        signalsGenerated++;
        
        // Check if we should enter (no open position for this symbol or DCA enabled)
        const existingPosition = Array.from(state.openPositions.values())
          .find(t => t.symbol === config.pair && t.status === 'open');
        
        if (!existingPosition) {
          // Enter new position
          const entrySignal: EntrySignal = {
            symbol: config.pair,
            side: signal.side,
            entryPrice: signal.price_at_signal || currentCandle.close,
            confidence: signal.confidence,
            stopLossPrice: signal.stop_loss_price,
            takeProfitPrice: signal.take_profit_price,
            reason: signal.reason,
            timestamp: currentCandle.timestamp
          };
          
          // Simulate entry
          const trade = simulateEntry(
            entrySignal,
            state,
            {
              timestamp: currentCandle.timestamp,
              open: currentCandle.open,
              high: currentCandle.high,
              low: currentCandle.low,
              close: currentCandle.close,
              volume: currentCandle.volume,
              closeTime: currentCandle.closeTime
            },
            {
              fees: config.fees,
              slippage: config.slippage,
              initialCapitalUsd: config.initialCapital
            },
            config.botSettings
          );
          
          if (trade) {
            state.openPositions.set(trade.id, trade);
          }
        }
      }
      
      // 4.4 Process open positions (TP/SL checks, DCA)
      for (const [tradeId, trade] of state.openPositions.entries()) {
        // Check DCA levels if enabled
        if (config.botSettings.enable_dca && config.botSettings.dca_levels > 0) {
          // Calculate DCA levels (simplified - can be enhanced)
          const priceDropPercent = 2; // 2% per level
          for (let dcaLevel = 1; dcaLevel <= config.botSettings.dca_levels; dcaLevel++) {
            const dropPercent = priceDropPercent * dcaLevel;
            const dcaPrice = trade.entryPrice * (1 - dropPercent / 100);
            
            // Check if DCA level is hit
            const priceHit = trade.side === 'buy'
              ? currentCandle.low <= dcaPrice
              : currentCandle.high >= dcaPrice;
            
            if (priceHit) {
              // Calculate DCA amount
              const totalAmount = config.botSettings.total_capital || config.initialCapital;
              const initialAmount = (totalAmount * (config.botSettings.initial_order_percentage || 25)) / 100;
              const remainingAmount = totalAmount - initialAmount;
              const dcaAmountPerLevel = remainingAmount / config.botSettings.dca_levels;
              const dcaQty = dcaAmountPerLevel / dcaPrice;
              
              // Simulate DCA
              const updatedTrade = simulateDCA(
                trade,
                {
                  timestamp: currentCandle.timestamp,
                  open: currentCandle.open,
                  high: currentCandle.high,
                  low: currentCandle.low,
                  close: currentCandle.close,
                  volume: currentCandle.volume,
                  closeTime: currentCandle.closeTime
                },
                dcaPrice,
                dcaQty,
                {
                  fees: config.fees,
                  slippage: config.slippage
                },
                state
              );
              
              if (updatedTrade) {
                state.openPositions.set(tradeId, updatedTrade);
              }
            }
          }
        }
        
        // Check TP
        if (trade.takeProfitPrice) {
          const tpPrice = trade.takeProfitPrice;
          const tpQty = trade.entryQty * 0.5; // Close 50% at TP (can be configurable)
          
          const updatedTrade = simulateTP(
            trade,
            {
              timestamp: currentCandle.timestamp,
              open: currentCandle.open,
              high: currentCandle.high,
              low: currentCandle.low,
              close: currentCandle.close,
              volume: currentCandle.volume,
              closeTime: currentCandle.closeTime
            },
            tpPrice,
            tpQty,
            {
              fees: config.fees,
              slippage: config.slippage
            },
            state
          );
          
          if (updatedTrade && updatedTrade.status === 'closed') {
            state.openPositions.delete(tradeId);
            state.closedPositions.push(updatedTrade);
            continue;
          } else if (updatedTrade) {
            state.openPositions.set(tradeId, updatedTrade);
          }
        }
        
        // Check SL (only if position still open)
        if (state.openPositions.has(tradeId)) {
          const currentTrade = state.openPositions.get(tradeId)!;
          if (currentTrade.stopLossPrice) {
            const slPrice = currentTrade.stopLossPrice;
            
            const updatedTrade = simulateSL(
              currentTrade,
              {
                timestamp: currentCandle.timestamp,
                open: currentCandle.open,
                high: currentCandle.high,
                low: currentCandle.low,
                close: currentCandle.close,
                volume: currentCandle.volume,
                closeTime: currentCandle.closeTime
              },
              slPrice,
              {
                fees: config.fees,
                slippage: config.slippage
              },
              state
            );
            
            if (updatedTrade && updatedTrade.status === 'closed') {
              state.openPositions.delete(tradeId);
              state.closedPositions.push(updatedTrade);
            }
          }
        }
        
        // Update PnL for open positions
        if (state.openPositions.has(tradeId)) {
          const currentTrade = state.openPositions.get(tradeId)!;
          const updatedTrade = updateTradePnL(currentTrade, {
            timestamp: currentCandle.timestamp,
            open: currentCandle.open,
            high: currentCandle.high,
            low: currentCandle.low,
            close: currentCandle.close,
            volume: currentCandle.volume,
            closeTime: currentCandle.closeTime
          });
          state.openPositions.set(tradeId, updatedTrade);
        }
      }
      
      // 4.5 Update equity curve
      updateEquity(state, {
        timestamp: currentCandle.timestamp,
        open: currentCandle.open,
        high: currentCandle.high,
        low: currentCandle.low,
        close: currentCandle.close,
        volume: currentCandle.volume,
        closeTime: currentCandle.closeTime
      }, {
        initialCapitalUsd: config.initialCapital
      });
    }
    
    // 5. Close any remaining open positions at end
    for (const [tradeId, trade] of state.openPositions.entries()) {
      const finalCandle = candles[candles.length - 1];
      const exitTrade: BacktestTrade = {
        ...trade,
        status: 'closed',
        exitTime: finalCandle.timestamp,
        exitPrice: finalCandle.close,
        exitQty: trade.entryQty,
        exitReason: 'timeout'
      };
      
      const { pnlUsd, pnlPct } = calculateTradePnL(exitTrade);
      exitTrade.pnlUsd = pnlUsd;
      exitTrade.pnlPct = pnlPct;
      
      state.closedPositions.push(exitTrade);
      state.openPositions.delete(tradeId);
    }
    
    // 6. Calculate performance metrics
    const metrics = calculatePerformanceMetrics(
      state.closedPositions,
      state.equityCurve,
      config.initialCapital,
      startTimestamp,
      endTimestamp
    );
    
    // 7. Calculate additional stats
    const winningTrades = state.closedPositions.filter(t => t.pnlUsd > 0);
    const losingTrades = state.closedPositions.filter(t => t.pnlUsd < 0);
    
    const avgR = winningTrades.length > 0 && losingTrades.length > 0
      ? (winningTrades.reduce((sum, t) => sum + t.pnlUsd, 0) / winningTrades.length) /
        Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlUsd, 0) / losingTrades.length)
      : 0;
    
    const maxWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnlUsd))
      : 0;
    
    const maxLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnlUsd))
      : 0;
    
    // 8. Build result
    const executionTimeMs = Date.now() - startTime;
    const finalEquity = state.equityCurve.length > 0
      ? state.equityCurve[state.equityCurve.length - 1].equity
      : config.initialCapital;
    
    const totalPnL = finalEquity - config.initialCapital;
    const totalReturnPct = (totalPnL / config.initialCapital) * 100;
    
    return {
      totalPnL,
      totalReturnPct,
      maxDrawdown: Math.abs(metrics.maxDrawdownPct),
      winrate: metrics.winRate,
      numTrades: state.closedPositions.length,
      equityCurve: state.equityCurve.map(point => ({
        time: point.time,
        equity: point.equity
      })),
      trades: state.closedPositions,
      stats: {
        avgR,
        maxWin,
        maxLoss,
        profitFactor: metrics.profitFactor,
        sharpeRatio: metrics.sharpeRatio,
        avgTradeDurationHours: metrics.avgTradeDurationHours
      },
      metadata: {
        candlesProcessed: candles.length,
        indicatorsCalculated,
        signalsGenerated,
        executionTimeMs
      }
    };
    
  } catch (error: any) {
    throw new Error(`Backtest engine error: ${error.message || 'Unknown error'}`);
  }
}

// Import calculateTradePnL from BacktestTrade model
import { calculateTradePnL } from '@/core/models/BacktestTrade';

