/**
 * Execution Payload Builder
 * 
 * Builds ExecutionPayload from signal + botSettings
 * Phase 3: Auto-Trading Trigger
 */

import { ExecutionPayload, DCALevel } from '@/core/models/ExecutionPayload';
import { ProcessingSignal } from './types.ts';
import { BotSettingsForm } from '@/core/config';
import { calculateDCALevels } from '@/core/engines/dcaEngine';

/**
 * Build Execution Payload
 * 
 * Converts signal + botSettings + balances → ExecutionPayload
 */
export function buildExecutionPayload(params: {
  signal: ProcessingSignal;
  botSettings: BotSettingsForm;
  exchange: 'binance' | 'okx';
  isTestnet: boolean;
  availableBalance?: number;
}): ExecutionPayload {
  const { signal, botSettings, exchange, isTestnet, availableBalance } = params;
  
  // Determine side
  const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
  const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';
  
  // Determine market type
  const marketType: 'spot' | 'futures' = botSettings.market_type || 'spot';
  
  // Capital allocation
  const totalCapital = botSettings.total_capital || 1000;
  const initialOrderPct = botSettings.initial_order_percentage || 25;
  const dcaBudgetPct = 100 - initialOrderPct;
  
  // Limit by available balance if provided
  const effectiveCapital = availableBalance 
    ? Math.min(totalCapital, availableBalance * 0.95) // Use 95% of available
    : totalCapital;
  
  // Calculate risk-based position size
  const riskPct = botSettings.risk_percentage || 2;
  const maxRiskAmount = (effectiveCapital * riskPct) / 100;
  
  // Use entry price from signal
  const entryPrice = signal.entry_price;
  
  // Calculate position size based on risk
  // Position size = Risk amount / (Entry price * Stop loss %)
  const stopLossPct = botSettings.stop_loss_percentage || 5;
  const positionSize = maxRiskAmount / (stopLossPct / 100);
  
  // Limit position size to available capital
  const finalPositionSize = Math.min(positionSize, effectiveCapital);
  
  // Initial order amount
  const initialAmount = (finalPositionSize * initialOrderPct) / 100;
  
  // Calculate stop loss and take profit prices
  const stopLossPrice = signal.stop_loss_price || 
    (isBuy 
      ? entryPrice * (1 - stopLossPct / 100)
      : entryPrice * (1 + stopLossPct / 100)
    );
  
  const takeProfitPrice = signal.take_profit_price || 
    (isBuy
      ? entryPrice * (1 + (botSettings.take_profit_percentage || 3) / 100)
      : entryPrice * (1 - (botSettings.take_profit_percentage || 3) / 100)
    );
  
  // Build DCA levels if enabled
  const dcaLevels: DCALevel[] = [];
  if (botSettings.dca_levels && botSettings.dca_levels > 0) {
    const remainingAmount = finalPositionSize - initialAmount;
    const dcaAmountPerLevel = remainingAmount / botSettings.dca_levels;
    const priceDropPercent = 2; // 2% per level
    
    for (let i = 1; i <= botSettings.dca_levels; i++) {
      const dropPercent = priceDropPercent * i;
      const dcaPrice = isBuy
        ? entryPrice * (1 - dropPercent / 100) // Buy lower
        : entryPrice * (1 + dropPercent / 100); // Sell higher
      
      dcaLevels.push({
        level: i,
        price: dcaPrice,
        amountUsd: dcaAmountPerLevel
      });
    }
  }
  
  // Build risk parameters
  const riskParams = {
    stopLossPrice: isBuy ? stopLossPrice : stopLossPrice,
    takeProfitPrice: isBuy ? takeProfitPrice : takeProfitPrice,
    trailing: botSettings.profit_taking_strategy === 'trailing' ? {
      enabled: true,
      activationPrice: takeProfitPrice * 0.95, // Activate at 95% of TP
      trailingDistance: (botSettings.trailing_stop_distance || 1) / 100
    } : undefined,
    partialTp: botSettings.profit_taking_strategy === 'partial' ? {
      enabled: true,
      levels: [
        {
          price: takeProfitPrice * 0.5, // 50% of TP
          percentage: botSettings.partial_tp_percentage_1 || 25
        },
        {
          price: takeProfitPrice * 0.75, // 75% of TP
          percentage: botSettings.partial_tp_percentage_2 || 25
        },
        {
          price: takeProfitPrice, // 100% of TP
          percentage: botSettings.partial_tp_percentage_3 || 25
        }
      ].filter(level => level.percentage > 0)
    } : undefined
  };
  
  // Generate client order ID for idempotency
  const clientOrderId = `signal_${signal.id}_${marketType}_${side}`;
  
  // Build metadata
  const meta = {
    strategyId: signal.strategy_name,
    signalId: signal.id,
    isTestnet,
    clientOrderId,
    notes: `Auto-executed from signal: ${signal.strategy_name}`
  };
  
  // Build payload
  const payload: ExecutionPayload = {
    userId: signal.user_id,
    exchange,
    marketType,
    symbol: signal.symbol,
    side,
    leverage: marketType === 'futures' ? (botSettings.leverage || 1) : undefined,
    capital: {
      totalUsd: finalPositionSize,
      initialOrderPct,
      dcaBudgetPct
    },
    dca: {
      enabled: botSettings.dca_levels > 0,
      levels: dcaLevels
    },
    risk: riskParams,
    meta
  };
  
  return payload;
}

/**
 * Convert ExecutionPayload to legacy format for execute-trade
 * 
 * This is a compatibility layer for the existing execute-trade function
 */
export function payloadToLegacyFormat(payload: ExecutionPayload): {
  platform: string;
  symbol: string;
  marketType: 'spot' | 'futures';
  orderType: 'market' | 'limit';
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
  signalId?: string;
} {
  // Use entry price from signal (from first DCA level if exists, otherwise need to fetch)
  const entryPrice = payload.dca.levels.length > 0
    ? payload.dca.levels[0].price
    : payload.risk.stopLossPrice * 1.05; // Fallback (not ideal, but signal should have entry_price)
  
  // Calculate initial amount
  const initialAmount = payload.capital.totalUsd * (payload.capital.initialOrderPct / 100);
  
  return {
    platform: payload.exchange,
    symbol: payload.symbol,
    marketType: payload.marketType,
    orderType: payload.meta.isTestnet ? 'market' : 'limit', // Testnet uses market for faster execution
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
    autoExecute: true,
    signalId: payload.meta.signalId
  };
}

