/**
 * Backtest Runner
 * 
 * Main backtesting engine that runs strategies on historical data
 * Deterministic and reproducible
 * 
 * Phase 9: Backtesting Engine - Task 4
 */

import { BacktestConfig } from '@/core/models/BacktestConfig';
import { BacktestResult, createEmptyBacktestResult } from '@/core/models/BacktestResult';
import { BacktestTrade } from '@/core/models/BacktestTrade';
import { EquityPoint } from '@/core/models/EquityPoint';
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
    closeTime: candle.closeTime || candle.timestamp + 3600000 // Default to 1 hour if not provided
  }));
}

/**
 * Run backtest
 * 
 * @param config - Backtest configuration
 * @param onProgress - Progress callback (optional)
 * @returns Backtest result
 */
export async function runBacktest(
  config: BacktestConfig,
  onProgress?: (progress: { current: number; total: number; message: string }) => void
): Promise<BacktestResult> {
  const startTime = Date.now();
  const result = createEmptyBacktestResult(
    `backtest_${Date.now()}`,
    config
  );
  
  result.status = 'running';
  result.startedAt = startTime;
  
  try {
    onProgress?.({ current: 0, total: 100, message: 'Loading historical data...' });
    
    // Load historical candles for all symbols
    const startTimestamp = new Date(config.startDate).getTime();
    const endTimestamp = new Date(config.endDate).getTime();
    
    const allCandles: Map<string, NormalizedCandle[]> = new Map();
    
    for (const symbol of config.symbols) {
      const candles = await getHistoricalCandles(
        config.exchange,
        symbol,
        config.timeframe,
        startTimestamp,
        endTimestamp
      );
      
      if (candles.length === 0) {
        throw new Error(`No historical data found for ${symbol}`);
      }
      
      allCandles.set(symbol, candles);
      onProgress?.({
        current: config.symbols.indexOf(symbol) + 1,
        total: config.symbols.length * 2,
        message: `Loaded ${candles.length} candles for ${symbol}`
      });
    }
    
    // Initialize strategy
    const strategy = new MainStrategy();
    
    // Initialize simulation state
    const state = initializeSimulationState(config.initialCapitalUsd);
    
    // Merge bot settings with overrides
    const botSettings: BotSettingsForm = {
      ...config.botSettingsOverride,
      // Add defaults if not provided
      risk_percentage: config.botSettingsOverride?.risk_percentage || 2,
      leverage: config.botSettingsOverride?.leverage || 1,
      initial_order_percentage: config.botSettingsOverride?.initial_order_percentage || 100,
      enable_dca: config.botSettingsOverride?.enable_dca || false,
      dca_levels: config.botSettingsOverride?.dca_levels || [],
      take_profit_pct: config.botSettingsOverride?.take_profit_pct || 2,
      stop_loss_pct: config.botSettingsOverride?.stop_loss_pct || 2
    } as BotSettingsForm;
    
    // Get minimum candles length
    const minCandles = Math.min(...Array.from(allCandles.values()).map(c => c.length));
    
    onProgress?.({ current: config.symbols.length, total: config.symbols.length + minCandles, message: 'Running backtest...' });
    
    // Process candles
    for (let i = 50; i < minCandles; i++) {
      // Process each symbol
      for (const symbol of config.symbols) {
        const candles = allCandles.get(symbol)!;
        const currentCandle = candles[i];
        const historicalCandles = candles.slice(0, i + 1);
        
        // Convert NormalizedCandle[] to Candle[] for indicators
        const candlesForIndicators = convertToCandles(historicalCandles);
        
        // Calculate indicators
        const indicators = calculateIndicatorsFromCandles(candlesForIndicators);
        
        // Create strategy context
        const strategyContext: StrategyContext = {
          symbol,
          timeframe: config.timeframe,
          candles: candlesForIndicators,
          currentPrice: currentCandle.close,
          indicators,
          botSettings,
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
        
        // Process signal if available
        if (signal) {
          // Check if we should enter
          if (state.openPositions.size === 0 || (botSettings.dca_levels && botSettings.dca_levels > 0)) {
            const entrySignal: EntrySignal = {
              symbol,
              side: signal.side,
              entryPrice: signal.price_at_signal || currentCandle.close,
              confidence: signal.confidence,
              stopLossPrice: signal.stop_loss_price,
              takeProfitPrice: signal.take_profit_price,
              reason: signal.reason,
              timestamp: currentCandle.timestamp
            };
            
            // Check if we already have an open position for this symbol
            const existingPosition = Array.from(state.openPositions.values())
              .find(t => t.symbol === symbol && t.status === 'open');
            
            if (!existingPosition) {
              // Enter new position
              const trade = simulateEntry(
                entrySignal,
                state,
                currentCandle,
                {
                  fees: config.fees,
                  slippage: config.slippage,
                  initialCapitalUsd: config.initialCapitalUsd
                },
                botSettings
              );
              
              if (trade) {
                state.openPositions.set(trade.id, trade);
              }
            }
          }
        }
        
        // Process open positions (TP/SL checks)
        for (const [tradeId, trade] of state.openPositions.entries()) {
          // Calculate TP/SL prices from botSettings or use signal prices
          const takeProfitPct = botSettings.take_profit_percentage || 2;
          const stopLossPct = botSettings.stop_loss_percentage || 2;
          
          // Calculate TP price
          const tpPrice = signal?.take_profit_price || (
            trade.side === 'buy'
              ? trade.entryPrice * (1 + takeProfitPct / 100)
              : trade.entryPrice * (1 - takeProfitPct / 100)
          );
          
          // Calculate SL price
          const slPrice = signal?.stop_loss_price || (
            trade.side === 'buy'
              ? trade.entryPrice * (1 - stopLossPct / 100)
              : trade.entryPrice * (1 + stopLossPct / 100)
          );
          
          // Check TP
          if (tpPrice) {
            const tpQty = trade.entryQty * (takeProfitPct / 100);
            
            const updatedTrade = simulateTP(
              trade,
              currentCandle,
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
              continue; // Skip SL check if TP closed the position
            } else if (updatedTrade) {
              state.openPositions.set(tradeId, updatedTrade);
            }
          }
          
          // Check SL (only if position still open)
          if (slPrice && state.openPositions.has(tradeId)) {
            const currentTrade = state.openPositions.get(tradeId)!;
            const updatedTrade = simulateSL(
              currentTrade,
              currentCandle,
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
          
          // Update PnL for open positions (only if still open)
          if (state.openPositions.has(tradeId)) {
            const currentTrade = state.openPositions.get(tradeId)!;
            const updatedTrade = updateTradePnL(currentTrade, currentCandle);
            state.openPositions.set(tradeId, updatedTrade);
          }
        }
        
        // Update equity
        updateEquity(state, currentCandle, {
          initialCapitalUsd: config.initialCapitalUsd
        });
      }
      
      // Progress update
      if (i % 100 === 0) {
        onProgress?.({
          current: config.symbols.length + i,
          total: config.symbols.length + minCandles,
          message: `Processed ${i}/${minCandles} candles`
        });
      }
    }
    
    // Close any remaining open positions at end
    for (const [tradeId, trade] of state.openPositions.entries()) {
      const finalCandle = allCandles.get(trade.symbol)?.slice(-1)[0];
      if (finalCandle) {
        // Close at final price
        const exitTrade: BacktestTrade = {
          ...trade,
          status: 'closed',
          exitTime: finalCandle.timestamp,
          exitPrice: finalCandle.close,
          exitQty: trade.entryQty,
          exitReason: 'timeout'
        };
        
        const { pnlUsd, pnlPct } = calcTradePnL(exitTrade);
        exitTrade.pnlUsd = pnlUsd;
        exitTrade.pnlPct = pnlPct;
        
        state.closedPositions.push(exitTrade);
        state.openPositions.delete(tradeId);
      }
    }
    
    // Calculate performance metrics
    onProgress?.({ current: 99, total: 100, message: 'Calculating performance metrics...' });
    
    const metrics = calculatePerformanceMetrics(
      state.closedPositions,
      state.equityCurve,
      config.initialCapitalUsd,
      startTimestamp,
      endTimestamp
    );
    
    // Build result
    result.trades = state.closedPositions;
    result.equityCurve = state.equityCurve.map(point => ({
      time: point.time,
      equity: point.equity
    }));
    result.metrics = metrics;
    result.status = 'completed';
    result.completedAt = Date.now();
    result.executionTimeMs = Date.now() - startTime;
    result.metadata = {
      candlesProcessed: minCandles,
      symbolsProcessed: config.symbols.length,
      tradesGenerated: state.closedPositions.length
    };
    
    onProgress?.({ current: 100, total: 100, message: 'Backtest completed!' });
    
    return result;
    
  } catch (error: any) {
    result.status = 'failed';
    result.error = error.message || 'Unknown error';
    result.completedAt = Date.now();
    result.executionTimeMs = Date.now() - startTime;
    throw error;
  }
}

import { calculateTradePnL as calcTradePnL } from '@/core/models/BacktestTrade';

