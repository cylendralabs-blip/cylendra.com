import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  loadUserSettings,
  saveUserSettings,
  resetUserSettings,
  mergeWithDefaults,
  buildEffectiveSettings
} from '@/core/ai-settings';
import type { StoredAISettings, UserAISettings } from '@/types/ai-settings';

export function useAISettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const data = await loadUserSettings();
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: saveUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    }
  });

  const resetMutation = useMutation({
    mutationFn: resetUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
    }
  });

  return {
    settings: settingsQuery.data as StoredAISettings | null,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    saveSettings: saveMutation.mutateAsync,
    resetSettings: resetMutation.mutateAsync,
    saving: saveMutation.isPending,
    resetting: resetMutation.isPending,
    mergeWithDefaults,
    buildEffectiveSettings
  };
}

