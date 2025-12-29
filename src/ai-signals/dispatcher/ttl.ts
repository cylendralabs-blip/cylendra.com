/**
 * TTL Engine - Time To Live Management
 * 
 * Manages signal lifetime:
 * - Fast signals (1m-15m) → In-memory buffer with TTL
 * - Long-term signals (30m+) → Database storage
 * 
 * Phase X.3: Real-Time Engine + Telegram + TTL
 */

import type { UltraSignal } from '../fusion/types';

/**
 * In-memory buffer for live signals
 */
const liveSignalsBuffer: Map<string, UltraSignal> = new Map();

/**
 * TTL timeouts map
 */
const ttlTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * Calculate TTL duration based on timeframe
 */
export function signalTTL(timeframe: string): number {
  switch (timeframe) {
    case '1m':
      return 10 * 60 * 1000; // 10 minutes
    case '3m':
      return 15 * 60 * 1000; // 15 minutes
    case '5m':
      return 20 * 60 * 1000; // 20 minutes
    case '15m':
      return 45 * 60 * 1000; // 45 minutes
    case '30m':
      return 2 * 60 * 60 * 1000; // 2 hours
    case '1h':
      return 4 * 60 * 60 * 1000; // 4 hours
    case '4h':
      return 12 * 60 * 60 * 1000; // 12 hours
    case '1d':
      return 3 * 24 * 60 * 60 * 1000; // 3 days
    default:
      return 2 * 60 * 60 * 1000; // Default: 2 hours
  }
}

/**
 * Check if timeframe is considered long-term
 */
export function isLongTermTimeframe(timeframe: string): boolean {
  const longTermTimeframes = ['30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  return longTermTimeframes.includes(timeframe);
}

/**
 * Add signal to live buffer with TTL
 */
export function addLiveSignal(signal: UltraSignal): void {
  // Add to buffer
  liveSignalsBuffer.set(signal.id, signal);

  // Calculate TTL
  const ttl = signalTTL(signal.timeframe);

  // Schedule removal
  const timeout = setTimeout(() => {
    removeSignalFromBuffer(signal.id);
  }, ttl);

  // Store timeout reference
  ttlTimeouts.set(signal.id, timeout);

  console.log(`📌 Signal added to live buffer: ${signal.symbol} ${signal.timeframe} (TTL: ${ttl / 1000 / 60} minutes)`);
}

/**
 * Remove signal from buffer
 */
export function removeSignalFromBuffer(signalId: string): void {
  const signal = liveSignalsBuffer.get(signalId);
  
  if (signal) {
    liveSignalsBuffer.delete(signalId);
    
    // Clear timeout if exists
    const timeout = ttlTimeouts.get(signalId);
    if (timeout) {
      clearTimeout(timeout);
      ttlTimeouts.delete(signalId);
    }

    console.log(`🗑️ Signal removed from buffer: ${signal.symbol} ${signal.timeframe}`);
  }
}

/**
 * Get all live signals from buffer
 */
export function getLiveSignals(): UltraSignal[] {
  return Array.from(liveSignalsBuffer.values());
}

/**
 * Get live signals filtered by criteria
 */
export function getLiveSignalsFiltered(filters: {
  symbol?: string;
  timeframe?: string;
  side?: 'BUY' | 'SELL' | 'WAIT';
  minConfidence?: number;
}): UltraSignal[] {
  let signals = getLiveSignals();

  if (filters.symbol) {
    signals = signals.filter(s => s.symbol === filters.symbol);
  }

  if (filters.timeframe) {
    signals = signals.filter(s => s.timeframe === filters.timeframe);
  }

  if (filters.side) {
    signals = signals.filter(s => s.side === filters.side);
  }

  if (filters.minConfidence !== undefined) {
    signals = signals.filter(s => s.finalConfidence >= filters.minConfidence!);
  }

  return signals;
}

/**
 * Get signal by ID from buffer
 */
export function getLiveSignalById(signalId: string): UltraSignal | undefined {
  return liveSignalsBuffer.get(signalId);
}

/**
 * Clear all signals from buffer (cleanup)
 */
export function clearLiveSignalsBuffer(): void {
  // Clear all timeouts
  ttlTimeouts.forEach(timeout => clearTimeout(timeout));
  ttlTimeouts.clear();

  // Clear buffer
  liveSignalsBuffer.clear();

  console.log('🧹 Live signals buffer cleared');
}

/**
 * Get buffer statistics
 */
export function getBufferStats(): {
  totalSignals: number;
  byTimeframe: Record<string, number>;
  bySide: Record<string, number>;
} {
  const signals = getLiveSignals();
  
  const byTimeframe: Record<string, number> = {};
  const bySide: Record<string, number> = {};

  signals.forEach(signal => {
    byTimeframe[signal.timeframe] = (byTimeframe[signal.timeframe] || 0) + 1;
    bySide[signal.side] = (bySide[signal.side] || 0) + 1;
  });

  return {
    totalSignals: signals.length,
    byTimeframe,
    bySide
  };
}

