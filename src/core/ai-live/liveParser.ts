/**
 * Live Signal Parser
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 * 
 * Parses and transforms live signals for UI display
 */

import type { UltraSignal } from '@/ai-signals';
import type { LiveSignalEvent } from './wsClient';

export interface ParsedLiveSignal {
  id: string;
  symbol: string;
  timeframe: string;
  side: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  aiScore: number;
  technicalScore: number;
  volumeScore: number;
  patternScore: number;
  waveScore: number;
  sentimentScore: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskLevel: string;
  bias: string;
  timestamp: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  summary?: string;
  reasoning?: string[];
}

/**
 * Parse live signal event to UI-friendly format
 */
export function parseLiveSignal(event: LiveSignalEvent): ParsedLiveSignal {
  const signal = event.signal;

  // Determine strength
  let strength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK';
  if (signal.finalConfidence >= 75) {
    strength = 'STRONG';
  } else if (signal.finalConfidence >= 60) {
    strength = 'MODERATE';
  }

  return {
    id: signal.id,
    symbol: signal.symbol,
    timeframe: signal.timeframe,
    side: signal.side,
    confidence: signal.finalConfidence,
    aiScore: signal.aiScore,
    technicalScore: signal.technicalScore,
    volumeScore: signal.volumeScore,
    patternScore: signal.patternScore,
    waveScore: signal.waveScore,
    sentimentScore: signal.sentimentScore,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    riskLevel: signal.riskLevel,
    bias: signal.bias,
    timestamp: event.timestamp || signal.createdAt,
    strength,
    summary: signal.summary,
    reasoning: signal.reasoning
  };
}

/**
 * Filter signals by strength
 */
export function filterByStrength(
  signals: ParsedLiveSignal[],
  minStrength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK'
): ParsedLiveSignal[] {
  const strengthOrder = { WEAK: 0, MODERATE: 1, STRONG: 2 };
  const minLevel = strengthOrder[minStrength];

  return signals.filter((signal) => strengthOrder[signal.strength] >= minLevel);
}

/**
 * Filter signals by symbol
 */
export function filterBySymbol(
  signals: ParsedLiveSignal[],
  symbol?: string
): ParsedLiveSignal[] {
  if (!symbol) return signals;
  return signals.filter((signal) => signal.symbol === symbol);
}

/**
 * Filter signals by timeframe
 */
export function filterByTimeframe(
  signals: ParsedLiveSignal[],
  timeframe?: string
): ParsedLiveSignal[] {
  if (!timeframe) return signals;
  return signals.filter((signal) => signal.timeframe === timeframe);
}

/**
 * Filter signals by side
 */
export function filterBySide(
  signals: ParsedLiveSignal[],
  side?: 'BUY' | 'SELL'
): ParsedLiveSignal[] {
  if (!side) return signals;
  return signals.filter((signal) => signal.side === side);
}

