import { useEffect, useMemo, useState } from 'react';
import {
  type UltraSignal,
  getSignalsFromHistory,
  subscribeToLiveSignals
} from '@/ai-signals';

const INITIAL_LIMIT = 40;
const MAX_SIGNALS = 120;

export interface LiveSignalsState {
  signals: UltraSignal[];
  isLoading: boolean;
  isRealtimeConnected: boolean;
  latestSignal: UltraSignal | null;
  lastUpdated: string | null;
}

export function useUltraSignalsLive(): LiveSignalsState {
  const [signals, setSignals] = useState<UltraSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setRealtimeConnected] = useState(false);
  const [latestSignal, setLatestSignal] = useState<UltraSignal | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    async function bootstrap() {
      try {
        setIsLoading(true);
        const history = await getSignalsFromHistory({
          limit: INITIAL_LIMIT
        });

        if (mounted) {
          setSignals(history);
          setLastUpdated(new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to load initial live signals:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }

      unsubscribe = subscribeToLiveSignals((signal) => {
        setSignals((prev) => {
          const existingIndex = prev.findIndex((s) => s.id === signal.id);
          const next = existingIndex >= 0 ? [...prev] : [signal, ...prev];

          if (existingIndex >= 0) {
            next[existingIndex] = signal;
          } else {
            if (next.length > MAX_SIGNALS) {
              next.pop();
            }
          }

          return next;
        });

        setRealtimeConnected(true);
        setLatestSignal(signal);
        setLastUpdated(new Date().toISOString());
      });
    }

    bootstrap();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        setRealtimeConnected(false);
      }
    };
  }, []);

  // Sort signals by createdAt descending to ensure latest at top
  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [signals]);

  return {
    signals: sortedSignals,
    isLoading,
    isRealtimeConnected,
    latestSignal,
    lastUpdated
  };
}

