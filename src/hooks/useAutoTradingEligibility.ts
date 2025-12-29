/**
 * Hook to check if a signal is eligible for auto trading
 * 
 * Phase X: Auto Trading UI from Signals
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface SignalEligibility {
  isEligible: boolean;
  reasons: string[];
}

interface AutoTradingSettings {
  auto_trading_enabled: boolean;
  auto_trading_mode: 'off' | 'full_auto' | 'semi_auto';
  allowed_signal_sources: string[];
  allowed_directions: string[];
  min_signal_confidence: number | null;
  max_auto_trades_per_day: number | null;
  max_concurrent_auto_positions: number | null;
}

interface Signal {
  signal_type: string;
  confidence_score: number;
  source?: string;
}

export function useAutoTradingEligibility(signal: Signal | null): SignalEligibility {
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['auto-trading-settings', user?.id],
    queryFn: async (): Promise<AutoTradingSettings | null> => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('bot_settings')
        .select('auto_trading_enabled, auto_trading_mode, allowed_signal_sources, allowed_directions, min_signal_confidence, max_auto_trades_per_day, max_concurrent_auto_positions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching auto trading settings:', error);
        return null;
      }

      return {
        auto_trading_enabled: data?.auto_trading_enabled ?? false,
        auto_trading_mode: data?.auto_trading_mode || 'off',
        allowed_signal_sources: data?.allowed_signal_sources || [],
        allowed_directions: data?.allowed_directions || [],
        min_signal_confidence: data?.min_signal_confidence ?? null,
        max_auto_trades_per_day: data?.max_auto_trades_per_day ?? null,
        max_concurrent_auto_positions: data?.max_concurrent_auto_positions ?? null,
      };
    },
    enabled: !!user,
  });

  return useMemo(() => {
    if (!signal || !settings) {
      return { isEligible: false, reasons: [] };
    }

    const reasons: string[] = [];

    // Check if auto trading is enabled
    if (!settings.auto_trading_enabled || settings.auto_trading_mode === 'off') {
      reasons.push('Auto trading is disabled');
      return { isEligible: false, reasons };
    }

    // Check signal source
    if (settings.allowed_signal_sources.length > 0) {
      const signalSource = signal.source || 'legacy';
      const normalizedSource = signalSource === 'ai' ? 'ai_ultra' : 
                                signalSource === 'realtime_ai' ? 'ai_realtime' :
                                signalSource === 'tradingview' ? 'tradingview' : 'legacy';
      
      if (!settings.allowed_signal_sources.includes(normalizedSource)) {
        reasons.push(`Source '${signalSource}' not allowed`);
        return { isEligible: false, reasons };
      }
    }

    // Check direction
    if (settings.allowed_directions.length > 0) {
      const isBuy = signal.signal_type === 'BUY' || signal.signal_type === 'STRONG_BUY';
      const direction = isBuy ? 'long' : 'short';
      
      if (!settings.allowed_directions.includes(direction)) {
        reasons.push(`${direction.toUpperCase()} trades not allowed`);
        return { isEligible: false, reasons };
      }
    }

    // Check confidence
    if (settings.min_signal_confidence !== null && settings.min_signal_confidence !== undefined) {
      if (signal.confidence_score < settings.min_signal_confidence) {
        reasons.push(`Confidence (${signal.confidence_score}%) below minimum (${settings.min_signal_confidence}%)`);
        return { isEligible: false, reasons };
      }
    }

    return { isEligible: true, reasons: [] };
  }, [signal, settings]);
}

