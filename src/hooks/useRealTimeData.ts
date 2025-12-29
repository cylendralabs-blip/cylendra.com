
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BotSettingsForm } from '@/types/botSettings';
import { fetchBotSettings, fetchTradingPerformance, fetchActiveTrades } from '@/utils/dataFetchers';
import { calculateRealTimeStats } from '@/utils/statsCalculator';
import { setupRealtimeSubscriptions } from '@/utils/realtimeSubscriptions';

interface RealTimeStats {
  totalProfit: number;
  profitPercentage: number;
  activeTradesCount: number;
  winRate: number;
  currentRiskPercentage: number;
  strategyType: string;
}

export const useRealTimeData = () => {
  const { user } = useAuth();
  const [realStats, setRealStats] = useState<RealTimeStats | null>(null);
  const [botSettings, setBotSettings] = useState<BotSettingsForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching bot settings and trades data...');
      
      // Fetch bot settings first
      const settings = await fetchBotSettings(user.id);
      setBotSettings(settings);

      // Try to fetch performance data, but handle gracefully if no data exists
      let performance = null;
      try {
        performance = await fetchTradingPerformance(user.id);
      } catch (error) {
        console.log('No performance data found, using defaults');
        performance = null;
      }

      // Fetch active trades
      const trades = await fetchActiveTrades(user.id);

      // Calculate real-time statistics with fallback values
      const stats = calculateRealTimeStats(performance, trades, settings);
      setRealStats(stats);

      console.log('Data fetched successfully');
    } catch (error) {
      console.warn('Error fetching real-time data:', error);
      // Set default values on error
      setRealStats({
        totalProfit: 0,
        profitPercentage: 0,
        activeTradesCount: 0,
        winRate: 0,
        currentRiskPercentage: 2.0,
        strategyType: 'basic_dca'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchAllData();

    // Only set up realtime if user exists and we're not in loading state
    let channel: any = null;
    const setupRealtime = async () => {
      try {
        channel = setupRealtimeSubscriptions(() => {
          console.log('Realtime update received, refreshing data...');
          fetchAllData();
        });
      } catch (error) {
        console.log('Realtime subscriptions not available, continuing without real-time updates');
      }
    };

    // Delay realtime setup to avoid immediate errors
    const timeoutId = setTimeout(setupRealtime, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.log('Channel cleanup completed');
        }
      }
    };
  }, [user]);

  return {
    realStats,
    botSettings,
    isLoading
  };
};
