/**
 * Bot Control Hook
 * Phase 3: Backend Implementation - Bot Start/Stop Logic
 * 
 * React hook for controlling bot lifecycle
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  startBot,
  stopBot,
  getBotStatus,
  canStartBot,
  canChangeStrategy,
  type BotStatus,
  type BotStatusData
} from '@/services/bot/BotControlService';

/**
 * Hook to get bot status
 * Uses direct DB query instead of Edge Function for better performance
 */
export function useBotStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot-status', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Query database directly instead of Edge Function
      const { supabase } = await import('@/integrations/supabase/client');

      // First, get bot_settings without joins to avoid foreign key errors
      const { data: settings, error: settingsError } = await supabase
        .from('bot_settings')
        .select('status, is_active, strategy_instance_id, active_strategy_instance_id, last_started_at, last_stopped_at, error_message')
        .eq('user_id', user.id)
        .maybeSingle();

      // Ignore PGRST116 error (no rows returned) - this is expected for new users
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching bot settings:', settingsError);
        throw settingsError;
      }

      // Return default values if no settings exist yet
      if (!settings) {
        return {
          status: 'STOPPED',
          isActive: false,
          activeStrategy: undefined,
          lastStartedAt: undefined,
          lastStoppedAt: undefined,
          errorMessage: undefined
        } as BotStatusData;
      }

      // Determine which strategy to show:
      // - If bot is running, show active_strategy_instance_id (locked version)
      // - Otherwise, show strategy_instance_id (selected strategy)
      const strategyIdToFetch = settings.status === 'RUNNING'
        ? settings.active_strategy_instance_id
        : (settings.strategy_instance_id || settings.active_strategy_instance_id);

      // If there's a strategy instance, fetch it separately
      let activeStrategy = undefined;
      if (strategyIdToFetch) {
        const { data: strategyData, error: strategyError } = await supabase
          .from('strategy_instances')
          .select(`
            id,
            name,
            version,
            template:template_id (
              name,
              key
            )
          `)
          .eq('id', strategyIdToFetch)
          .maybeSingle();

        // Only log error, don't throw - strategy might have been deleted
        if (strategyError && strategyError.code !== 'PGRST116') {
          console.warn('Error fetching strategy:', strategyError);
        }

        if (strategyData) {
          activeStrategy = {
            id: strategyData.id,
            name: strategyData.name,
            version: strategyData.version,
            template: strategyData.template
          };
        }
      }

      return {
        status: settings.status || 'STOPPED',
        isActive: settings.is_active || false,
        activeStrategy,
        lastStartedAt: settings.last_started_at,
        lastStoppedAt: settings.last_stopped_at,
        errorMessage: settings.error_message
      } as BotStatusData;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 3000
  });
}

/**
 * Hook to start bot
 */
export function useStartBot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startBot,
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: 'تم تشغيل البوت ✅',
          description: response.message || 'البوت يعمل الآن',
        });
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['bot-status'] });
        queryClient.invalidateQueries({ queryKey: ['bot-settings'] });
      } else {
        toast({
          title: 'فشل تشغيل البوت ❌',
          description: response.error || 'حدث خطأ أثناء تشغيل البوت',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل تشغيل البوت ❌',
        description: error.message || 'حدث خطأ أثناء تشغيل البوت',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to stop bot
 */
export function useStopBot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopBot,
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: 'تم إيقاف البوت ✅',
          description: response.message || 'البوت متوقف الآن',
        });
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['bot-status'] });
        queryClient.invalidateQueries({ queryKey: ['bot-settings'] });
      } else {
        toast({
          title: 'فشل إيقاف البوت ❌',
          description: response.error || 'حدث خطأ أثناء إيقاف البوت',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل إيقاف البوت ❌',
        description: error.message || 'حدث خطأ أثناء إيقاف البوت',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Hook to check if bot can be started
 * Derives from bot status instead of separate query
 */
export function useCanStartBot() {
  const status = useBotStatus();

  if (!status.data) {
    return {
      data: { canStart: false, reason: 'Loading...' },
      isLoading: status.isLoading
    };
  }

  const canStart =
    status.data.status !== 'RUNNING' &&
    !!status.data.activeStrategy;

  const reason =
    status.data.status === 'RUNNING' ? 'Bot is already running' :
    !status.data.activeStrategy ? 'No strategy selected' :
    undefined;

  return {
    data: { canStart, reason },
    isLoading: status.isLoading
  };
}

/**
 * Hook to check if strategy can be changed
 * Derives from bot status instead of separate query
 */
export function useCanChangeStrategy() {
  const status = useBotStatus();

  if (!status.data) {
    return {
      data: { canChange: false, reason: 'Loading...' },
      isLoading: status.isLoading
    };
  }

  const canChange = status.data.status !== 'RUNNING';
  const reason = canChange ? undefined : 'Bot is running. Please stop it first to change strategy.';

  return {
    data: { canChange, reason },
    isLoading: status.isLoading
  };
}

/**
 * Combined hook for bot control
 */
export function useBotControl() {
  const status = useBotStatus();
  const startMutation = useStartBot();
  const stopMutation = useStopBot();
  const canStart = useCanStartBot();
  const canChange = useCanChangeStrategy();

  return {
    // Status
    status: status.data?.status || 'STOPPED',
    isRunning: status.data?.status === 'RUNNING',
    isStopped: status.data?.status === 'STOPPED',
    isError: status.data?.status === 'ERROR',
    statusData: status.data,
    isLoadingStatus: status.isLoading,

    // Actions
    start: startMutation.mutate,
    stop: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,

    // Permissions
    canStart: canStart.data?.canStart || false,
    canStartReason: canStart.data?.reason,
    canChangeStrategy: canChange.data?.canChange || false,
    canChangeStrategyReason: canChange.data?.reason
  };
}

