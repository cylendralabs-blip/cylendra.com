/**
 * Signal Dispatcher - Main Entry Point
 * 
 * Handles Ultra Signal distribution:
 * - Real-time broadcasting
 * - Telegram notifications
 * - TTL management
 * - History storage
 * 
 * Phase X.3: Real-Time Engine + Telegram + TTL
 */

import { dispatchRealtimeSignal } from './realtime';
import { broadcastToTelegram, type TelegramConfig } from './telegram';
import { addLiveSignal, isLongTermTimeframe } from './ttl';
import { saveSignalToHistory } from './history';
import type { UltraSignal } from '../fusion/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Handle Ultra Signal - Main entry point for Phase X.3
 * 
 * This function:
 * 1. Broadcasts signal to real-time channel
 * 2. Sends to Telegram
 * 3. Adds to live buffer with TTL
 * 4. Saves to history if long-term
 */
export interface UltraSignalDispatchOptions {
  supabaseClient?: SupabaseClient;
  telegram?: Partial<TelegramConfig>;
  disableRealtime?: boolean;
  disableTelegram?: boolean;
  disableHistory?: boolean;
  disableBuffer?: boolean;
}

export async function handleUltraSignal(
  signal: UltraSignal,
  options?: UltraSignalDispatchOptions
): Promise<{
  realtime: boolean;
  telegram: boolean;
  buffer: boolean;
  history: boolean;
}> {
  const results = {
    realtime: false,
    telegram: false,
    buffer: false,
    history: false
  };

  try {
    // 1) Broadcast to real-time channel
    if (!options?.disableRealtime) {
      try {
        await dispatchRealtimeSignal(signal, { client: options?.supabaseClient });
        results.realtime = true;
      } catch (error) {
        console.error('Error dispatching realtime signal:', error);
      }
    }

    // 2) Broadcast to Telegram
    if (!options?.disableTelegram) {
      try {
        results.telegram = await broadcastToTelegram(signal, options?.telegram);
      } catch (error) {
        console.error('Error broadcasting to Telegram:', error);
      }
    }

    // 3) Add to live buffer with TTL
    if (!options?.disableBuffer) {
      try {
        addLiveSignal(signal);
        results.buffer = true;
      } catch (error) {
        console.error('Error adding signal to buffer:', error);
      }
    }

    // 4) Save to history if long-term timeframe
    if (
      !options?.disableHistory &&
      isLongTermTimeframe(signal.timeframe) &&
      signal.side !== 'WAIT'
    ) {
      try {
        results.history = await saveSignalToHistory(signal, options?.supabaseClient);
      } catch (error) {
        console.error('Error saving signal to history:', error);
      }
    }

    console.log(`✅ Ultra Signal handled: ${signal.symbol} ${signal.timeframe} ${signal.side}`, results);
    
    return results;
  } catch (error) {
    console.error('Error in handleUltraSignal:', error);
    return results;
  }
}

/**
 * Export all dispatcher functions
 */
export {
  dispatchRealtimeSignal,
  subscribeToLiveSignals,
  unsubscribeFromLiveSignals
} from './realtime';

export {
  broadcastToTelegram,
  formatSignalForTelegram,
  testTelegramConnection
} from './telegram';

export {
  addLiveSignal,
  removeSignalFromBuffer,
  getLiveSignals,
  getLiveSignalsFiltered,
  getLiveSignalById,
  clearLiveSignalsBuffer,
  getBufferStats,
  signalTTL,
  isLongTermTimeframe
} from './ttl';

export {
  saveSignalToHistory,
  getSignalsFromHistory,
  getHistoryStats
} from './history';

