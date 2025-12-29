/**
 * Main Strategy Implementation
 * 
 * Production strategy using real indicators and market data
 * Phase 4: Strategy Engine
 */

import { Strategy, StrategyContext, GeneratedSignal } from './Strategy.ts';
import { TechnicalIndicatorsEngine } from '@/core/engines/indicatorEngine.ts';
import { calculateIndicatorsFromCandles } from '@/core/engines/indicatorEngine.ts';
import { calculateSignalConfidence } from '@/services/signals/signalScoring.ts';
import { Candle } from '@/services/marketData/types.ts';

/**
 * Main Strategy
 * 
 * Multi-indicator strategy using RSI, MACD, Bollinger Bands, etc.
 */
export class MainStrategy implements Strategy {
  id = 'main_strategy';
  name = 'Main Multi-Indicator Strategy';
  supportsMarket: ('spot' | 'futures')[] = ['spot', 'futures'];
  timeframes: string[] = ['5m', '15m', '30m', '1h', '4h', '1d'];

  /**
   * Generate signal from context
   */
  async generateSignal(ctx: StrategyContext): Promise<GeneratedSignal | null> {
    try {
      // Validate context
      if (!this.validateContext(ctx)) {
        return null;
      }

      // Need at least 50 candles for reliable indicators
      if (ctx.candles.length < 50) {
        console.warn(`Not enough candles for ${ctx.symbol}: ${ctx.candles.length}`);
        return null;
      }

      // Calculate indicators from candles
      const indicators = calculateIndicatorsFromCandles(ctx.candles);

      // Determine signal side based on indicators
      const signalSide = this.determineSignalSide(indicators, ctx.currentPrice);
      
      if (!signalSide) {
        return null; // No clear signal
      }

      // Calculate confidence score
      const score = calculateSignalConfidence(indicators, ctx.candles, signalSide);

      // Minimum confidence threshold (default: 60)
      const minConfidence = 60; // Can be added to botSettings later if needed
      if (score.confidence < minConfidence) {
        console.log(`Signal confidence too low for ${ctx.symbol}: ${score.confidence} < ${minConfidence}`);
        return null;
      }

      // Calculate entry price (current price)
      const entryPrice = ctx.currentPrice;

      // Calculate stop loss and take profit (if not provided by strategy)
      const { stopLoss, takeProfit } = this.calculateRiskLevels(
        entryPrice,
        signalSide,
        indicators,
        ctx.botSettings
      );

      // Generate signal
      const signal: GeneratedSignal = {
        user_id: (ctx.botSettings as any).user_id || '', // Should be set in context
        source: 'internal_engine',
        symbol: ctx.symbol,
        side: signalSide,
        timeframe: ctx.timeframe,
        price_at_signal: entryPrice,
        entry_price: entryPrice,
        confidence: score.confidence,
        riskLevel: score.riskLevel,
        reason: score.reasoning.join('; '),
        stop_loss_price: stopLoss,
        take_profit_price: takeProfit,
        meta: {
          strategyId: this.id,
          strategyName: this.name,
          indicatorsSnapshot: indicators,
          confidenceFactors: score.factors,
          reasoning: score.reasoning
        }
      };

      console.log(`✅ Generated ${signalSide.toUpperCase()} signal for ${ctx.symbol} with confidence ${score.confidence}%`);
      return signal;

    } catch (error) {
      console.error(`Error generating signal for ${ctx.symbol}:`, error);
      return null;
    }
  }

