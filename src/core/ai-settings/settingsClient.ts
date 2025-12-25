import { supabase } from '@/integrations/supabase/client';
import type { StoredAISettings } from '@/types/ai-settings';

export async function loadUserSettings(): Promise<StoredAISettings | null> {
  const { data, error } = await supabase.functions.invoke('ai-user-settings', {
    method: 'GET'
  });

  if (error) {
    console.error('Failed to load AI settings:', error);
    return null;
  }

  return (data?.data as StoredAISettings) ?? null;
}

export async function saveUserSettings(payload: Partial<StoredAISettings>) {
  const response = await supabase.functions.invoke('ai-user-settings', {
    method: 'POST',
    headers: { 'x-action': 'save' },
    body: payload
  });

  if (response.error) {
    throw response.error;
  }
}

export async function resetUserSettings() {
  const response = await supabase.functions.invoke('ai-user-settings', {
    method: 'POST',
    headers: { 'x-action': 'reset' }
  });

  if (response.error) {
    throw response.error;
  }
}

