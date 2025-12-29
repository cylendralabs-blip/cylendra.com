/**
 * Bot Control Service
 * Phase 3: Backend Implementation - Bot Start/Stop Logic
 * 
 * Frontend service for controlling bot lifecycle
 */

import { supabase } from '@/integrations/supabase/client';

export type BotStatus = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';

export interface BotControlResponse {
  success: boolean;
  status?: BotStatus;
  message?: string;
  error?: string;
  data?: any;
}

export interface BotStatusData {
  status: BotStatus;
  isActive: boolean;
  activeStrategy?: {
    id: string;
    name: string;
    version: number;
    template: {
      name: string;
      key: string;
    };
  };
  lastStartedAt?: string;
  lastStoppedAt?: string;
  errorMessage?: string;
}

/**
 * Start the bot
 */
export async function startBot(): Promise<BotControlResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('bot-control', {
      body: { action: 'START' }
    });

    if (error) {
      throw error;
    }

    return data as BotControlResponse;
  } catch (error) {
    console.error('Error starting bot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start bot'
    };
  }
}

/**
 * Stop the bot
 */
export async function stopBot(): Promise<BotControlResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('bot-control', {
      body: { action: 'STOP' }
    });

    if (error) {
      throw error;
    }

    return data as BotControlResponse;
  } catch (error) {
    console.error('Error stopping bot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop bot'
    };
  }
}

/**
 * Get bot status
 * Note: This function is deprecated. Use useBotStatus() hook instead for better performance.
 * It queries the database directly instead of calling Edge Function.
 */
export async function getBotStatus(): Promise<BotControlResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('bot-control', {
      body: { action: 'STATUS' }
    });

    if (error) {
      throw error;
    }

    return data as BotControlResponse;
  } catch (error) {
    console.error('Error getting bot status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bot status'
    };
  }
}

/**
 * Check if bot can be started
 */
export async function canStartBot(userId: string): Promise<{ canStart: boolean; reason?: string }> {
  try {
    const { data: settings, error } = await supabase
      .from('bot_settings')
      .select('status, strategy_instance_id')
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      return { canStart: false, reason: 'Bot settings not found' };
    }

    if (settings.status === 'RUNNING') {
      return { canStart: false, reason: 'Bot is already running' };
    }

    if (!settings.strategy_instance_id) {
      return { canStart: false, reason: 'No strategy selected' };
    }

    return { canStart: true };
  } catch (error) {
    console.error('Error checking if bot can start:', error);
    return { canStart: false, reason: 'Error checking bot status' };
  }
}

/**
 * Check if strategy can be changed
 */
export async function canChangeStrategy(userId: string): Promise<{ canChange: boolean; reason?: string }> {
  try {
    const { data: settings, error } = await supabase
      .from('bot_settings')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      return { canChange: false, reason: 'Bot settings not found' };
    }

    if (settings.status === 'RUNNING') {
      return { canChange: false, reason: 'Bot is running. Please stop it first to change strategy.' };
    }

    return { canChange: true };
  } catch (error) {
    console.error('Error checking if strategy can be changed:', error);
    return { canChange: false, reason: 'Error checking bot status' };
  }
}

