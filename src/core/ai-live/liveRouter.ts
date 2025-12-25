/**
 * Live Signal Router
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 * 
 * Manages live signal flow and routing
 */

import { subscribeToLiveAISignals } from './wsClient';
import { parseLiveSignal, filterByStrength, filterBySymbol, filterByTimeframe, filterBySide } from './liveParser';
import type { ParsedLiveSignal } from './liveParser';
import type { SignalCallback } from './wsClient';

export interface LiveRouterConfig {
  minStrength?: 'WEAK' | 'MODERATE' | 'STRONG';
  symbol?: string;
  timeframe?: string;
  side?: 'BUY' | 'SELL';
  maxSignals?: number;
}

export class LiveSignalRouter {
  private signals: ParsedLiveSignal[] = [];
  private unsubscribe: (() => void) | null = null;
  private config: LiveRouterConfig;
  private callbacks: Set<(signals: ParsedLiveSignal[]) => void> = new Set();

  constructor(config: LiveRouterConfig = {}) {
    this.config = {
      minStrength: 'WEAK',
      maxSignals: 100,
      ...config
    };
  }

  /**
   * Start listening to live signals
   */
  start(): void {
    if (this.unsubscribe) {
      return; // Already started
    }

    const callback: SignalCallback = (event) => {
      const parsed = parseLiveSignal(event);
      
      // Apply filters
      let filtered: ParsedLiveSignal[] = [parsed];
      
      if (this.config.minStrength) {
        filtered = filterByStrength(filtered, this.config.minStrength);
      }
      if (this.config.symbol) {
        filtered = filterBySymbol(filtered, this.config.symbol);
      }
      if (this.config.timeframe) {
        filtered = filterByTimeframe(filtered, this.config.timeframe);
      }
      if (this.config.side) {
        filtered = filterBySide(filtered, this.config.side);
      }

      if (filtered.length > 0) {
        // Add to signals array (newest first)
        this.signals = [parsed, ...this.signals].slice(0, this.config.maxSignals || 100);
        
        // Notify subscribers
        this.notifySubscribers();
      }
    };

    this.unsubscribe = subscribeToLiveAISignals(callback);
  }

  /**
   * Stop listening to live signals
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LiveRouterConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Re-filter existing signals
    this.applyFilters();
    this.notifySubscribers();
  }

  /**
   * Get current signals
   */
  getSignals(): ParsedLiveSignal[] {
    return this.signals;
  }

  /**
   * Subscribe to signal updates
   */
  subscribe(callback: (signals: ParsedLiveSignal[]) => void): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current signals
    callback(this.signals);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Apply filters to existing signals
   */
  private applyFilters(): void {
    let filtered = [...this.signals];
    
    if (this.config.minStrength) {
      filtered = filterByStrength(filtered, this.config.minStrength);
    }
    if (this.config.symbol) {
      filtered = filterBySymbol(filtered, this.config.symbol);
    }
    if (this.config.timeframe) {
      filtered = filterByTimeframe(filtered, this.config.timeframe);
    }
    if (this.config.side) {
      filtered = filterBySide(filtered, this.config.side);
    }
    
    this.signals = filtered;
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.signals);
      } catch (error) {
        console.error('Error in signal callback:', error);
      }
    });
  }

  /**
   * Clear all signals
   */
  clear(): void {
    this.signals = [];
    this.notifySubscribers();
  }
}

