/**
 * Backtest Engine for Edge Function
 * 
 * Simplified version of backtest engine that works in Deno Edge Function
 * 
 * Phase 1: Backtest Engine - Task 3
 */

export interface BacktestEngineConfig {
  pair: string;
  timeframe: string;
  periodFrom: string | number;
  periodTo: string | number;
  exchange: 'binance' | 'okx';
  marketType: 'spot' | 'futures';
  initialCapital: number;
  botSettings: any;
  fees: { makerPct: number; takerPct: number };
  slippage: { enabled: boolean; maxPct: number };
  strategyId?: string;
}

export interface BacktestEngineResult {
  totalPnL: number;
  totalReturnPct: number;
  maxDrawdown: number;
  winrate: number;
  numTrades: number;
  equityCurve: Array<{ time: number; equity: number }>;
  trades: any[];
  stats: {
    avgR: number;
    maxWin: number;
    maxLoss: number;
    profitFactor: number;
    sharpeRatio?: number;
    avgTradeDurationHours?: number;
  };
  metadata: {
    candlesProcessed: number;
    indicatorsCalculated: number;
    signalsGenerated: number;
    executionTimeMs: number;
  };
}

/**
 * Fetch candles from Binance API
 */
async function fetchBinanceCandles(
  symbol: string,
  timeframe: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  const binanceSymbol = symbol.replace('/', '').toUpperCase();
  const timeframeMap: Record<string, string> = {
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1D': '1d'
  };
  const binanceTimeframe = timeframeMap[timeframe] || timeframe;

  const allCandles: any[] = [];
  let currentStart = startTime;
  const limit = 1000; // Binance max per request

  while (currentStart < endTime) {
    const params = new URLSearchParams({
      symbol: binanceSymbol,
      interval: binanceTimeframe,
      startTime: currentStart.toString(),
      endTime: Math.min(currentStart + (limit * getTimeframeMs(timeframe)), endTime).toString(),
      limit: limit.toString()
    });

    const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const klines = await response.json();
    
    if (klines.length === 0) break;

    const candles = klines.map((k: any[]) => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6]
    }));

    allCandles.push(...candles);
    currentStart = candles[candles.length - 1].timestamp + 1;

    // Rate limit protection
    if (klines.length < limit) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allCandles.filter(c => c.timestamp >= startTime && c.timestamp <= endTime);
}

/**
 * Get timeframe in milliseconds
 */
function getTimeframeMs(timeframe: string): number {
  const map: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000
  };
  return map[timeframe] || 60 * 60 * 1000;
}

/**
 * Simple moving average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Simple RSI calculation
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
  
  if (losses.length === 0) return 100;
  if (gains.length === 0) return 0;
  
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Run Backtest Engine
 */
