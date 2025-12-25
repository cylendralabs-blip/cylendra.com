/**
 * AI Configuration
 * 
 * Phase 18: Move AI provider/model/api-key settings to config
 */

import { supabase } from '@/integrations/supabase/client';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  enableStreaming: boolean;
}

/**
 * Default AI Configuration (fallback)
 */
const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 30000,
  enableStreaming: true,
};

/**
 * Get AI configuration from environment or system settings
 */
export async function getAIConfig(): Promise<AIConfig> {
  try {
    // Try to get from system_settings table first
    const { data: settings, error } = await (supabase as any)
      .from('system_settings')
      .select('*')
      .eq('key', 'ai_config')
      .maybeSingle();

    if (!error && settings) {
      const settingsData = settings as { value?: any };
      if (settingsData.value) {
        try {
          const config = JSON.parse(typeof settingsData.value === 'string' ? settingsData.value : JSON.stringify(settingsData.value));
          return { ...DEFAULT_AI_CONFIG, ...config };
        } catch (parseError) {
          console.warn('Error parsing AI config from database:', parseError);
        }
      }
    }

    // Fallback to environment variables
    const provider = (import.meta.env.VITE_AI_PROVIDER || DEFAULT_AI_CONFIG.provider) as 'openai' | 'anthropic' | 'local';
    const model = import.meta.env.VITE_AI_MODEL || DEFAULT_AI_CONFIG.model;
    
    // Get API key based on provider
    let apiKey: string | undefined;
    if (provider === 'openai') {
      apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    } else if (provider === 'anthropic') {
      apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    }

    return {
      ...DEFAULT_AI_CONFIG,
      provider,
      model,
      apiKey,
    };
  } catch (error) {
    console.error('Error getting AI config:', error);
    return DEFAULT_AI_CONFIG;
  }
}

/**
 * Update AI configuration in system settings
 */
export async function updateAIConfig(config: Partial<AIConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('system_settings')
      .upsert({
        key: 'ai_config',
        value: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

