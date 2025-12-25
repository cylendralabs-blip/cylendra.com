/**
 * WebSocket Client for AI Live Signals
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 * Phase X.15 - Performance Optimization (compression, batching, reconnection)
 */

import { supabase } from '@/integrations/supabase/client';
import type { UltraSignal } from '@/ai-signals';

const REALTIME_CHANNEL = 'ai_signals_stream';
const REALTIME_EVENT = 'ai_signal:live';
const BATCH_INTERVAL_MS = 100; // Batch messages every 100ms
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1000;

export interface LiveSignalEvent {
  signal: UltraSignal;
  timestamp: string;
}

export type SignalCallback = (event: LiveSignalEvent) => void;

/**
 * Phase X.15: Compress signal data
 */
function compressSignal(signal: UltraSignal): Partial<UltraSignal> {
  // Remove unnecessary fields to reduce payload size
  return {
    id: signal.id,
    symbol: signal.symbol,
    timeframe: signal.timeframe,
    side: signal.side,
    finalConfidence: signal.finalConfidence,
    riskLevel: signal.riskLevel,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    // Only include essential scores
    aiScore: signal.aiScore,
    technicalScore: signal.technicalScore,
    // Omit detailed reasoning and metadata for compression
  };
}

/**
 * Phase X.15: Batch message queue
 */
class MessageBatcher {
  private queue: LiveSignalEvent[] = [];
  private timer: number | null = null;
  private callback: SignalCallback;

  constructor(callback: SignalCallback) {
    this.callback = callback;
  }

  add(event: LiveSignalEvent): void {
    this.queue.push(event);

    if (this.timer === null) {
      this.timer = window.setTimeout(() => {
        this.flush();
      }, BATCH_INTERVAL_MS);
    }
  }

  flush(): void {
    if (this.queue.length === 0) {
      this.timer = null;
      return;
    }

    // Process all queued events
    const events = [...this.queue];
    this.queue = [];
    this.timer = null;

    // Call callback for each event
    for (const event of events) {
      this.callback(event);
    }
  }
}

/**
 * Subscribe to live AI signals via WebSocket
 * Phase X.15: Enhanced with compression, batching, and reconnection
 */
export function subscribeToLiveAISignals(
  callback: SignalCallback
): () => void {
  let reconnectAttempts = 0;
  let batcher: MessageBatcher | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let reconnectTimeoutId: number | null = null;
  let isUnsubscribed = false;
  let maxAttemptsReached = false;

  const connect = () => {
    // Don't reconnect if unsubscribed or max attempts reached
    if (isUnsubscribed || maxAttemptsReached) {
      return;
    }

    // Clean up previous channel if exists
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    channel = supabase.channel(REALTIME_CHANNEL, {
      config: {
        broadcast: { ack: true },
        // Phase X.15: Optimize channel config
        presence: { key: 'user' },
      }
    });

    // Phase X.15: Use batcher for message processing
    if (!batcher) {
      batcher = new MessageBatcher(callback);
    }

    channel
      .on('broadcast', { event: REALTIME_EVENT }, (payload) => {
        if (payload.payload?.signal) {
          const signal = payload.payload.signal as UltraSignal;
          // Phase X.15: Decompress if needed (currently signals are already minimal)
          batcher?.add({
            signal,
            timestamp: payload.payload.timestamp || new Date().toISOString()
          });
        }
      })
      .subscribe((status) => {
        if (isUnsubscribed) {
          return; // Ignore status changes after unsubscribe
        }

        if (status === 'SUBSCRIBED') {
          if (import.meta.env.DEV) {
            console.log('[AI Live] ✅ Subscribed to live AI signals');
          }
          reconnectAttempts = 0; // Reset on successful connection
          maxAttemptsReached = false;
        } else if (status === 'CHANNEL_ERROR') {
          if (import.meta.env.DEV) {
            console.error('[AI Live] ❌ Channel error');
          }
          handleReconnect();
        } else if (status === 'TIMED_OUT') {
          if (import.meta.env.DEV) {
            console.warn('[AI Live] ⏱️ Channel timed out');
          }
          handleReconnect();
        } else if (status === 'CLOSED') {
          // CLOSED can be normal (e.g., during unsubscribe), only reconnect if not intentional
          if (!isUnsubscribed && !maxAttemptsReached) {
            if (import.meta.env.DEV) {
              console.warn('[AI Live] 🔌 Channel closed, attempting reconnect...');
            }
            handleReconnect();
          }
        }
      });
  };

  const handleReconnect = () => {
    // Don't reconnect if unsubscribed or already at max attempts
    if (isUnsubscribed || maxAttemptsReached) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      maxAttemptsReached = true;
      if (import.meta.env.DEV) {
        console.error(`[AI Live] ❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection attempts.`);
      }
      return;
    }

    reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * reconnectAttempts; // Exponential backoff

    if (import.meta.env.DEV) {
      console.log(`[AI Live] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    }

    // Clear any existing timeout
    if (reconnectTimeoutId !== null) {
      clearTimeout(reconnectTimeoutId);
    }

    reconnectTimeoutId = window.setTimeout(() => {
      reconnectTimeoutId = null;
      if (!isUnsubscribed && !maxAttemptsReached) {
        connect();
      }
    }, delay);
  };

  // Initial connection
  connect();

  // Return unsubscribe function
  return () => {
    isUnsubscribed = true;
    maxAttemptsReached = false;

    // Clear any pending reconnection
    if (reconnectTimeoutId !== null) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (batcher) {
      batcher.flush();
      batcher = null;
    }
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (e) {
        // Ignore errors during cleanup
      }
      channel = null;
    }
  };
}

/**
 * Unsubscribe from live AI signals
 */
export function unsubscribeFromLiveAISignals(channel: ReturnType<typeof supabase.channel>): void {
  if (channel) {
    channel.unsubscribe();
  }
}

