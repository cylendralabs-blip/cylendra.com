/**
 * Support Actions Service
 * 
 * Phase Admin D: Admin support tools and actions
 */

import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './AdminActivityService';
import { logTimelineEvent } from './UserTimelineService';

/**
 * Force portfolio sync for a user
 */
export async function forcePortfolioSync(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log admin action
    await logAdminAction({
      adminId,
      action: 'force_portfolio_sync',
      targetType: 'user',
      targetId: userId,
      metadata: { timestamp: new Date().toISOString() },
    });

    // Log timeline event
    await logTimelineEvent(
      userId,
      'admin_force_portfolio_sync',
      'admin_action',
      'Portfolio sync forced by admin',
      {
        source: 'admin',
        severity: 'info',
      }
    );

    // Trigger portfolio sync Edge Function
    const { data, error } = await supabase.functions.invoke('portfolio-sync-worker', {
      body: { user_id: userId, force: true },
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

/**
 * Force position refresh for a user
 */
export async function forcePositionRefresh(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await logAdminAction({
      adminId,
      action: 'force_position_refresh',
      targetType: 'user',
      targetId: userId,
      metadata: { timestamp: new Date().toISOString() },
    });

    await logTimelineEvent(
      userId,
      'admin_force_position_refresh',
      'admin_action',
      'Position refresh forced by admin',
      {
        source: 'admin',
        severity: 'info',
      }
    );

    // Trigger position monitor Edge Function
    const { data, error } = await supabase.functions.invoke('position-monitor-worker', {
      body: { user_id: userId, force: true },
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

/**
 * Disable trading for a user
 */
export async function disableUserTrading(
  userId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user trading status
    const { error: updateError } = await (supabase as any)
      .from('user_trading_status')
      .upsert({
        user_id: userId,
        trading_enabled: false,
        reason: reason || 'Disabled by admin',
        updated_by: adminId,
      }, {
        onConflict: 'user_id',
      });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await logAdminAction({
      adminId,
      action: 'disable_trading',
      targetType: 'user',
      targetId: userId,
      metadata: { reason: reason || 'Disabled by admin' },
    });

    await logTimelineEvent(
      userId,
      'admin_disable_trading',
      'admin_action',
      'Trading disabled by admin',
      {
        description: reason || 'Trading disabled by admin',
        source: 'admin',
        severity: 'warning',
      }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset user risk limits
 */
export async function resetUserRiskLimits(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Reset risk limits in risk_snapshots or risk_limits table
    // This would depend on your risk management structure

    await logAdminAction({
      adminId,
      action: 'reset_risk_limits',
      targetType: 'user',
      targetId: userId,
      metadata: { timestamp: new Date().toISOString() },
    });

    await logTimelineEvent(
      userId,
      'admin_reset_risk_limits',
      'admin_action',
      'Risk limits reset by admin',
      {
        source: 'admin',
        severity: 'info',
      }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Force bot execution for a user
 */
export async function forceBotExecution(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await logAdminAction({
      adminId,
      action: 'force_bot_execution',
      targetType: 'user',
      targetId: userId,
      metadata: { timestamp: new Date().toISOString() },
    });

    await logTimelineEvent(
      userId,
      'admin_force_bot_execution',
      'admin_action',
      'Bot execution forced by admin',
      {
        source: 'admin',
        severity: 'info',
      }
    );

    // Trigger auto-trader worker
    const { data, error } = await supabase.functions.invoke('auto-trader-worker', {
      body: { user_id: userId, force: true },
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

/**
 * Clear cached data for a user
 */
export async function clearUserCache(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Clear cache based on your caching implementation
    // This might involve clearing Redis cache, Supabase cache, etc.

    await logAdminAction({
      adminId,
      action: 'clear_user_cache',
      targetType: 'user',
      targetId: userId,
      metadata: { timestamp: new Date().toISOString() },
    });

    await logTimelineEvent(
      userId,
      'admin_clear_cache',
      'admin_action',
      'Cache cleared by admin',
      {
        source: 'admin',
        severity: 'info',
      }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

