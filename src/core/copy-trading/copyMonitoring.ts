/**
 * Copy Trading Monitoring & Alerts
 * 
 * Phase X.17 - Monitoring & Alerts
 * 
 * System monitoring and alerting for copy trading
 */

import { supabase } from '@/integrations/supabase/client';

export type AlertType = 
  | 'HIGH_DRAWDOWN'
  | 'LOSS_LIMIT_REACHED'
  | 'STRATEGY_PAUSED'
  | 'FOLLOWER_STOPPED'
  | 'TRADE_FAILURE'
  | 'PERFORMANCE_DROP'
  | 'UNUSUAL_ACTIVITY';

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  strategy_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  resolved_at?: string;
  is_resolved: boolean;
}

/**
 * Create alert
 */
export async function createAlert(
  type: AlertType,
  severity: Alert['severity'],
  title: string,
  message: string,
  options?: {
    strategyId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; alertId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('copy_trading_alerts')
      .insert({
        type,
        severity,
        title,
        message,
        strategy_id: options?.strategyId || null,
        user_id: options?.userId || null,
        metadata: options?.metadata || null,
        is_resolved: false,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Send notification if critical
    if (severity === 'critical' && options?.userId) {
      await supabase.from('notifications').insert({
        user_id: options.userId,
        type: 'copy_trading_alert',
        title: `🚨 ${title}`,
        message,
        is_read: false,
      });
    }

    return { success: true, alertId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get alerts
 */
export async function getAlerts(
  filters?: {
    userId?: string;
    strategyId?: string;
    type?: AlertType;
    severity?: Alert['severity'];
    resolved?: boolean;
    limit?: number;
  }
): Promise<{ data: Alert[]; error?: string }> {
  try {
    let query = (supabase as any)
      .from('copy_trading_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.strategyId) {
      query = query.eq('strategy_id', filters.strategyId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.resolved !== undefined) {
      query = query.eq('is_resolved', filters.resolved);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: ((data || []) as unknown as Alert[]) };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve alert
 */
export async function resolveAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('copy_trading_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

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
 * Monitor strategy performance
 */
export async function monitorStrategyPerformance(
  strategyId: string
): Promise<void> {
  try {
    // Get strategy performance
    const { data: performance } = await (supabase as any)
      .from('copy_strategy_performance')
      .select('*')
      .eq('strategy_id', strategyId)
      .maybeSingle();

    if (!performance) {
      return;
    }

    const perf = performance as any;

    // Check for high drawdown
    if (perf.max_drawdown && perf.max_drawdown > 20) {
      await createAlert(
        'HIGH_DRAWDOWN',
        perf.max_drawdown > 40 ? 'critical' : 'high',
        'High Drawdown Detected',
        `Strategy has ${perf.max_drawdown.toFixed(2)}% drawdown`,
        { strategyId }
      );
    }

    // Check for performance drop
    if (perf.last_7d_return && perf.last_7d_return < -10) {
      await createAlert(
        'PERFORMANCE_DROP',
        'high',
        'Performance Drop',
        `Strategy lost ${Math.abs(perf.last_7d_return).toFixed(2)}% in the last 7 days`,
        { strategyId }
      );
    }

    // Check win rate
    if (perf.win_rate && perf.win_rate < 30) {
      await createAlert(
        'PERFORMANCE_DROP',
        'medium',
        'Low Win Rate',
        `Strategy win rate is ${perf.win_rate.toFixed(1)}%`,
        { strategyId }
      );
    }
  } catch (error) {
    console.error('Error monitoring strategy performance:', error);
  }
}

/**
 * Monitor follower activity
 */
export async function monitorFollowerActivity(
  followerId: string,
  strategyId: string
): Promise<void> {
  try {
    // Get recent trades
    const { data: trades } = await (supabase as any)
      .from('copy_trades_log')
      .select('*')
      .eq('follower_user_id', followerId)
      .eq('strategy_id', strategyId)
      .eq('status', 'FAILED')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Alert if too many failures
    if (trades && trades.length > 5) {
      await createAlert(
        'TRADE_FAILURE',
        'high',
        'Multiple Trade Failures',
        `${trades.length} trades failed in the last 24 hours`,
        { userId: followerId, strategyId }
      );
    }
  } catch (error) {
    console.error('Error monitoring follower activity:', error);
  }
}

