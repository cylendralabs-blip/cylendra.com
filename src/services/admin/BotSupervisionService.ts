/**
 * Bot Supervision Service
 * 
 * Phase Admin B: Bot management and intervention tools
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './AdminActivityService';

export interface BotInfo {
  id: string;
  user_id: string;
  user_email?: string;
  bot_name: string;
  strategy_type: string;
  is_active: boolean;
  last_execution_time?: string;
  last_trade_result?: 'success' | 'failure' | 'partial';
  last_error?: string;
  status: 'running' | 'paused' | 'failed' | 'stopped';
  total_capital: number;
  current_trades_count: number;
}

/**
 * Get all bots across all users
 */
export async function getAllBots(): Promise<{ bots: BotInfo[]; error?: string }> {
  try {
    const { data: botSettings, error } = await (supabase as any)
      .from('bot_settings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching bots:', error);
      return { bots: [], error: error.message };
    }

    // Get all user emails in batch via admin-users Edge Function
    const userIds = (botSettings || []).map((bot: any) => bot.user_id);
    const userEmailMap = new Map<string, string>();
    
    try {
      // Fetch all users via Edge Function to get emails
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { action: 'list' }
      });
      
      if (!usersError && usersData?.users) {
        usersData.users.forEach((user: any) => {
          if (user.id && user.email) {
            userEmailMap.set(user.id, user.email);
          }
        });
      }
    } catch (e) {
      console.warn('Could not fetch users from Edge Function:', e);
    }

    // Enrich with user data and trade counts
    const bots: BotInfo[] = await Promise.all(
      ((botSettings || []) as any[]).map(async (bot: any) => {
        // Get user email from map (fetched via Edge Function)
        const userEmail = userEmailMap.get(bot.user_id);

        // Get active trades count
        const { count: activeTradesCount } = await (supabase as any)
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', bot.user_id)
          .in('status', ['ACTIVE', 'OPEN', 'PENDING']);

        return {
          id: bot.id,
          user_id: bot.user_id,
          user_email: userEmail,
          bot_name: bot.bot_name || 'Unnamed Bot',
          strategy_type: bot.strategy_type || 'unknown',
          is_active: bot.is_active || false,
          status: bot.is_active ? 'running' : 'stopped',
          total_capital: bot.total_capital || 0,
          current_trades_count: activeTradesCount || 0,
          // TODO: Get last execution time and results from execution logs
        };
      })
    );

    return { bots };
  } catch (error) {
    console.error('Error in getAllBots:', error);
    return {
      bots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pause a bot
 */
export async function pauseBot(botId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('bot_settings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', botId);

    if (error) {
      console.error('Error pausing bot:', error);
      return { success: false, error: error.message };
    }

    // Log admin action
    await logAdminAction('BOT_PAUSED', {
      targetType: 'bot',
      targetId: botId,
      metadata: { bot_id: botId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in pauseBot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resume a bot
 */
export async function resumeBot(botId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('bot_settings')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', botId);

    if (error) {
      console.error('Error resuming bot:', error);
      return { success: false, error: error.message };
    }

    // Log admin action
    await logAdminAction('BOT_RESUMED', {
      targetType: 'bot',
      targetId: botId,
      metadata: { bot_id: botId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in resumeBot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disable all bots for a user
 */
export async function disableAllUserBots(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await (supabase as any)
      .from('bot_settings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error disabling user bots:', error);
      return { success: false, error: error.message };
    }

    // Log admin action
    await logAdminAction('ALL_USER_BOTS_DISABLED', {
      targetType: 'user',
      targetId: userId,
      metadata: { user_id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in disableAllUserBots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