export async function runBacktestEngine(
  config: BacktestEngineConfig
): Promise<BacktestEngineResult> {
  const startTime = Date.now();
  
  try {
    // Convert period to timestamps
    const periodFrom = typeof config.periodFrom === 'string' 
      ? new Date(config.periodFrom).getTime()
      : config.periodFrom;
    
    const periodTo = typeof config.periodTo === 'string'
      ? new Date(config.periodTo).getTime()
      : config.periodTo;

    console.log(`📊 Loading candles for ${config.pair} ${config.timeframe} from ${new Date(periodFrom).toISOString()} to ${new Date(periodTo).toISOString()}`);

    // 1. Load historical candles
    const candles = await fetchBinanceCandles(
      config.pair,
      config.timeframe,
      periodFrom,
      periodTo
    );

    if (candles.length === 0) {
      throw new Error(`No historical data found for ${config.pair}`);
    }

    console.log(`✅ Loaded ${candles.length} candles`);

    // 2. Initialize simulation state
    let equity = config.initialCapital;
    let availableBalance = config.initialCapital;
    const equityCurve: Array<{ time: number; equity: number }> = [];
    const trades: any[] = [];
    let openPosition: any = null;
    
    // Strategy parameters from botSettings
    // Log botSettings for debugging
    console.log('📊 Backtest Engine - Bot Settings:', {
      hasBotSettings: !!config.botSettings,
      botSettingsKeys: config.botSettings ? Object.keys(config.botSettings) : [],
      risk_percentage: config.botSettings?.risk_percentage,
      stop_loss_percentage: config.botSettings?.stop_loss_percentage,
      take_profit_percentage: config.botSettings?.take_profit_percentage,
      initial_order_percentage: config.botSettings?.initial_order_percentage,
      dca_levels: config.botSettings?.dca_levels
    });
    
    const riskPct = config.botSettings?.risk_percentage || 1;
    const stopLossPct = config.botSettings?.stop_loss_percentage || 2;
    const takeProfitPct = config.botSettings?.take_profit_percentage || 4;
    const initialOrderPct = config.botSettings?.initial_order_percentage || 50;
    const dcaLevels = config.botSettings?.dca_levels || 0;
    const maxActiveTrades = config.botSettings?.max_active_trades || 5;
    
    console.log('📊 Using Strategy Parameters:', {
      riskPct,
      stopLossPct,
      takeProfitPct,
      initialOrderPct,
      dcaLevels,
      maxActiveTrades
    });

    // 3. Process candles (need at least 50 for indicators)
    const minCandles = 50;
    let indicatorsCalculated = 0;
    let signalsGenerated = 0;
    let buySignals = 0;
    let sellSignals = 0;
    let tradesExecuted = 0;

    console.log(`🔄 Processing ${candles.length - minCandles} candles...`);

    for (let i = minCandles; i < candles.length; i++) {
      const candle = candles[i];
      const historicalPrices = candles.slice(0, i + 1).map(c => c.close);

      // Calculate indicators
      const sma20 = calculateSMA(historicalPrices, 20);
      const sma50 = calculateSMA(historicalPrices, 50);
      const rsi = calculateRSI(historicalPrices, 14);
      indicatorsCalculated++;

      // Improved strategy: More flexible conditions
      let signal: 'buy' | 'sell' | null = null;
      
      // Buy signal: Trend up (SMA20 > SMA50) and RSI not overbought
      if (!openPosition && sma20 && sma50 && rsi) {
        if (sma20 > sma50 && rsi < 75 && rsi > 25) {
          signal = 'buy';
          buySignals++;
        }
      }
      
      // Sell signal: Trend down or RSI extreme
      if (openPosition && sma20 && sma50 && rsi) {
        if (sma20 < sma50 || rsi > 75 || rsi < 25) {
          signal = 'sell';
          sellSignals++;
        }
      }
      
      signalsGenerated++;
      
      // Log first few signals for debugging
      if (i < minCandles + 10 && signal) {
        console.log(`🔔 Signal ${signal} at candle ${i}: SMA20=${sma20?.toFixed(2)}, SMA50=${sma50?.toFixed(2)}, RSI=${rsi?.toFixed(2)}`);
      }

      // Process signal
      if (signal === 'buy' && !openPosition) {
        // Calculate position size based on risk percentage
        const riskAmount = (equity * (riskPct / 100));
        const positionSize = (availableBalance * (initialOrderPct / 100));
        const qty = positionSize / candle.close;
        const fee = positionSize * (config.fees.takerPct / 100);
        const cost = positionSize + fee;

        if (cost <= availableBalance && qty > 0) {
          const stopLossPrice = candle.close * (1 - stopLossPct / 100);
          const takeProfitPrice = candle.close * (1 + takeProfitPct / 100);
          
          openPosition = {
            entryTime: candle.timestamp,
            entryPrice: candle.close,
            qty,
            cost,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice
          };
          
          availableBalance -= cost;
          tradesExecuted++;
          console.log(`📈 Entry #${tradesExecuted}: Price=${candle.close.toFixed(2)}, Qty=${qty.toFixed(6)}, SL=${stopLossPrice.toFixed(2)}, TP=${takeProfitPrice.toFixed(2)} at ${new Date(candle.timestamp).toISOString()}`);
        } else {
          console.log(`⚠️ Cannot enter: cost=${cost.toFixed(2)}, available=${availableBalance.toFixed(2)}, qty=${qty}`);
        }
      } else if (signal === 'sell' && openPosition) {
        // Check for SL/TP first
        let exitPrice = candle.close;
        let exitReason = 'signal';

        if (candle.low <= openPosition.stopLoss) {
          exitPrice = openPosition.stopLoss;
          exitReason = 'stop_loss';
        } else if (candle.high >= openPosition.takeProfit) {
          exitPrice = openPosition.takeProfit;
          exitReason = 'take_profit';
        }

        // Calculate exit
        const exitValue = openPosition.qty * exitPrice;
        const exitFee = exitValue * (config.fees.takerPct / 100);
        const netExitValue = exitValue - exitFee;
        
        const pnl = netExitValue - openPosition.cost;
        const pnlPct = (pnl / openPosition.cost) * 100;

        availableBalance += netExitValue;
        equity = availableBalance;

        // Map exit reason to database constraint values
        let dbExitReason: 'tp' | 'sl' | 'manual' | 'timeout' | 'risk' | null = null;
        if (exitReason === 'stop_loss') dbExitReason = 'sl';
        else if (exitReason === 'take_profit') dbExitReason = 'tp';
        else if (exitReason === 'signal') dbExitReason = 'manual';
        else if (exitReason === 'end_of_period') dbExitReason = 'timeout';
        
        trades.push({
          entryTime: openPosition.entryTime,
          entryPrice: openPosition.entryPrice,
          exitTime: candle.timestamp,
          exitPrice,
          qty: openPosition.qty,
          pnlUsd: pnl,
          pnlPct,
          exitReason: dbExitReason,
          status: 'closed',
          duration: candle.timestamp - openPosition.entryTime
        });

        console.log(`📉 Exit: ${exitPrice} at ${new Date(candle.timestamp).toISOString()}, PnL: ${pnl.toFixed(2)} USD (${pnlPct.toFixed(2)}%)`);

        openPosition = null;
      }

      // Check SL/TP for open position
      if (openPosition) {
        if (candle.low <= openPosition.stopLoss) {
          const exitValue = openPosition.qty * openPosition.stopLoss;
          const exitFee = exitValue * (config.fees.takerPct / 100);
          const netExitValue = exitValue - exitFee;
          const pnl = netExitValue - openPosition.cost;
          const pnlPct = (pnl / openPosition.cost) * 100;

          availableBalance += netExitValue;
          equity = availableBalance;

          trades.push({
            entryTime: openPosition.entryTime,
            entryPrice: openPosition.entryPrice,
            exitTime: candle.timestamp,
            exitPrice: openPosition.stopLoss,
            qty: openPosition.qty,
            pnlUsd: pnl,
            pnlPct,
            exitReason: 'sl',
            status: 'closed',
            duration: candle.timestamp - openPosition.entryTime
          });

          openPosition = null;
        } else if (candle.high >= openPosition.takeProfit) {
          const exitValue = openPosition.qty * openPosition.takeProfit;
          const exitFee = exitValue * (config.fees.takerPct / 100);
          const netExitValue = exitValue - exitFee;
          const pnl = netExitValue - openPosition.cost;
          const pnlPct = (pnl / openPosition.cost) * 100;

          availableBalance += netExitValue;
          equity = availableBalance;

          trades.push({
            entryTime: openPosition.entryTime,
            entryPrice: openPosition.entryPrice,
            exitTime: candle.timestamp,
            exitPrice: openPosition.takeProfit,
            qty: openPosition.qty,
            pnlUsd: pnl,
            pnlPct,
            exitReason: 'tp',
            status: 'closed',
            duration: candle.timestamp - openPosition.entryTime
          });

          openPosition = null;
        }
      }

      // Update equity curve (every 10 candles to reduce data)
      if (i % 10 === 0 || i === candles.length - 1) {
        equityCurve.push({
          time: candle.timestamp,
          equity: equity
        });
      }
    }

    // Close any remaining position
    if (openPosition && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const exitValue = openPosition.qty * lastCandle.close;
      const exitFee = exitValue * (config.fees.takerPct / 100);
      const netExitValue = exitValue - exitFee;
      const pnl = netExitValue - openPosition.cost;
      const pnlPct = (pnl / openPosition.cost) * 100;

      trades.push({
        entryTime: openPosition.entryTime,
        entryPrice: openPosition.entryPrice,
        exitTime: lastCandle.timestamp,
        exitPrice: lastCandle.close,
        qty: openPosition.qty,
        pnlUsd: pnl,
        pnlPct,
        exitReason: 'timeout',
        status: 'closed',
        duration: lastCandle.timestamp - openPosition.entryTime
      });
    }

    // 4. Calculate metrics
    const totalPnL = trades.reduce((sum, t) => sum + t.pnlUsd, 0);
    const totalReturnPct = (totalPnL / config.initialCapital) * 100;
    const winningTrades = trades.filter(t => t.pnlUsd > 0);
    const losingTrades = trades.filter(t => t.pnlUsd <= 0);
    const winrate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    
    const maxWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnlUsd)) : 0;
    const maxLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnlUsd)) : 0;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlUsd, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlUsd, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calculate max drawdown
    let maxEquity = config.initialCapital;
    let maxDrawdown = 0;
    for (const point of equityCurve) {
      if (point.equity > maxEquity) {
        maxEquity = point.equity;
      }
      const drawdown = ((maxEquity - point.equity) / maxEquity) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    console.log(`✅ Backtest completed: ${trades.length} trades, ${totalReturnPct.toFixed(2)}% return, ${winrate.toFixed(1)}% winrate`);

    return {
      totalPnL,
      totalReturnPct,
      maxDrawdown,
      winrate,
      numTrades: trades.length,
      equityCurve,
      trades: trades.map(t => ({
        symbol: config.pair,
        side: 'buy',
        entryTime: t.entryTime,
        entryPrice: t.entryPrice,
        entryQty: t.qty,
        entryFee: t.entryPrice * t.qty * (config.fees.takerPct / 100),
        exitTime: t.exitTime,
        exitPrice: t.exitPrice,
        exitQty: t.qty,
        exitFee: t.exitPrice * t.qty * (config.fees.takerPct / 100),
        pnlUsd: t.pnlUsd,
        pnlPct: t.pnlPct,
        exitReason: t.exitReason,
        status: t.status || 'closed',
        duration: t.duration,
        metadata: {}
      })),
      stats: {
        avgR: trades.length > 0 ? totalPnL / trades.length : 0,
        maxWin,
        maxLoss,
        profitFactor,
        avgTradeDurationHours: trades.length > 0 
          ? trades.reduce((sum, t) => sum + (t.duration / (1000 * 60 * 60)), 0) / trades.length 
          : 0
      },
      metadata: {
        candlesProcessed: candles.length,
        indicatorsCalculated,
        signalsGenerated,
        executionTimeMs
      }
    };

  } catch (error: any) {
    console.error('❌ Backtest engine error:', error);
    throw error;
  }
}
