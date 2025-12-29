/**
 * Hook for Live AI Signals
 * 
 * Phase X.8 - Real-Time AI Signal Stream
 */

import { useEffect, useState, useRef } from 'react';
import { LiveSignalRouter } from '@/core/ai-live';
import type { ParsedLiveSignal, LiveRouterConfig } from '@/core/ai-live';

export interface UseLiveAISignalsOptions extends LiveRouterConfig {
  enabled?: boolean;
  onNewSignal?: (signal: ParsedLiveSignal) => void;
}

export function useLiveAISignals(options: UseLiveAISignalsOptions = {}) {
  const { enabled = true, onNewSignal, ...routerConfig } = options;
  const [signals, setSignals] = useState<ParsedLiveSignal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const routerRef = useRef<LiveSignalRouter | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize router
    if (!routerRef.current) {
      routerRef.current = new LiveSignalRouter(routerConfig);
    }

    const router = routerRef.current;

    // Update config if changed
    router.updateConfig(routerConfig);

    // Subscribe to signal updates
    const unsubscribe = router.subscribe((newSignals) => {
      setSignals(newSignals);
      setIsConnected(true);

      // Call onNewSignal for new signals
      if (onNewSignal && newSignals.length > 0) {
        const latestSignal = newSignals[0];
        onNewSignal(latestSignal);
      }
    });

    // Start listening
    router.start();

    // Cleanup
    return () => {
      unsubscribe();
      router.stop();
    };
  }, [enabled, JSON.stringify(routerConfig), onNewSignal]);

  return {
    signals,
    isConnected,
    count: signals.length
  };
}

