/**
 * Realtime Dispatcher
 *
 * Broadcasts Ultra Signals to live subscribers through Supabase Realtime.
 *
 * Phase X.3 - Real-Time Engine
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltraSignal } from '../fusion/types';

const REALTIME_CHANNEL = 'ultra_signals_live';
const REALTIME_EVENT = 'ultra_signal:new';

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Ensure realtime channel is initialized.
 */
function getRealtimeChannel(client: SupabaseClient = supabase) {
  if (client !== supabase) {
    return client.channel(REALTIME_CHANNEL, {
      config: {
        broadcast: { ack: true }
      }
    });
  }

  if (!realtimeChannel) {
    realtimeChannel = supabase.channel(REALTIME_CHANNEL, {
      config: {
        broadcast: { ack: true }
      }
    });

    realtimeChannel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Channel status: ${status}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Failed to subscribe to channel:', err);
      }
    });
  }

  return realtimeChannel;
}

/**
 * Dispatch signal to realtime channel.
 */
export async function dispatchRealtimeSignal(
  signal: UltraSignal,
  options?: { client?: SupabaseClient }
) {
  try {
    const client = options?.client;
    const useCustomChannel = !!client && client !== supabase;
    const channel = getRealtimeChannel(client);

    if (useCustomChannel) {
      await channel.subscribe();
    }

    const payload = {
      signal,
      dispatchedAt: new Date().toISOString()
    };

    await channel.send({
      type: 'broadcast',
      event: REALTIME_EVENT,
      payload
    });

    console.log(`[Realtime] Dispatched signal ${signal.id} (${signal.symbol} ${signal.timeframe})`);

    if (useCustomChannel) {
      await channel.unsubscribe();
    }
  } catch (error) {
    console.error('[Realtime] Failed to dispatch signal:', error);
  }
}

/**
 * Subscribe to live signals
 * 
 * @param callback Function to call when new signal arrives
 * @returns Unsubscribe function
 */
export function subscribeToLiveSignals(
  callback: (signal: UltraSignal) => void
): () => void {
  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: {
      broadcast: { ack: true }
    }
  });

  channel
    .on('broadcast', { event: REALTIME_EVENT }, (payload) => {
      if (payload.payload?.signal) {
        callback(payload.payload.signal as UltraSignal);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to live signals');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error');
      }
    });

  // Return unsubscribe function
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Unsubscribe from live signals
 */
export function unsubscribeFromLiveSignals(channel: ReturnType<typeof supabase.channel>): void {
  if (channel) {
    channel.unsubscribe();
  }
}

/**
 * Gracefully close realtime channel (for cleanup/testing).
 */
export async function closeRealtimeChannel() {
  if (realtimeChannel) {
    await realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
}

