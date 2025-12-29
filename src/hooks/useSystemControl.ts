/**
 * useSystemControl Hook
 * 
 * Phase X.14 - System Control Center
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { SystemStatus, SystemSetting, SystemLog, RecoveryEvent, SystemHealthSummary, SystemStatistics } from '@/core/system/types';

/**
 * Fetch system health
 */
export function useSystemHealth() {
  return useQuery<SystemHealthSummary, Error>({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('system-health-check', {
          method: 'GET',
        });

        if (error) {
          console.error('System health check error:', error);
          // Return empty summary on error instead of throwing
          return {} as SystemHealthSummary;
        }
        return data?.summary || data || {};
      } catch (error) {
        console.error('System health check exception:', error);
        return {} as SystemHealthSummary;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
    retry: 1, // Only retry once
  });
}

/**
 * Fetch system statuses
 */
export function useSystemStatuses() {
  return useQuery<SystemStatus[], Error>({
    queryKey: ['system-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_status' as any)
        .select('*')
        .order('service_name');

      if (error) throw error;
      return (data || []) as SystemStatus[];
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

/**
 * Fetch system settings
 */
export function useSystemSettings() {
  return useQuery<Record<string, any>, Error>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('system-settings', {
          method: 'GET',
        });

        if (error) {
          console.error('System settings error:', error);
          // Return empty settings on error instead of throwing
          return {};
        }
        return data?.settings || data || {};
      } catch (error) {
        console.error('System settings exception:', error);
        return {};
      }
    },
    staleTime: 60000,
    retry: 1, // Only retry once
  });
}

/**
 * Update system setting
 */
export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('system-settings', {
        body: {
          setting_key: key,
          setting_value: value,
          description,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

/**
 * Fetch system logs
 */
export function useSystemLogs(limit: number = 200, level?: string, source?: string) {
  return useQuery<SystemLog[], Error>({
    queryKey: ['system-logs', limit, level, source],
    queryFn: async () => {
      let query = supabase
        .from('system_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (level) {
        query = query.eq('level', level);
      }

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as SystemLog[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}

/**
 * Write system log
 */
export function useWriteSystemLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
      source: string;
      message: string;
      metadata?: Record<string, any>;
      stack_trace?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('system-logs-writer', {
        body: log,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    },
  });
}

/**
 * Fetch recovery events
 */
export function useRecoveryEvents(serviceName?: string, limit: number = 50) {
  return useQuery<RecoveryEvent[], Error>({
    queryKey: ['recovery-events', serviceName, limit],
    queryFn: async () => {
      let query = supabase
        .from('recovery_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (serviceName) {
        query = query.eq('service_name', serviceName);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as RecoveryEvent[];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

/**
 * Trigger recovery
 */
export function useTriggerRecovery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ service_name, action }: { service_name: string; action: 'restart' | 'cleanup' | 'reset' | 'reconnect' | 'rebuild_cache' }) => {
      if (!user) throw new Error('Authentication required');

      const { data, error } = await supabase.functions.invoke('recovery-engine', {
        body: {
          service_name,
          action,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-events'] });
      queryClient.invalidateQueries({ queryKey: ['system-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });
}

/**
 * Fetch system statistics
 */
export function useSystemStatistics(hours: number = 24) {
  return useQuery<SystemStatistics, Error>({
    queryKey: ['system-statistics', hours],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_system_statistics' as any, { p_hours: hours });

      if (error) throw error;
      return data as SystemStatistics;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