  /**
   * Determine signal side based on indicators
   */
  private determineSignalSide(
    indicators: any,
    currentPrice: number
  ): 'buy' | 'sell' | null {
    let buySignals = 0;
    let sellSignals = 0;

    // RSI signals
    if (indicators.rsi < 30) {
      buySignals += 2; // Strong buy
    } else if (indicators.rsi < 40) {
      buySignals += 1;
    } else if (indicators.rsi > 70) {
      sellSignals += 2; // Strong sell
    } else if (indicators.rsi > 60) {
      sellSignals += 1;
    }

    // MACD signals
    if (indicators.macd.trend === 'BULLISH' && indicators.macd.histogram > 0) {
      buySignals += 2;
    } else if (indicators.macd.trend === 'BULLISH') {
      buySignals += 1;
    } else if (indicators.macd.trend === 'BEARISH' && indicators.macd.histogram < 0) {
      sellSignals += 2;
    } else if (indicators.macd.trend === 'BEARISH') {
      sellSignals += 1;
    }

    // Bollinger Bands signals
    if (indicators.bollingerBands.position === 'BELOW_LOWER') {
      buySignals += 2; // Oversold
    } else if (indicators.bollingerBands.position === 'ABOVE_UPPER') {
      sellSignals += 2; // Overbought
    }

    // Stochastic signals
    if (indicators.stochastic.signal === 'OVERSOLD') {
      buySignals += 1;
    } else if (indicators.stochastic.signal === 'OVERBOUGHT') {
      sellSignals += 1;
    }

    // EMA trend signals
    if (indicators.ema20 > indicators.ema50) {
      buySignals += 1; // Uptrend
    } else if (indicators.ema20 < indicators.ema50) {
      sellSignals += 1; // Downtrend
    }

    // Determine signal
    if (buySignals >= 3 && buySignals > sellSignals) {
      return 'buy';
    } else if (sellSignals >= 3 && sellSignals > buySignals) {
      return 'sell';
    }

    return null; // No clear signal
  }

  /**
   * Calculate stop loss and take profit levels
   */
  private calculateRiskLevels(
    entryPrice: number,
    side: 'buy' | 'sell',
    indicators: any,
    botSettings: any
  ): { stopLoss: number; takeProfit: number } {
    // Use ATR for dynamic stop loss
    const atr = indicators.atr || 0;
    const atrMultiplier = 2; // Stop loss at 2x ATR

    // Use bot settings for SL/TP percentages
    const stopLossPercent = botSettings.stop_loss_percentage || 2;
    const takeProfitPercent = botSettings.take_profit_percentage || 4;

    let stopLoss: number;
    let takeProfit: number;

    if (side === 'buy') {
      // Use ATR if available, otherwise use percentage
      if (atr > 0) {
        stopLoss = entryPrice - (atr * atrMultiplier);
      } else {
        stopLoss = entryPrice * (1 - stopLossPercent / 100);
      }
      takeProfit = entryPrice * (1 + takeProfitPercent / 100);
    } else {
      // Sell side
      if (atr > 0) {
        stopLoss = entryPrice + (atr * atrMultiplier);
      } else {
        stopLoss = entryPrice * (1 + stopLossPercent / 100);
      }
      takeProfit = entryPrice * (1 - takeProfitPercent / 100);
    }

    // Round to reasonable precision
    const precision = Math.max(2, Math.floor(Math.log10(entryPrice)) - 3);
    stopLoss = Math.round(stopLoss * Math.pow(10, precision)) / Math.pow(10, precision);
    takeProfit = Math.round(takeProfit * Math.pow(10, precision)) / Math.pow(10, precision);

    return { stopLoss, takeProfit };
  }

  /**
   * Validate strategy context
   */
  validateContext(ctx: StrategyContext): boolean {
    if (!ctx.symbol || !ctx.timeframe) {
      return false;
    }

    if (!ctx.candles || ctx.candles.length === 0) {
      return false;
    }

    if (!ctx.currentPrice || ctx.currentPrice <= 0) {
      return false;
    }

    if (!ctx.botSettings) {
      return false;
    }

    if (!ctx.indicators) {
      return false;
    }

    // Check if timeframe is supported
    if (!this.timeframes.includes(ctx.timeframe)) {
      return false;
    }

    // Check if market type is supported
    if (!this.supportsMarket.includes(ctx.marketType)) {
      return false;
    }

    return true;
  }
}

